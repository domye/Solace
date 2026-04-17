/**
 * 足迹地图组件 - ECharts 中国地图（性能优化版）
 *
 * 优化策略：
 * 1. R-Tree 空间索引 - 点查询 O(log n)
 * 2. 并行加载省级 GeoJSON - Promise.all
 * 3. localStorage 缓存 - 避免重复网络请求
 * 4. 预计算映射 - tooltip 零查找
 */

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as echarts from "echarts/core";
import { MapChart, ScatterChart, EffectScatterChart } from "echarts/charts";
import { GeoComponent, TooltipComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import type { FootprintCity } from "@/types";
import { useThemeStore } from "@/stores/theme";

// 注册 ECharts 模块
echarts.use([
	MapChart,
	ScatterChart,
	EffectScatterChart,
	GeoComponent,
	TooltipComponent,
	SVGRenderer,
]);

// ============================================================
// 常量配置
// ============================================================

const CACHE_VERSION = 2;
const CACHE_KEY = `footprints_geojson_v${CACHE_VERSION}`;
const CACHE_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000;
const CDN_BASE = "https://cdn.jsdelivr.net/npm/china-geojson@1.0.0/src/geojson";
const FONT_FAMILY = "MaokenZhuyuanTi, sans-serif";

const PROVINCE_FILE_MAP: Record<string, string> = {
	北京: "bei_jing",
	天津: "tian_jin",
	河北: "he_bei",
	山西: "shan_xi_1",
	内蒙古: "nei_meng_gu",
	辽宁: "liao_ning",
	吉林: "ji_lin",
	黑龙江: "hei_long_jiang",
	上海: "shang_hai",
	江苏: "jiang_su",
	浙江: "zhe_jiang",
	安徽: "an_hui",
	福建: "fu_jian",
	江西: "jiang_xi",
	山东: "shan_dong",
	河南: "he_nan",
	湖北: "hu_bei",
	湖南: "hu_nan",
	广东: "guang_dong",
	广西: "guang_xi",
	海南: "hai_nan",
	重庆: "chong_qing",
	四川: "si_chuan",
	贵州: "gui_zhou",
	云南: "yun_nan",
	西藏: "xi_zang",
	陕西: "shan_xi_2",
	甘肃: "gan_su",
	青海: "qing_hai",
	宁夏: "ning_xia",
	新疆: "xin_jiang",
	台湾: "tai_wan",
	香港: "xiang_gang",
	澳门: "ao_men",
};

const MUNICIPALITY_NAMES = new Set(["北京", "天津", "上海", "重庆"]);
const CHINA_GEOJSON_URL = `${CDN_BASE}/china.json`;

// ============================================================
// 类型定义
// ============================================================

interface BBox {
	minLng: number;
	maxLng: number;
	minLat: number;
	maxLat: number;
}

interface Feature {
	name: string;
	adcode: string;
	bbox: BBox;
	coords: number[][][];
}

interface RTreeNode {
	bbox: BBox;
	children?: RTreeNode[];
	feature?: Feature;
}

interface GeoJSON {
	type: string;
	features: Array<{
		type: string;
		geometry: {
			type: string;
			coordinates: number[][][] | number[][][][];
		} | null;
		properties?: { name?: string; adcode?: string | number };
	}>;
}

interface CacheData {
	china: GeoJSON;
	provinceFeatures: Record<string, Feature[]>;
	mergedFeatures: GeoJSON["features"];
	timestamp: number;
}

interface CityWithData extends FootprintCity {
	coords: NonNullable<FootprintCity["coords"]>;
}

// ============================================================
// 工具函数
// ============================================================

/** 获取省级 GeoJSON URL */
const getProvinceGeoJsonUrl = (name: string): string | null => {
	const fileName = PROVINCE_FILE_MAP[name];
	return fileName ? `${CDN_BASE}/${fileName}_geo.json` : null;
};

/** 色调映射表（预计算，二分查找） */
const HUE_TABLE: [number, string, string][] = [
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
];

/** 根据 hue 值获取颜色（二分查找） */
function hueToHex(hue: number, isDark: boolean): string {
	let left = 0,
		right = HUE_TABLE.length - 1;
	while (left < right) {
		const mid = (left + right) >>> 1;
		if (HUE_TABLE[mid]![0] < hue) left = mid + 1;
		else right = mid;
	}
	const curr = HUE_TABLE[left]!;
	const prev = left > 0 ? HUE_TABLE[left - 1] : null;
	if (prev && Math.abs(prev[0] - hue) < Math.abs(curr[0] - hue)) {
		return isDark ? prev[1] : prev[2];
	}
	return isDark ? curr[1] : curr[2];
}

/** 射线法判断点是否在多边形内 */
function pointInPolygon(x: number, y: number, polygon: number[][]): boolean {
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const pi = polygon[i];
		const pj = polygon[j];
		if (!pi || !pj) continue;
		const xi = pi[0]!;
		const yi = pi[1]!;
		const xj = pj[0]!;
		const yj = pj[1]!;
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
			inside = !inside;
		}
	}
	return inside;
}

