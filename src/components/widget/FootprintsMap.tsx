/**
 * 足迹地图组件 - Echarts 中国地图
 * 支持省份高亮 + 市级边界显示
 */

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { FootprintCity } from "@/types";

// 中国省份 GeoJSON
const chinaGeoJsonUrl =
	"https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json";

// 市级 GeoJSON URL 模板
const cityGeoJsonUrlTemplate =
	"https://geo.datav.aliyun.com/areas_v3/bound/{adcode}_full.json";

interface FootprintsMapProps {
	cities: FootprintCity[];
}

// 获取 CSS 变量值
function getCssVar(name: string): string {
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// 解析主题色
function parseThemeColor(): string {
	const defaultColor = "#3b82f6";
	try {
		const primary = getCssVar("--primary");
		if (primary.startsWith("oklch")) {
			const match = primary.match(/oklch\(([\d.]+)\s+([\d.]+)/);
			if (match) {
				const l = parseFloat(match[1]);
				if (l > 0.7) return "#60a5fa";
				if (l > 0.6) return "#3b82f6";
				return "#2563eb";
			}
		}
		return defaultColor;
	} catch {
		return defaultColor;
	}
}

// 点是否在多边形内（射线法）
function pointInPolygon(point: [number, number], polygon: number[][]): boolean {
	const [x, y] = point;
	let inside = false;

	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const [xi, yi] = polygon[i];
		const [xj, yj] = polygon[j];

		const intersect =
			((yi > y) !== (yj > y)) &&
			(x < (xj - xi) * (y - yi) / (yj - yi) + xi);

		if (intersect) inside = !inside;
	}

	return inside;
}

// 根据坐标查找省份信息和adcode
function findProvinceByCoords(
	geoJson: GeoJSON,
	lat: number,
	lng: number
): { name: string; adcode: string } | null {
	for (const feature of geoJson.features) {
		const geometry = feature.geometry;
		if (!geometry) continue;

		const coords: number[][][] = geometry.type === "Polygon"
			? geometry.coordinates
			: geometry.type === "MultiPolygon"
				? geometry.coordinates.flat(1) as number[][]
				: [];

		for (const polygon of coords) {
			if (pointInPolygon([lng, lat], polygon)) {
				return {
					name: feature.properties?.name || "",
					adcode: feature.properties?.adcode || "",
				};
			}
		}
	}

	return null;
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
			adcode?: string;
		};
	}>;
}

