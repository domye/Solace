/**
 * 时间线组件
 */

import type { TimelineEvent } from "@/types";
import { formatTimelineDate } from "@/utils";

interface TimelineProps {
	events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
	if (!events || events.length === 0) {
		return null;
	}

	return (
		<div className="relative pl-10 md:pl-12">
			{/* 像素竖线 */}
			<div
				className="absolute left-3 md:left-4 top-0 bottom-0 w-2 timeline-line"
				aria-hidden="true"
			/>

			<div className="space-y-6">
				{events.map((event) => (
					<article
						key={`${event.date}-${event.title}`}
						className="relative timeline-item group"
					>
						{/* 像素节点 */}
						<div
							className="absolute -left-8 md:-left-9 top-5 w-4 h-4 timeline-node"
							aria-hidden="true"
						/>

						{/* 内容卡片 */}
						<div className="timeline-card p-4 md:p-5">
							{/* 日期 */}
							<div className="timeline-date text-sm font-bold mb-2">
								{formatTimelineDate(event.date)}
							</div>

							{/* 标题 */}
							<h3 className="timeline-title text-lg font-bold mb-2">
								{event.title}
							</h3>

							{/* 描述 */}
							{event.description && (
								<p className="timeline-content text-sm leading-relaxed">
									{event.description}
								</p>
							)}

							{/* 链接 */}
							{event.link && (
								<a
									href={event.link.url}
									target="_blank"
									rel="noopener noreferrer"
									className="timeline-link text-sm mt-3 inline-flex items-center gap-1.5"
								>
									<span className="timeline-link-icon">→</span>
									{event.link.label}
								</a>
							)}
						</div>
					</article>
				))}
			</div>
		</div>
	);
}
