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
		<div className="flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-[var(--btn-regular-bg)] hover:bg-[var(--card-hover-bg)] transition-colors">
			{/* 图标 */}
			<SafeIcon
				icon="material-symbols:location-on-outline-rounded"
				size="1rem"
				className="text-[var(--primary)] mt-0.5 md:!size-[1.25rem]"
			/>

			{/* 内容 */}
			<div className="flex-1 min-w-0">
				{/* 城市名和访问时间 */}
				<div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
					<span className="text-xs md:text-sm text-90 font-bold">{city.name}</span>
					{city.visited_at && (
						<span className="text-[10px] md:text-xs text-50">{city.visited_at}</span>
					)}
				</div>

				{/* 亮点 */}
				{city.highlights && city.highlights.length > 0 && (
					<div className="flex flex-wrap gap-0.5 md:gap-1 text-50 text-[10px] md:text-xs mb-0.5 md:mb-1">
						{city.highlights.map((h) => (
							<span key={h} className="btn-regular h-4 md:h-5 px-1 md:px-1.5 rounded">
								{h}
							</span>
						))}
					</div>
				)}

				{/* 备注 */}
				{city.notes && (
					<p className="text-[10px] md:text-xs text-50 mt-0.5 md:mt-1 italic">{city.notes}</p>
				)}

				{/* 停留时间 */}
				{city.duration && (
					<div className="text-[10px] md:text-xs text-50 mt-0.5 md:mt-1">停留：{city.duration}</div>
				)}
			</div>
		</div>
	);
}
