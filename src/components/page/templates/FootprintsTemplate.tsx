/**
 * 我的足迹模板
 *
 * 用于 template 类型为 "footprints" 的页面
 * 支持地图显示城市足迹
 *
 * 性能优化：
 * - FootprintsMap 懒加载，避免首屏加载 ECharts
 */

import { lazy, Suspense } from "react";
import { MarkdownRenderer, SafeIcon } from "@/components";
import { FootprintCard } from "@/components/widget/FootprintCard";
import type { FootprintsFrontmatter, FootprintCity } from "@/types";

// 懒加载地图组件 - ECharts 较大，仅在实际需要时加载
const FootprintsMap = lazy(() =>
	import("@/components/widget/FootprintsMap").then((m) => ({
		default: m.FootprintsMap,
	})),
);

// 地图加载占位符
function MapLoadingFallback() {
	return (
		<div className="h-[400px] md:h-[500px] w-full rounded-xl bg-[var(--btn-regular-bg)] flex items-center justify-center">
			<div className="text-50 animate-pulse">加载地图中...</div>
		</div>
	);
}

interface FootprintsTemplateProps {
	frontmatter: FootprintsFrontmatter;
	markdown: string;
}

export function FootprintsTemplate({
	frontmatter,
	markdown,
}: FootprintsTemplateProps) {
	const cities = frontmatter.cities || [];

	// 过滤无效数据
	const validCities = cities.filter((c) => c && c.country && c.name);

	// 有坐标的城市
	const citiesWithCoords = validCities.filter((c) => c.coords);

	// 统计省份数量
	const provinces = [
		...new Set(validCities.map((c) => c.province || c.country)),
	];

	// 按省份分组
	const citiesByProvince: Record<string, FootprintCity[]> = {};
	for (const city of validCities) {
		const province = city.province || city.country;
		if (!citiesByProvince[province]) {
			citiesByProvince[province] = [];
		}
		citiesByProvince[province].push(city);
	}

	return (
		<div className="space-y-6 fade-in-up">
			{/* 统计卡片 */}
			<div className="card-base p-6 text-center">
				<h1 className="text-90 text-2xl font-bold mb-2">我的足迹</h1>
				<p className="text-50">
					已探索{" "}
					<span className="text-[var(--primary)] font-bold">
						{validCities.length}
					</span>{" "}
					个城市，踏足{" "}
					<span className="text-[var(--primary)] font-bold">
						{provinces.length}
					</span>{" "}
					个省/地区
				</p>
			</div>

			{/* Markdown 简介 */}
			{markdown && (
				<div className="card-base p-6 md:p-8">
					<MarkdownRenderer content={markdown} />
				</div>
			)}

			{/* 地图展示 - 懒加载 */}
			{citiesWithCoords.length > 0 && (
				<div className="card-base p-4 md:p-6">
					<h2 className="text-90 text-xl font-bold mb-4 flex items-center gap-2">
						<SafeIcon icon="material-symbols:map-outline-rounded" />
						足迹地图
					</h2>
					<Suspense fallback={<MapLoadingFallback />}>
						<FootprintsMap cities={validCities} />
					</Suspense>
				</div>
			)}

			{/* 按省份分组显示 */}
			{provinces.map((province) => {
				const provinceCities = citiesByProvince[province] || [];
				return (
					<div key={province} className="card-base p-6 md:p-8">
						<h2 className="text-90 text-xl font-bold mb-4 flex items-center gap-2">
							<SafeIcon icon="material-symbols:location-city-outline-rounded" />
							{province}
							<span className="text-50 text-sm">({provinceCities.length})</span>
						</h2>
						<div className="space-y-3">
							{provinceCities.map((city, idx) => (
								<FootprintCard
									key={`${province}-${city.name}-${idx}`}
									city={city}
								/>
							))}
						</div>
					</div>
				);
			})}

			{/* 无足迹时显示 */}
			{validCities.length === 0 && !markdown && (
				<div className="card-base p-6 md:p-8 text-center text-50">
					暂无足迹记录
				</div>
			)}
		</div>
	);
}
