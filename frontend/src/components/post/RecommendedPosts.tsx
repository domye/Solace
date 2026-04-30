/**
 * 推荐文章组件
 *
 * 支持随机推荐和最近发布两种模式
 */
import { Link } from "react-router-dom";
import { SafeIcon } from "@/components/common/ui";
import { useRandomArticles, useRecentArticles } from "@/hooks";
import { getArticleDate } from "@/utils";
import type { ArticleSummary } from "@/types";

// ============ 类型定义 ============

type RecommendedMode = "random" | "recent";

interface RecommendedPostsProps {
	mode: RecommendedMode;
	excludeId?: number;
	limit?: number;
	className?: string;
}

// ============ 配置常量 ============

const MODE_CONFIG = {
	random: {
		title: "随机推荐",
		badge: "Random",
		icon: "material-symbols:recommend",
	},
	recent: {
		title: "最近发布",
		badge: "Recent",
		icon: "material-symbols:schedule",
	},
} as const;

// ============ 子组件 ============

/** 文章列表项 */
function PostItem({
	article,
	index,
	showSummary,
	showDivider,
}: {
	article: ArticleSummary;
	index: number;
	showSummary: boolean;
	showDivider: boolean;
}) {
	const subtitle = showSummary
		? article.summary || "暂无简介"
		: getArticleDate(article);

	return (
		<div>
			<Link
				to={`/articles/${article.slug}`}
				className="group flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-3 -mx-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all"
			>
				{/* 序号 */}
				<div className="shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-md bg-[var(--enter-btn-bg)] text-[var(--primary)] flex items-center justify-center text-xs md:text-sm font-bold">
					{index + 1}
				</div>

				{/* 标题和副信息 */}
				<div className="flex-1 min-w-0">
					<div className="font-bold text-xs md:text-sm truncate group-hover:text-[var(--primary)]">
						{article.title}
					</div>
					<div className="text-[10px] md:text-xs text-[var(--text-30)] truncate mt-0.5 md:mt-1">
						{article.category && (
							<span className="px-1 py-0.5 rounded bg-[var(--btn-regular-bg)] text-[var(--btn-content)] mr-1 md:mr-1.5">
								{article.category.name}
							</span>
						)}
						<span>{subtitle}</span>
					</div>
				</div>

				{/* 箭头 */}
				<SafeIcon
					icon="material-symbols:chevron-right-rounded"
					size="1rem"
					className="shrink-0 text-black/15 dark:text-white/15 group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition md:!size-[1.25rem]"
				/>
			</Link>

			{showDivider && (
				<div className="border-b border-dashed border-[var(--line-divider)] mx-3" />
			)}
		</div>
	);
}

/** 骨架屏项 */
function SkeletonItem() {
	return (
		<div className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-3">
			<div className="w-5 h-5 md:w-6 md:h-6 rounded-md bg-[var(--btn-regular-bg)] animate-pulse" />
			<div className="flex-1 space-y-1.5 md:space-y-2">
				<div className="h-3.5 md:h-4 w-3/4 rounded bg-[var(--btn-regular-bg)] animate-pulse" />
				<div className="h-2.5 md:h-3 w-1/2 rounded bg-[var(--btn-regular-bg)] animate-pulse" />
			</div>
		</div>
	);
}

/** 骨架屏 */
function RecommendedPostsSkeleton() {
	return (
		<div className="card-base p-3 md:p-5 lg:p-6 flex flex-col">
			{/* 标题骨架 */}
			<div className="flex items-center gap-2 pb-2 md:pb-3 mb-1 border-b border-dashed border-[var(--line-divider)]">
				<div className="w-4 h-4 md:w-5 md:h-5 rounded bg-[var(--btn-regular-bg)] animate-pulse" />
				<div className="w-16 md:w-20 h-3.5 md:h-4 rounded bg-[var(--btn-regular-bg)] animate-pulse" />
			</div>
			{/* 列表骨架 */}
			{Array.from({ length: 5 }).map((_, i) => (
				<SkeletonItem key={i} />
			))}
		</div>
	);
}

// ============ 主组件 ============

export function RecommendedPosts({
	mode,
	excludeId,
	limit = 5,
	className = "",
}: RecommendedPostsProps) {
	const config = MODE_CONFIG[mode];

	// 必须在条件之前调用所有 hooks
	const randomResult = useRandomArticles(limit + 1);
	const recentResult = useRecentArticles(limit + 1);
	const {
		data: articles,
		isLoading,
		error,
	} = mode === "random" ? randomResult : recentResult;

	// 过滤排除的文章并限制数量
	const filteredArticles = articles
		?.filter((a) => a.id !== excludeId)
		.slice(0, limit);

	// 无数据或错误时不渲染
	if (error || !filteredArticles?.length) return null;

	// 加载中显示骨架屏
	if (isLoading) return <RecommendedPostsSkeleton />;

	return (
		<div className={`card-base p-3 md:p-5 lg:p-6 flex flex-col ${className}`}>
			{/* 标题栏 */}
			<div className="flex items-center gap-1.5 md:gap-2 pb-2 md:pb-3 mb-1 border-b border-dashed border-[var(--line-divider)]">
				<SafeIcon
					icon={config.icon}
					size="1rem"
					className="text-[var(--primary)] md:!size-[1.25rem]"
				/>
				<span className="font-bold text-sm md:text-base">{config.title}</span>
				<span className="ml-auto text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-[var(--btn-regular-bg)] text-[var(--btn-content)]">
					{config.badge}
				</span>
			</div>

			{/* 文章列表 */}
			<div className="flex flex-col -mx-1">
				{filteredArticles.map((article, idx) => (
					<PostItem
						key={article.id}
						article={article}
						index={idx}
						showSummary={mode === "random"}
						showDivider={idx < filteredArticles.length - 1}
					/>
				))}
			</div>
		</div>
	);
}