/** 计算坐标集合的边界框 */
function computeBBox(coords: number[][][]): BBox {
	let minLng = Infinity,
		maxLng = -Infinity,
		minLat = Infinity,
		maxLat = -Infinity;
	for (const poly of coords) {
		for (const point of poly) {
			const lng = point[0]!;
			const lat = point[1]!;
			if (lng < minLng) minLng = lng;
			if (lng > maxLng) maxLng = lng;
			if (lat < minLat) minLat = lat;
			if (lat > maxLat) maxLat = lat;
		}
	}
	return { minLng, maxLng, minLat, maxLat };
}

/** 合并多个边界框 */
const mergeBBox = (boxes: BBox[]): BBox => ({
	minLng: Math.min(...boxes.map((b) => b.minLng)),
	maxLng: Math.max(...boxes.map((b) => b.maxLng)),
	minLat: Math.min(...boxes.map((b) => b.minLat)),
	maxLat: Math.max(...boxes.map((b) => b.maxLat)),
});

/** 构建简化的 R-Tree（批量加载） */
function buildRTree(features: Feature[]): RTreeNode {
	if (features.length === 0)
		return { bbox: { minLng: 0, maxLng: 0, minLat: 0, maxLat: 0 } };

	const MAX_LEAF = 16;
	if (features.length <= MAX_LEAF) {
		return {
			bbox: mergeBBox(features.map((f) => f.bbox)),
			children: features.map((f) => ({ bbox: f.bbox, feature: f })),
		};
	}

	const sorted = [...features].sort((a, b) => a.bbox.minLng - b.bbox.minLng);
	const groupSize = Math.ceil(
		sorted.length / Math.ceil(Math.sqrt(sorted.length / MAX_LEAF)),
	);
	const groups = Array.from(
		{ length: Math.ceil(sorted.length / groupSize) },
		(_, i) => sorted.slice(i * groupSize, (i + 1) * groupSize),
	);
	const children = groups.map((g) => buildRTree(g));
	return { bbox: mergeBBox(children.map((c) => c.bbox)), children };
}

/** R-Tree 空间查询 */
function queryRTree(node: RTreeNode, lng: number, lat: number): Feature[] {
	const { bbox, children, feature } = node;
	if (
		lng < bbox.minLng ||
		lng > bbox.maxLng ||
		lat < bbox.minLat ||
		lat > bbox.maxLat
	)
		return [];
	if (feature) return [feature];
	if (!children) return [];
	return children.flatMap((c) => queryRTree(c, lng, lat));
}

/** 解析 GeoJSON 为 Feature 数组 */
function parseFeatures(geoJson: GeoJSON): Feature[] {
	return geoJson.features
		.filter((f) => f.geometry)
		.map((f) => {
			const g = f.geometry!;
			const coords =
				g.type === "Polygon"
					? [g.coordinates as number[][][]]
					: g.type === "MultiPolygon"
						? (g.coordinates as number[][][][])
						: [];

			const allPolygons: number[][][] = [];
			for (const c of coords) {
				const first = c[0]?.[0];
				if (Array.isArray(first)) {
					for (const poly of c as number[][][]) allPolygons.push(poly);
				} else {
					allPolygons.push(c as unknown as number[][]);
				}
			}

			return {
				name: f.properties?.name || "",
				adcode: String(f.properties?.adcode || ""),
				bbox: computeBBox(allPolygons),
				coords: allPolygons,
			};
		});
}

/** 根据坐标查找省份 */
function findProvince(
	tree: RTreeNode,
	lat: number,
	lng: number,
): string | null {
	const candidates = queryRTree(tree, lng, lat);
	for (const f of candidates) {
		if (f.coords.some((poly) => pointInPolygon(lng, lat, poly))) return f.name;
	}
	return null;
}

