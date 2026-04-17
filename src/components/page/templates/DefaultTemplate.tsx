/**
 * 默认页面模板 - 纯 Markdown 渲染
 *
 * 用于 template 类型为 "default" 的页面
 */

import { MarkdownRenderer, LazyImage } from "@/components";
import type { Page } from "@/types";

interface DefaultTemplateProps {
	markdown: string;
	page: Page;
}

export function DefaultTemplate({ markdown, page }: DefaultTemplateProps) {
	return (
		<div className="card-base p-6 md:p-8 fade-in-up">
			{/* 标题 */}
			<h1 className="text-90 text-2xl md:text-3xl font-bold mb-4">
				{page.title}
			</h1>

			{/* 封面图 */}
			{page.cover_image && (
				<LazyImage
					src={page.cover_image}
					alt={page.title}
					className="w-full rounded-xl mb-6"
					wrapperClassName="w-full aspect-video rounded-xl overflow-hidden mb-6"
					effect="blur"
				/>
			)}

			{/* 概要 */}
			{page.summary && (
				<div className="text-50 border-l-2 border-[var(--primary)] pl-4 mb-6 bg-[var(--btn-regular-bg)] py-2 italic">
					{page.summary}
				</div>
			)}

			{/* Markdown 正文 */}
			<MarkdownRenderer content={markdown} className="mt-6" />
		</div>
	);
}
