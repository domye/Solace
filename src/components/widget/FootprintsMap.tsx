/**
 * 足迹地图组件 - Echarts 中国地图（性能优化版）
 * 优化策略：
 * 1. R-Tree 空间索引 - 点查询 O(log n)
 * 2. 并行加载省级 GeoJSON - Promise.all
 * 3. localStorage 缓存 - 避免重复网络请求
 * 4. 预计算映射 - tooltip 零查找
 */

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as echarts from "echarts";
import type { FootprintCity } from "@/types";
import { useThemeStore } from "@/stores/theme";

// 缓存版本号（GeoJSON 数据结构变化时递增）
const CACHE_VERSION = 1;
const CACHE_KEY = `footprints_geojson_v${CACHE_VERSION}`;

// 中国省份 GeoJSON（详细版，包含省级划分）
const chinaGeoJsonUrl =
	"https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json";

// 市级 GeoJSON URL 模板
const cityGeoJsonUrlTemplate =
	"https://geo.datav.aliyun.com/areas_v3/bound/{adcode}_full.json";

// 直辖市 adcode
const MUNICIPALITY_ADCODES = new Set(["110000", "120000", "310000", "500000"]);

// 预计算的色调映射表（已排序，用于二分查找）
const HUE_TABLE: ReadonlyArray<readonly [number, string, string]> = [
	[0, "#f87171", "#ef4444"],
	[30, "#fb923c", "#f97316"],
	[60, "#facc15", "#eab308"],
	[120, "#4ade80", "#22c55e"],
	[180, "#22d3ee", "#06b6d4"],
	[210, "#38bdf8", "#0ea5e9"],
	[240, "#818cf8", "#6366f1"],
	[250, "#60a5fa", "#3b82f6"],
	[270, "#a78bfa", "#8b5cf6"],
	[300, "#f472b6", "#ec4899"],
	[330, "#fb7185", "#f43f5e"],
] as const;

function hueToHex(hue: number, isDark: boolean): string {
	// 二分查找最近色调
	let left = 0, right = HUE_TABLE.length - 1;
	while (left < right) {
		const mid = (left + right) >>> 1;
		if (HUE_TABLE[mid]![0] < hue) left = mid + 1;
		else right = mid;
	}

	const curr = HUE_TABLE[left]!;
	if (left > 0) {
		const prev = HUE_TABLE[left - 1]!;
		if (Math.abs(prev[0] - hue) < Math.abs(curr[0] - hue)) {
			return isDark ? prev[1] : prev[2];
		}
	}
	return isDark ? curr[1] : curr[2];
}

// 点是否在多边形内（射线法优化版）
function pointInPolygon(x: number, y: number, polygon: number[][]): boolean {
	let inside = false;
	const len = polygon.length;

	for (let i = 0, j = len - 1; i < len; j = i++) {
		const pI = polygon[i];
		const pJ = polygon[j];
		if (!pI || !pJ) continue;

		const xi = pI[0];
		const yi = pI[1];
		const xj = pJ[0];
		const yj = pJ[1];

		if (xi === undefined || yi === undefined || xj === undefined || yj === undefined) continue;

		if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
			inside = !inside;
		}
	}

	return inside;
}

// 边界框
interface BBox {
	minLng: number;
	maxLng: number;
	minLat: number;
	maxLat: number;
}

// R-Tree 节点
interface RTreeNode {
	bbox: BBox;
	children?: RTreeNode[];
	feature?: Feature;
}

// 计算边界框
function computeBBox(coords: number[][][]): BBox {
	let minLng = Infinity, maxLng = -Infinity;
	let minLat = Infinity, maxLat = -Infinity;

	for (const polygon of coords) {
		for (const point of polygon) {
			const lng = point[0];
			const lat = point[1];
			if (lng !== undefined && lat !== undefined) {
				if (lng < minLng) minLng = lng;
				if (lng > maxLng) maxLng = lng;
				if (lat < minLat) minLat = lat;
				if (lat > maxLat) maxLat = lat;
			}
		}
	}
	return { minLng, maxLng, minLat, maxLat };
}

