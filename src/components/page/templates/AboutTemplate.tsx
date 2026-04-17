/**
 * 关于我模板 - 时间线 + Markdown
 *
 * 用于 template 类型为 "about" 的页面
 */

import { MarkdownRenderer, SafeIcon } from "@/components";
import { Timeline } from "@/components/widget/Timeline";
import type { AboutFrontmatter } from "@/types";

interface AboutTemplateProps {
	frontmatter: AboutFrontmatter;
	markdown: string;
}

export function AboutTemplate({ frontmatter, markdown }: AboutTemplateProps) {
	return (
		<div className="space-y-6 fade-in-up">
			{/* 时间线 */}
			{frontmatter.timeline && frontmatter.timeline.length > 0 && (
				<div className="card-base p-6 md:p-8">
					<h2 className="text-90 text-xl font-bold mb-6 flex items-center gap-2">
						<SafeIcon icon="material-symbols:timeline-outline-rounded" />
						我的历程
					</h2>
					<Timeline events={frontmatter.timeline} />
				</div>
			)}

			{/* Markdown 正文 */}
			{markdown && (
				<div className="card-base p-6 md:p-8">
					<MarkdownRenderer content={markdown} />
				</div>
			)}
		</div>
	);
}