/** 查找城市对应的区域名 */
function findCityRegions(
	cacheData: CacheData | null,
	cities: CityWithData[],
): Map<string, string> {
	if (!cacheData) return new Map();

	const result = new Map<string, string>();
	const chinaTree = buildRTree(parseFeatures(cacheData.china));

	// 直辖市直接匹配
	for (const city of cities) {
		const province = findProvince(chinaTree, city.coords.lat, city.coords.lng);
		if (province && MUNICIPALITY_NAMES.has(province))
			result.set(city.name, province);
	}

	// 省级市级数据匹配
	for (const features of Object.values(cacheData.provinceFeatures)) {
		if (features.length === 0) continue;
		const tree = buildRTree(features);
		for (const city of cities) {
			if (result.has(city.name)) continue;
			const region = findProvince(tree, city.coords.lat, city.coords.lng);
			if (region) result.set(city.name, region);
		}
	}

	return result;
}

// ============================================================
// 主组件
// ============================================================

interface FootprintsMapProps {
	cities: FootprintCity[];
}

export function FootprintsMap({ cities }: FootprintsMapProps) {
	const chartRef = useRef<HTMLDivElement>(null);
	const chartInstance = useRef<echarts.ECharts | null>(null);
	const cacheRef = useRef<CacheData | null>(null);
	const [isReady, setIsReady] = useState(false);
	const { theme, hue } = useThemeStore();

	// 带坐标的城市
	const citiesWithCoords = useMemo(
		() => cities.filter((c): c is CityWithData => !!c.coords),
		[cities],
	);

	// 加载 GeoJSON
	useEffect(() => {
		if (!chartRef.current) return;

		const loadGeoJson = async () => {
			// 读取缓存
			try {
				const cached = localStorage.getItem(CACHE_KEY);
				if (cached) {
					const data = JSON.parse(cached) as CacheData;
					if (Date.now() - data.timestamp < CACHE_EXPIRE_MS) {
						cacheRef.current = data;
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						echarts.registerMap("china_merged", {
							type: "FeatureCollection",
							features: data.mergedFeatures,
						} as any);
						chartInstance.current = echarts.init(chartRef.current);
						setIsReady(true);
						return;
					}
				}
			} catch {
				/* 缓存损坏 */
			}

			// 加载中国地图
			let chinaGeoJson: GeoJSON;
			try {
				const res = await fetch(CHINA_GEOJSON_URL);
				if (!res.ok) throw new Error("加载中国地图失败");
				chinaGeoJson = await res.json();
			} catch (e) {
				console.error("加载中国地图失败", e);
				return;
			}

			const chinaTree = buildRTree(parseFeatures(chinaGeoJson));
			const provinceMap = new Map<string, CityWithData[]>();

			for (const city of citiesWithCoords) {
				const province = findProvince(
					chinaTree,
					city.coords.lat,
					city.coords.lng,
				);
				if (province) {
					const list = provinceMap.get(province) ?? [];
					list.push(city);
					provinceMap.set(province, list);
				}
			}

			// 并行加载省级 GeoJSON
			const provinceNames = [...provinceMap.keys()].filter(
				(n) => !MUNICIPALITY_NAMES.has(n),
			);
			const provinceResults = await Promise.all(
				provinceNames.map(async (name) => {
					const url = getProvinceGeoJsonUrl(name);
					if (!url) return { name, features: [], rawFeatures: [] };
					try {
						const geoJson = await fetch(url).then((r) => r.json());
						return {
							name,
							features: parseFeatures(geoJson),
							rawFeatures: geoJson.features,
						};
					} catch {
						return { name, features: [], rawFeatures: [] };
					}
				}),
			);

			const provinceFeatures = Object.fromEntries(
				provinceResults.map((r) => [r.name, r.features]),
			);
			const mergedFeatures = [
				...chinaGeoJson.features,
				...provinceResults.flatMap((r) => r.rawFeatures),
			];

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			echarts.registerMap("china_merged", {
				type: "FeatureCollection",
				features: mergedFeatures,
			} as any);

			cacheRef.current = {
				china: chinaGeoJson,
				provinceFeatures,
				mergedFeatures,
				timestamp: Date.now(),
			};
			setTimeout(() => {
				try {
					localStorage.setItem(CACHE_KEY, JSON.stringify(cacheRef.current));
				} catch {
					/* 满了 */
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

	// 城市区域映射
	const cityRegionMap = useMemo(
		() => findCityRegions(cacheRef.current, citiesWithCoords),
		[citiesWithCoords, isReady],
	);

	// 散点数据
	const scatterData = useMemo(
		() =>
			citiesWithCoords.map((c) => ({
				name: c.name,
				value: [c.coords.lng, c.coords.lat] as [number, number],
				visited_at: c.visited_at,
				highlights: c.highlights,
			})),
		[citiesWithCoords],
	);

	// 中心点
	const center = useMemo(() => {
		if (scatterData.length === 0) return [105, 36] as [number, number];
		const sumLng = scatterData.reduce((s, d) => s + d.value[0], 0);
		const sumLat = scatterData.reduce((s, d) => s + d.value[1], 0);
		return [sumLng / scatterData.length, sumLat / scatterData.length];
	}, [scatterData]);

	// 查找表
	const coordToCity = useMemo(
		() => new Map(scatterData.map((d) => [`${d.value[0]},${d.value[1]}`, d])),
		[scatterData],
	);

	const regionToCity = useMemo(
		() =>
			new Map(
				scatterData
					.filter((d) => cityRegionMap.has(d.name))
					.map((d) => [cityRegionMap.get(d.name), d]),
			),
		[scatterData, cityRegionMap],
	);

	// 主题
	const isDark = theme === "dark";
	const primaryColor = hueToHex(hue, isDark);

	// 区域高亮
	const regions = useMemo(
		() =>
			[...cityRegionMap.values()].map((name) => ({
				name,
				itemStyle: { areaColor: primaryColor + "60" },
				label: { show: false },
				emphasis: {
					itemStyle: { areaColor: primaryColor + "80" },
					label: { show: true, fontFamily: FONT_FAMILY, fontSize: 12 },
				},
			})),
		[cityRegionMap, primaryColor],
	);

	// tooltip
	const tooltipFormatter = useCallback(
		(params: unknown) => {
			const p = params as { name?: string; value?: number[] | string };
			const formatCity = (city: (typeof scatterData)[0]) =>
				`<div style="padding:4px;font-family:${FONT_FAMILY}">
					<strong>${city.name}</strong><br/>${city.visited_at || ""}
					${city.highlights?.length ? `<br/><span style="color:#999">${city.highlights.join(", ")}</span>` : ""}
				</div>`;

			if (Array.isArray(p.value)) {
				const city = coordToCity.get(`${p.value[0]},${p.value[1]}`);
				if (city) return formatCity(city);
			}
			if (p.name) {
				const city = regionToCity.get(p.name);
				if (city) return formatCity(city);
				return `<span style="font-family:${FONT_FAMILY}">${p.name}</span>`;
			}
			return "";
		},
		[coordToCity, regionToCity],
	);

	// 图表配置
	useEffect(() => {
		if (!isReady || !chartInstance.current) return;

		const baseLabel = { fontFamily: FONT_FAMILY, fontSize: 12, show: true };

		chartInstance.current.setOption(
			{
				backgroundColor: "transparent",
				tooltip: {
					trigger: "item",
					formatter: tooltipFormatter,
					extraCssText: `font-family: ${FONT_FAMILY} !important`,
				},
				geo: {
					tooltip: {
						show: true,
						formatter: tooltipFormatter,
						extraCssText: `font-family: ${FONT_FAMILY} !important`,
					},
					map: "china_merged",
					roam: true,
					zoom: 6,
					center,
					regions,
					itemStyle: {
						areaColor: isDark ? "#1e293b" : "#f1f5f9",
						borderColor: isDark ? "#334155" : "#cbd5e1",
						borderWidth: 1,
					},
					emphasis: {
						itemStyle: { areaColor: isDark ? "#334155" : "#e2e8f0" },
						label: baseLabel,
					},
					label: {
						...baseLabel,
						show: false,
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
						rippleEffect: { brushType: "stroke", scale: 4, period: 4 },
						itemStyle: {
							color: primaryColor,
							shadowBlur: 4,
							shadowColor: primaryColor,
						},
					},
				],
			},
			{ notMerge: true },
		);
	}, [
		isReady,
		theme,
		hue,
		center,
		regions,
		scatterData,
		primaryColor,
		isDark,
		tooltipFormatter,
	]);

	return (
		<div
			ref={chartRef}
			className="h-[400px] md:h-[500px] w-full rounded-xl overflow-hidden"
		/>
	);
}