export function FootprintsMap({ cities }: FootprintsMapProps) {
	const chartRef = useRef<HTMLDivElement>(null);
	const chartInstance = useRef<echarts.ECharts | null>(null);

	useEffect(() => {
		if (!chartRef.current) return;

		const initChart = async () => {
			// 加载中国地图数据
			let chinaGeoJson: GeoJSON;
			try {
				const response = await fetch(chinaGeoJsonUrl);
				chinaGeoJson = await response.json();
				echarts.registerMap("china", chinaGeoJson as object);
			} catch (e) {
				console.error("加载中国地图数据失败", e);
				return;
			}

			// 初始化图表
			chartInstance.current = echarts.init(chartRef.current);

			// 过滤有坐标的城市
			const citiesWithCoords = cities.filter((c) => c.coords);

			// 获取主题色
			const primaryColor = parseThemeColor();

			// 查找所有访问过的省份和 adcode
			const provinceMap = new Map<string, { name: string; adcode: string }>();
			// 存储城市对应的市级区域名称
			const cityRegionNames = new Map<string, string>();

			for (const city of citiesWithCoords) {
				const province = findProvinceByCoords(
					chinaGeoJson,
					city.coords!.lat,
					city.coords!.lng
				);
				if (province && province.adcode) {
					provinceMap.set(province.adcode, province);
				}
			}

			// 动态加载访问过的省份的市级 GeoJSON，合并到主地图
			const mergedFeatures = [...chinaGeoJson.features];
			for (const [adcode] of provinceMap) {
				try {
					const response = await fetch(cityGeoJsonUrlTemplate.replace("{adcode}", adcode));
					const cityGeoJson: GeoJSON = await response.json();
					// 将市级数据添加到 features
					mergedFeatures.push(...cityGeoJson.features);

					// 根据坐标找到市级区域名称
					for (const city of citiesWithCoords) {
						const province = findProvinceByCoords(
							chinaGeoJson,
							city.coords!.lat,
							city.coords!.lng
						);
						if (province && province.adcode === adcode) {
							// 在市级 GeoJSON 中查找该坐标对应的区域
							for (const feature of cityGeoJson.features) {
								const geometry = feature.geometry;
								if (!geometry) continue;

								const coords: number[][][] = geometry.type === "Polygon"
									? geometry.coordinates
									: geometry.type === "MultiPolygon"
										? geometry.coordinates.flat(1) as number[][]
										: [];

								for (const polygon of coords) {
									if (pointInPolygon([city.coords!.lng, city.coords!.lat], polygon)) {
										cityRegionNames.set(city.name, feature.properties?.name || "");
										break;
									}
								}
							}
						}
					}
				} catch (e) {
					console.warn(`加载省份 ${adcode} 市级数据失败`, e);
				}
			}

			// 重新注册合并后的地图
			const mergedGeoJson: GeoJSON = {
				type: "FeatureCollection",
				features: mergedFeatures,
			};
			echarts.registerMap("china_merged", mergedGeoJson as object);

			// 构建散点数据
			const scatterData = citiesWithCoords.map((city) => ({
				name: city.name,
				value: [city.coords!.lng, city.coords!.lat],
			}));

			// 判断是否为深色模式
			const isDark = document.documentElement.classList.contains("dark");

			// 构建高亮配置（省份 + 市级区域）
			const regions: echarts.RegionsOption[] = [];

			// 省份高亮
			for (const province of provinceMap.values()) {
				regions.push({
					name: province.name,
					itemStyle: {
						areaColor: primaryColor + "30",
					},
					emphasis: {
						itemStyle: {
							areaColor: primaryColor + "50",
						},
					},
				});
			}

			// 市级区域高亮（根据坐标匹配到的市级区域名称）
			for (const [, regionName] of cityRegionNames) {
				regions.push({
					name: regionName,
					itemStyle: {
						areaColor: primaryColor + "60",
					},
					emphasis: {
						itemStyle: {
							areaColor: primaryColor + "80",
						},
					},
				});
			}

			// 图表配置
			const option: echarts.EChartsOption = {
				backgroundColor: "transparent",
				tooltip: {
					trigger: "item",
					formatter: (params: unknown) => {
						const p = params as { name?: string; value?: number[] | string };
						// 散点数据
						if (Array.isArray(p.value)) {
							const city = citiesWithCoords.find(
								(c) => c.coords!.lng === p.value![0] && c.coords!.lat === p.value![1]
							);
							if (city) {
								return `<div style="padding:4px;">
									<strong>${city.name}</strong><br/>
									${city.visited_at || ""}
									${city.highlights ? `<br/><span style="color:#999">${city.highlights.join(", ")}</span>` : ""}
								</div>`;
							}
						}
						// 地图区域（市级）
						if (p.name) {
							// 查找该市级区域对应的城市
							const cityEntry = Array.from(cityRegionNames.entries()).find(
								([, regionName]) => regionName === p.name
							);
							if (cityEntry) {
								const cityName = cityEntry[0];
								const city = citiesWithCoords.find((c) => c.name === cityName);
								if (city) {
									return `<div style="padding:4px;">
										<strong>${cityName}</strong><br/>
										${city.visited_at || ""}
										${city.highlights ? `<br/><span style="color:#999">${city.highlights.join(", ")}</span>` : ""}
									</div>`;
								}
							}
							return p.name;
						}
						return "";
					},
				},
				geo: {
					map: "china_merged",
					roam: true,
					zoom: 2,
					center: [105, 36],
					regions,
					itemStyle: {
						areaColor: isDark ? "#1e293b" : "#f1f5f9",
						borderColor: isDark ? "#334155" : "#cbd5e1",
						borderWidth: 1,
					},
					emphasis: {
						itemStyle: {
							areaColor: isDark ? "#334155" : "#e2e8f0",
						},
					},
					label: {
						show: false,
					},
				},
				series: [
					{
						type: "scatter",
						coordinateSystem: "geo",
						data: scatterData,
						symbolSize: 12,
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

			chartInstance.current.setOption(option);
		};

		initChart();

		// 窗口大小变化时重新调整
		const handleResize = () => {
			chartInstance.current?.resize();
		};
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			chartInstance.current?.dispose();
		};
	}, [cities]);

	return (
		<div
			ref={chartRef}
			className="h-[400px] md:h-[500px] w-full rounded-xl overflow-hidden"
		/>
	);
}