// 简化的 R-Tree 构建（批量加载）
function buildRTree(features: Feature[]): RTreeNode {
	if (features.length === 0) {
		return { bbox: { minLng: 0, maxLng: 0, minLat: 0, maxLat: 0 } };
	}

	// 叶子节点容量
	const MAX_LEAF = 16;

	if (features.length <= MAX_LEAF) {
		let minLng = Infinity, maxLng = -Infinity;
		let minLat = Infinity, maxLat = -Infinity;

		for (const f of features) {
			if (f.bbox.minLng < minLng) minLng = f.bbox.minLng;
			if (f.bbox.maxLng > maxLng) maxLng = f.bbox.maxLng;
			if (f.bbox.minLat < minLat) minLat = f.bbox.minLat;
			if (f.bbox.maxLat > maxLat) maxLat = f.bbox.maxLat;
		}

		return {
			bbox: { minLng, maxLng, minLat, maxLat },
			children: features.map(f => ({ bbox: f.bbox, feature: f }))
		};
	}

	// 按 X 坐标排序分组
	const sorted = [...features].sort((a, b) => a.bbox.minLng - b.bbox.minLng);
	const groupSize = Math.ceil(sorted.length / Math.ceil(Math.sqrt(sorted.length / MAX_LEAF)));
	const groups: Feature[][] = [];

	for (let i = 0; i < sorted.length; i += groupSize) {
		groups.push(sorted.slice(i, i + groupSize));
	}

	const children = groups.map(g => buildRTree(g));

	// 合并边界框
	let minLng = Infinity, maxLng = -Infinity;
	let minLat = Infinity, maxLat = -Infinity;
	for (const child of children) {
		if (child.bbox.minLng < minLng) minLng = child.bbox.minLng;
		if (child.bbox.maxLng > maxLng) maxLng = child.bbox.maxLng;
		if (child.bbox.minLat < minLat) minLat = child.bbox.minLat;
		if (child.bbox.maxLat > maxLat) maxLat = child.bbox.maxLat;
	}

	return { bbox: { minLng, maxLng, minLat, maxLat }, children };
}

// R-Tree 查询
function queryRTree(node: RTreeNode, lng: number, lat: number): Feature[] {
	const { bbox, children, feature } = node;

	// 边界框检查
	if (lng < bbox.minLng || lng > bbox.maxLng || lat < bbox.minLat || lat > bbox.maxLat) {
		return [];
	}

	if (feature) {
		return [feature];
	}

	if (!children) return [];

	const results: Feature[] = [];
	for (const child of children) {
		results.push(...queryRTree(child, lng, lat));
	}
	return results;
}

interface GeoJSON {
	type: string;
	features: Array<{
		type: string;
		geometry: {
			type: string;
			coordinates: number[][][] | number[][][][];
		} | null;
		properties?: {
			name?: string;
			adcode?: string | number;
		};
	}>;
}

interface Feature {
	name: string;
	adcode: string;
	bbox: BBox;
	coords: number[][][]; // 统一为 Polygon 数组
}

// 缓存数据结构
interface CacheData {
	china: GeoJSON;
	provinceFeatures: Record<string, Feature[]>;
	mergedFeatures: GeoJSON["features"];
	timestamp: number;
}

// 解析 GeoJSON 为 Feature 数组
function parseFeatures(geoJson: GeoJSON): Feature[] {
	const features: Feature[] = [];

	for (const f of geoJson.features) {
		const geometry = f.geometry;
		if (!geometry) continue;

		const coords = geometry.type === "Polygon"
			? [geometry.coordinates as number[][][]]
			: geometry.type === "MultiPolygon"
				? (geometry.coordinates as number[][][][])
				: [];

		if (coords.length === 0) continue;

		// 展开所有 polygon
		const allPolygons: number[][][] = [];
		for (const c of coords) {
			// 检查第一个元素是否是数组（判断 Polygon 还是 MultiPolygon）
			const first = c[0];
			if (Array.isArray(first?.[0])) {
				// MultiPolygon: c 是 number[][][]，每个元素是 Polygon
				for (const poly of c as number[][][]) {
					allPolygons.push(poly);
				}
			} else {
				// Polygon: c 直接是 number[][]
				allPolygons.push(c as unknown as number[][]);
			}
		}

		features.push({
			name: f.properties?.name || "",
			adcode: String(f.properties?.adcode || ""),
			bbox: computeBBox(allPolygons),
			coords: allPolygons,
		});
	}

	return features;
}

