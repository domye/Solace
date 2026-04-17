/**
 * 城市足迹卡片组件
 *
 * 用于展示单个城市足迹信息
 */

import { SafeIcon } from "@/components/common/ui";
import type { FootprintCity } from "@/types";

interface FootprintCardProps {
	city: FootprintCity;
}

export function FootprintCard({ city }: FootprintCardProps) {
	return (
		<div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--btn-regular-bg)] hover:bg-[var(--card-hover-bg)] transition-colors">
			{/* 图标 */}
			<SafeIcon
				icon="material-symbols:location-on-outline-rounded"
				size="1.25rem"
				className="text-[var(--primary)] mt-0.5"
			/>

			{/* 内容 */}
			<div className="flex-1 min-w-0">
				{/* 城市名和访问时间 */}
				<div className="flex items-center gap-2 mb-1">
					<span className="text-90 font-bold">{city.name}</span>
					{city.visited_at && (
						<span className="text-50 text-xs">{city.visited_at}</span>
					)}
				</div>

				{/* 亮点 */}
				{city.highlights && city.highlights.length > 0 && (
					<div className="flex flex-wrap gap-1 text-50 text-sm mb-1">
						{city.highlights.map((h) => (
							<span key={h} className="btn-regular h-5 text-xs px-1.5 rounded">
								{h}
							</span>
						))}
					</div>
				)}

				{/* 备注 */}
				{city.notes && (
					<p className="text-50 text-sm mt-1 italic">{city.notes}</p>
				)}

				{/* 停留时间 */}
				{city.duration && (
					<div className="text-50 text-xs mt-1">停留：{city.duration}</div>
				)}
			</div>
		</div>
	);
}
