/**
 * 首页 - 展示已发布文章列表
 * 支持分页浏览，通过 URL 参数控制当前页码
 */

import { useSearchParams } from "react-router-dom";
import { useArticles } from "@/hooks";
import {
	PostCardList,
	PostCardSkeletonList,
	Pagination,
	EmptyState,
	InlineLoader,
} from "@/components";
import { CategoryBar } from "@/components/widget";
import { toPostCardArticle } from "@/utils/article";

export function HomePage() {
	// 从 URL 参数获取当前页码，默认为第1页
	const [searchParams, setSearchParams] = useSearchParams();
	const page = parseInt(searchParams.get("page") || "1", 10);
	const pageSize = 10; // 每页显示文章数

	// 获取已发布文章列表，包含加载状态和数据
	const { data, isLoading, isFetching, error } = useArticles({
		page,
		pageSize,
		status: "published",
	});

	// 页码变更处理：更新 URL 参数
	const handlePageChange = (newPage: number) => {
		setSearchParams({ page: String(newPage) });
	};

	// 错误状态
	if (error)
		return (
			<EmptyState
				icon="material-symbols:error-outline-rounded"
				message="加载文章失败"
			/>
		);
	// 首次加载状态
	if (isLoading) return <PostCardSkeletonList count={pageSize} />;
	// 空数据状态
	if (!data?.data?.length)
		return (
			<EmptyState
				icon="material-symbols:article-outline-rounded"
				message="暂无文章"
			/>
		);

	return (
		<>
			{/* 后台刷新时显示顶部加载指示器 */}
			{isFetching && !isLoading && <InlineLoader />}
			{/* 分类导航栏 */}
			<CategoryBar />
			{/* 文章卡片列表 */}
			<PostCardList articles={data.data.map(toPostCardArticle)} />
			{/* 分页控件 */}
			<Pagination
				page={page}
				pageSize={pageSize}
				total={data.total}
				onPageChange={handlePageChange}
			/>
		</>
	);
}