// 使用 R-Tree 查找省份
function findProvinceByCoords(
	tree: RTreeNode,
	lat: number,
	lng: number
): { name: string; adcode: string } | null {
	const candidates = queryRTree(tree, lng, lat);

	for (const f of candidates) {
		for (const polygon of f.coords) {
			if (pointInPolygon(lng, lat, polygon)) {
				return { name: f.name, adcode: f.adcode };
			}
		}
	}

	return null;
}

interface FootprintsMapProps {
	cities: FootprintCity[];
}

// 提取城市区域映射的逻辑
function computeCityRegionMap(
	cacheData: CacheData | null,
	citiesWithCoords: Array<FootprintCity & { coords: NonNullable<FootprintCity["coords"]> }>
): Map<string, string> {
	if (!cacheData) return new Map();

	const result = new Map<string, string>();

	// 处理直辖市
	for (const f of cacheData.china.features) {
		const adcodeStr = String(f.properties?.adcode || "");
		if (MUNICIPALITY_ADCODES.has(adcodeStr)) {
			const name = f.properties?.name || "";
			// 直辖市下查找城市
			const chinaFeatures = parseFeatures(cacheData.china);
			const chinaTree = buildRTree(chinaFeatures);

			for (const city of citiesWithCoords) {
				const found = findProvinceByCoords(chinaTree, city.coords.lat, city.coords.lng);
				if (found && found.adcode === adcodeStr) {
					result.set(city.name, name);
				}
			}
		}
	}

	// 处理普通省份
	for (const [, features] of Object.entries(cacheData.provinceFeatures)) {
		const tree = buildRTree(features);

		for (const city of citiesWithCoords) {
			const candidates = queryRTree(tree, city.coords.lng, city.coords.lat);
			for (const f of candidates) {
				for (const polygon of f.coords) {
					if (pointInPolygon(city.coords.lng, city.coords.lat, polygon)) {
						result.set(city.name, f.name);
						break;
					}
				}
				if (result.has(city.name)) break;
			}
		}
	}

	return result;
}

