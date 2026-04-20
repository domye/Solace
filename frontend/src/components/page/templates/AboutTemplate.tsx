/**
 * 关于我模板 - Markdown
 *
 * 用于 template 类型为 "about" 的页面
 */

import { MarkdownRenderer } from "@/components";
import type { AboutFrontmatter } from "@/types";

interface AboutTemplateProps {
	frontmatter: AboutFrontmatter;
	markdown: string;
}

export function AboutTemplate({ markdown }: AboutTemplateProps) {
	return (
		<div className="space-y-6 fade-in-up">
			{markdown && (
				<div className="card-base p-6 md:p-8">
					<MarkdownRenderer content={markdown} />
				</div>
			)}
		</div>
	);
}
