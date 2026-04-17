import { useParams, useSearchParams } from "react-router-dom";
import { useArticles } from "@/hooks";
import {
	PostCardList,
	PostCardSkeletonList,
	Pagination,
	EmptyState,
	InlineLoader,
	NotFoundDisplay,
} from "@/components";
import { CategoryBar } from "@/components/widget";
import { toPostCardArticle } from "@/utils/article";

export function CategoryPage() {
	return <ArticleListPage type="category" />;
}

export function TagPage() {
	return <ArticleListPage type="tag" />;
}

function ArticleListPage({ type }: { type: "category" | "tag" }) {
	const { slug } = useParams<{ slug: string }>();
	const [searchParams, setSearchParams] = useSearchParams();
	const page = parseInt(searchParams.get("page") || "1", 10);
	const pageSize = 10;

	const { data, isLoading, isFetching } = useArticles({
		page,
		pageSize,
		[type]: slug,
	});

	const handlePageChange = (newPage: number) => {
		setSearchParams({ page: String(newPage) });
	};

	if (!slug) {
		return (
			<NotFoundDisplay
				message={
					`${type === "category" ? "分类" : "标签"}不存在` as
						| "分类不存在"
						| "标签不存在"
				}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-3 md:gap-4">
			<CategoryBar />
			{isLoading ? (
				<PostCardSkeletonList count={pageSize} />
			) : data?.data?.length ? (
				<>
					{isFetching && !isLoading && <InlineLoader />}
					<PostCardList articles={data.data.map(toPostCardArticle)} />
					{data.total > pageSize && (
						<Pagination
							page={page}
							pageSize={pageSize}
							total={data.total}
							onPageChange={handlePageChange}
						/>
					)}
				</>
			) : (
				<EmptyState
					message={`该${type === "category" ? "分类" : "标签"}下暂无文章`}
				/>
			)}
		</div>
	);
}