export function FootprintsMap({ cities }: FootprintsMapProps) {
	const chartRef = useRef<HTMLDivElement>(null);
	const chartInstance = useRef<echarts.ECharts | null>(null);
	const cacheRef = useRef<CacheData | null>(null);
	const [isReady, setIsReady] = useState(false);
	const { theme, hue } = useThemeStore();

	// 缓存城市数据（避免重复 filter）
	const citiesWithCoords = useMemo(
		() => cities.filter((c): c is FootprintCity & { coords: NonNullable<FootprintCity["coords"]> } => !!c.coords),
		[cities]
	);

	// 首次加载 GeoJSON 数据
	useEffect(() => {
		if (!chartRef.current) return;

		const loadGeoJson = async () => {
			// 尝试从 localStorage 读取缓存
			try {
				const cached = localStorage.getItem(CACHE_KEY);
				if (cached) {
					const data = JSON.parse(cached) as CacheData;
					// 缓存有效期 7 天
					if (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
						cacheRef.current = data;
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						echarts.registerMap("china_merged", { type: "FeatureCollection", features: data.mergedFeatures } as any);
						chartInstance.current = echarts.init(chartRef.current);
						setIsReady(true);
						return;
					}
				}
			} catch {
				// 缓存损坏，忽略
			}

			// 加载中国地图
			let chinaGeoJson: GeoJSON;
			try {
				const response = await fetch(chinaGeoJsonUrl);
				chinaGeoJson = await response.json();
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				echarts.registerMap("china", chinaGeoJson as any);
			} catch (e) {
				console.error("加载中国地图数据失败", e);
				return;
			}

			// 解析省份 features 并构建 R-Tree
			const chinaFeatures = parseFeatures(chinaGeoJson);
			const chinaTree = buildRTree(chinaFeatures);

			// 一次性查找所有城市对应的省份
			const provinceMap = new Map<string, { name: string; adcode: string }>();
			const citiesByProvince = new Map<string, typeof citiesWithCoords>();

			for (const city of citiesWithCoords) {
				const province = findProvinceByCoords(chinaTree, city.coords.lat, city.coords.lng);
				if (province && province.adcode) {
					provinceMap.set(province.adcode, province);
					const list = citiesByProvince.get(province.adcode);
					if (list) list.push(city);
					else citiesByProvince.set(province.adcode, [city]);
				}
			}

			// 并行加载所有省级 GeoJSON
			const provinceAdcodes = [...provinceMap.keys()].filter(a => !MUNICIPALITY_ADCODES.has(a));
			const fetchPromises = provinceAdcodes.map(async adcode => {
				try {
					const response = await fetch(cityGeoJsonUrlTemplate.replace("{adcode}", adcode));
					const geoJson: GeoJSON = await response.json();
					return { adcode, features: parseFeatures(geoJson), rawFeatures: geoJson.features };
				} catch {
					return { adcode, features: [] as Feature[], rawFeatures: [] as GeoJSON["features"] };
				}
			});

			const provinceResults = await Promise.all(fetchPromises);

			// 构建省级 feature 映射
			const provinceFeatures: Record<string, Feature[]> = {};
			for (const { adcode, features } of provinceResults) {
				provinceFeatures[adcode] = features;
			}

			// 过滤直辖市下级区域
			const filteredChinaFeatures = chinaGeoJson.features.filter(f => {
				const adcode = String(f.properties?.adcode || "");
				if (adcode.length !== 6) return true;
				for (const m of MUNICIPALITY_ADCODES) {
					if (adcode.startsWith(m.slice(0, 4)) && adcode !== m) return false;
				}
				return true;
			});

			// 合并所有 features
			const mergedFeatures = [...filteredChinaFeatures];
			for (const { rawFeatures } of provinceResults) {
				mergedFeatures.push(...rawFeatures);
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			echarts.registerMap("china_merged", { type: "FeatureCollection", features: mergedFeatures } as any);

			// 缓存数据
			cacheRef.current = {
				china: chinaGeoJson,
				provinceFeatures,
				mergedFeatures,
				timestamp: Date.now(),
			};

			// 写入 localStorage（异步，不阻塞）
			setTimeout(() => {
				try {
					localStorage.setItem(CACHE_KEY, JSON.stringify(cacheRef.current));
				} catch {
					// localStorage 满了，忽略
				}
			}, 0);

			chartInstance.current = echarts.init(chartRef.current);
			setIsReady(true);
		};

		loadGeoJson();

		const handleResize = () => chartInstance.current?.resize();
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			chartInstance.current?.dispose();
			cacheRef.current = null;
			setIsReady(false);
		};
	}, [citiesWithCoords]);

	// 查找城市对应的区域名
	const cityRegionMap = useMemo(() => {
		return computeCityRegionMap(cacheRef.current, citiesWithCoords);
	}, [citiesWithCoords, isReady]);

	// 预计算散点数据
	const scatterData = useMemo(() => citiesWithCoords.map(city => ({
		name: city.name,
		value: [city.coords.lng, city.coords.lat] as [number, number],
		visited_at: city.visited_at,
		highlights: city.highlights,
	})), [citiesWithCoords]);

	// 计算中心点
	const center = useMemo(() => {
		if (scatterData.length === 0) return [105, 36] as [number, number];
		let sumLng = 0, sumLat = 0;
		for (const d of scatterData) {
			sumLng += d.value[0];
			sumLat += d.value[1];
		}
		return [sumLng / scatterData.length, sumLat / scatterData.length] as [number, number];
	}, [scatterData]);

	// 预构建 O(1) 查找表
	const coordToCity = useMemo(() => {
		const m = new Map<string, typeof scatterData[0]>();
		for (const d of scatterData) {
			m.set(`${d.value[0]},${d.value[1]}`, d);
		}
		return m;
	}, [scatterData]);

	const regionToCity = useMemo(() => {
		const m = new Map<string, typeof scatterData[0]>();
		for (const d of scatterData) {
			const region = cityRegionMap.get(d.name);
			if (region) m.set(region, d);
		}
		return m;
	}, [scatterData, cityRegionMap]);

	// 主题相关
	const isDark = theme === "dark";
	const primaryColor = hueToHex(hue, isDark);

	// 构建区域高亮
	const regions = useMemo(() => {
		const r: Array<{
			name: string;
			itemStyle: { areaColor: string };
			label?: { show: boolean };
			emphasis: {
				itemStyle: { areaColor: string };
				label?: { show: boolean; fontFamily: string; fontSize: number };
			};
		}> = [];

		// 市级区域高亮
		for (const [, regionName] of cityRegionMap) {
			r.push({
				name: regionName,
				itemStyle: { areaColor: primaryColor + "60" },
				label: { show: false },
				emphasis: {
					itemStyle: { areaColor: primaryColor + "80" },
					label: { show: true, fontFamily: "MaokenZhuyuanTi", fontSize: 12 },
				},
			});
		}

		return r;
	}, [cityRegionMap, primaryColor]);

	// tooltip formatter
	const tooltipFormatter = useCallback((params: unknown) => {
		const p = params as { name?: string; value?: number[] | string };

		if (Array.isArray(p.value)) {
			const city = coordToCity.get(`${p.value[0]},${p.value[1]}`);
			if (city) {
				return `<div style="padding:4px;font-family:MaokenZhuyuanTi,sans-serif;">
					<strong>${city.name}</strong><br/>
					${city.visited_at || ""}
					${city.highlights?.length ? `<br/><span style="color:#999">${city.highlights.join(", ")}</span>` : ""}
				</div>`;
			}
		}

		if (p.name) {
			const city = regionToCity.get(p.name);
			if (city) {
				return `<div style="padding:4px;font-family:MaokenZhuyuanTi,sans-serif;">
					<strong>${city.name}</strong><br/>
					${city.visited_at || ""}
					${city.highlights?.length ? `<br/><span style="color:#999">${city.highlights.join(", ")}</span>` : ""}
				</div>`;
			}
			return `<span style="font-family:MaokenZhuyuanTi,sans-serif;">${p.name}</span>`;
		}

		return "";
	}, [coordToCity, regionToCity]);

	// 主题变化时更新图表
	useEffect(() => {
		if (!isReady || !chartInstance.current) return;

		const option: echarts.EChartsOption = {
			backgroundColor: "transparent",
			tooltip: {
				trigger: "item",
				formatter: tooltipFormatter,
				extraCssText: "font-family: MaokenZhuyuanTi, sans-serif !important;",
			},
			geo: {
				tooltip: {
					show: true,
					formatter: tooltipFormatter,
					extraCssText: "font-family: MaokenZhuyuanTi, sans-serif !important;",
				},
				map: "china_merged",
				roam: true,
				zoom: 10,
				center,
				regions,
				itemStyle: {
					areaColor: isDark ? "#1e293b" : "#f1f5f9",
					borderColor: isDark ? "#334155" : "#cbd5e1",
					borderWidth: 1,
				},
				emphasis: {
					itemStyle: { areaColor: isDark ? "#334155" : "#e2e8f0" },
					label: { show: true, fontFamily: "MaokenZhuyuanTi", fontSize: 12 },
				},
				label: {
					show: false,
					fontFamily: "MaokenZhuyuanTi",
					fontSize: 10,
					color: isDark ? "#94a3b8" : "#64748b",
				},
			},
			series: [
				{
					type: "scatter",
					coordinateSystem: "geo",
					data: scatterData,
					symbolSize: 6,
					itemStyle: {
						color: primaryColor,
						shadowBlur: 4,
						shadowColor: primaryColor + "80",
					},
					emphasis: {
						itemStyle: {
							color: primaryColor,
							shadowBlur: 8,
							shadowColor: primaryColor,
						},
					},
				},
				{
					type: "effectScatter",
					coordinateSystem: "geo",
					data: scatterData.slice(0, 3),
					symbolSize: 5,
					showEffectOn: "render",
					rippleEffect: {
						brushType: "stroke",
						scale: 4,
						period: 4,
					},
					itemStyle: {
						color: primaryColor,
						shadowBlur: 4,
						shadowColor: primaryColor,
					},
				},
			],
		};

		chartInstance.current.setOption(option, { notMerge: true });
	}, [isReady, theme, hue, center, regions, scatterData, primaryColor, isDark, tooltipFormatter]);

	return (
		<div
			ref={chartRef}
			className="h-[400px] md:h-[500px] w-full rounded-xl overflow-hidden"
		/>
	);
}