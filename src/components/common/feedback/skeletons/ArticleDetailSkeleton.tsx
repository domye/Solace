/**
 * 文章详情页骨架屏
 *
 * 在文章详情加载时显示的占位骨架
 */

interface ArticleDetailSkeletonProps {
	className?: string;
}

export function ArticleDetailSkeleton({
	className = "",
}: ArticleDetailSkeletonProps) {
	return (
		<article className={`space-y-4 ${className}`}>
			{/* 封面图骨架 */}
			<div className="card-base overflow-hidden">
				<div className="skeleton w-full h-[280px] md:h-[360px]" />
			</div>

			{/* 内容骨架 */}
			<div
				className="card-base p-6 md:p-8 content-appear"
				style={{ animationDelay: "50ms" }}
			>
				{/* 标题 */}
				<div className="skeleton h-9 rounded w-3/4 mb-4" />

				{/* 元信息 */}
				<div className="flex gap-4 mb-4">
					<div className="skeleton h-5 rounded w-24" />
					<div className="skeleton h-5 rounded w-24" />
					<div className="skeleton h-5 rounded w-24" />
				</div>

				{/* 摘要 */}
				<div className="border-l-2 border-[var(--primary)] pl-4 mb-6">
					<div className="space-y-2">
						<div className="skeleton h-4 rounded w-full" />
						<div className="skeleton h-4 rounded w-5/6" />
					</div>
				</div>

				{/* 正文内容 */}
				<div className="mt-6 space-y-3">
					<div className="skeleton h-4 rounded w-full" />
					<div className="skeleton h-4 rounded w-full" />
					<div className="skeleton h-4 rounded w-11/12" />
					<div className="skeleton h-4 rounded w-full" />
					<div className="skeleton h-4 rounded w-4/5" />
				</div>

				{/* 底部信息 */}
				<div className="border-t border-[var(--border-light)] mt-8 pt-4 flex justify-between">
					<div className="skeleton h-4 rounded w-24" />
					<div className="skeleton h-4 rounded w-24" />
				</div>
			</div>
		</article>
	);
}
