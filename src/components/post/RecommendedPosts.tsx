/**
 * 推荐文章组件
 *
 * 支持随机推荐和最近发布两种模式
 */

import { Link } from "react-router-dom";
import { SafeIcon } from "@/components/common/ui";
import { useRandomArticles, useRecentArticles } from "@/hooks";
import type { ArticleSummary } from "@/types";

type RecommendedMode = "random" | "recent";

interface RecommendedPostsProps {
	/** 模式：random 随机推荐 | recent 最近发布 */
	mode: RecommendedMode;
	/** 排除的文章 ID（通常是当前文章） */
	excludeId?: number;
	/** 显示数量 */
	limit?: number;
	/** 自定义类名 */
	className?: string;
}

// 配置项
const CONFIG: Record<
	RecommendedMode,
	{
		title: string;
		badge: string;
		icon: string;
	}
> = {
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
};

export function RecommendedPosts({
	mode,
	excludeId,
	limit = 5,
	className = "",
}: RecommendedPostsProps) {
	const config = CONFIG[mode];

	// 根据模式调用不同的 hook
	const randomResult = useRandomArticles(limit + 1);
	const recentResult = useRecentArticles(limit + 1);

	const {
		data: articles,
		isLoading,
		error,
	} = mode === "random" ? randomResult : recentResult;

	// 过滤排除的文章
	const filteredArticles = articles
		?.filter((a) => a.id !== excludeId)
		.slice(0, limit);

	if (error || !filteredArticles?.length) {
		return null;
	}

	if (isLoading) {
		return <RecommendedPostsSkeleton />;
	}

	return (
		<div className={`card-base p-5 md:p-6 flex flex-col ${className}`}>
			{/* 标题 */}
			<div className="flex items-center gap-2 pb-3 mb-1 border-b border-dashed border-[var(--line-divider)]">
				<SafeIcon
					icon={config.icon}
					size="1.25rem"
					className="text-[var(--primary)]"
				/>
				<span className="text-base font-bold text-75">{config.title}</span>
				<span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[var(--btn-regular-bg)] text-[var(--btn-content)]">
					{config.badge}
				</span>
			</div>

			{/* 文章列表 */}
			<div className="flex flex-col -mx-1">
				{filteredArticles.map((article, idx) => (
					<PostListItem
						key={article.id}
						article={article}
						index={idx}
						isLast={idx === filteredArticles.length - 1}
						showSummary={mode === "random"}
					/>
				))}
			</div>
		</div>
	);
}

/** 文章列表项 */
function PostListItem({
	article,
	index,
	isLast,
	showSummary,
}: {
	article: ArticleSummary;
	index: number;
	isLast: boolean;
	showSummary: boolean;
}) {
	const formattedDate = article.published_at
		? new Date(article.published_at).toISOString().substring(0, 10)
		: new Date(article.created_at).toISOString().substring(0, 10);

	const summary = article.summary || "暂无简介";

	return (
		<>
			<Link
				to={`/articles/${article.slug}`}
				className="group flex items-center gap-3 px-3 py-3 -mx-1 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98]"
			>
				{/* 序号 */}
				<div className="shrink-0 w-6 h-6 rounded-md bg-[var(--enter-btn-bg)] text-[var(--primary)] flex items-center justify-center text-sm font-bold transition">
					{index + 1}
				</div>

				{/* 标题和副信息 */}
				<div className="flex-1 min-w-0">
					<div className="font-bold text-sm text-75 truncate transition group-hover:text-[var(--primary)]">
						{article.title}
					</div>
					<div className="text-xs text-30 truncate mt-1">
						{article.category && (
							<span className="shrink-0 self-end px-1.5 py-0.5 rounded bg-[var(--btn-regular-bg)] text-[var(--btn-content)] mr-1.5">
								{article.category.name}
							</span>
						)}
						<span className="truncate">
							{showSummary ? summary : formattedDate}
						</span>
					</div>
				</div>

				{/* 箭头 */}
				<SafeIcon
					icon="material-symbols:chevron-right-rounded"
					size="1.25rem"
					className="shrink-0 text-black/15 dark:text-white/15 transition group-hover:text-[var(--primary)] group-hover:translate-x-0.5"
				/>
			</Link>
			{!isLast && (
				<div className="border-b border-dashed border-[var(--line-divider)] mx-3" />
			)}
		</>
	);
}

/** 加载骨架屏 */
function RecommendedPostsSkeleton() {
	return (
		<div className="card-base p-5 md:p-6 flex flex-col">
			<div className="flex items-center gap-2 pb-3 mb-1 border-b border-dashed border-[var(--line-divider)]">
				<div className="w-5 h-5 rounded bg-[var(--btn-regular-bg)] animate-pulse" />
				<div className="w-20 h-4 rounded bg-[var(--btn-regular-bg)] animate-pulse" />
			</div>
			{[1, 2, 3, 4, 5].map((i) => (
				<div key={i} className="flex items-center gap-3 px-3 py-3">
					<div className="w-6 h-6 rounded-md bg-[var(--btn-regular-bg)] animate-pulse" />
					<div className="flex-1 space-y-2">
						<div className="h-4 w-3/4 rounded bg-[var(--btn-regular-bg)] animate-pulse" />
						<div className="h-3 w-1/2 rounded bg-[var(--btn-regular-bg)] animate-pulse" />
					</div>
				</div>
			))}
		</div>
	);
}
