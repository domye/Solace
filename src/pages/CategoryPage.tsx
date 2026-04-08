import { useParams } from 'react-router-dom';
import { useCategoryBySlug, useArticles } from '@/hooks';
import { PostCardList, PostCardSkeletonList, Pagination, EmptyState, InlineLoader, NotFoundDisplay } from '@/components';
import { useState } from 'react';
import { toPostCardArticle } from '@/utils/article';

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: category } = useCategoryBySlug(slug || '');
  const { data: articlesData, isLoading, isFetching } = useArticles({
    page,
    pageSize,
    category: slug,
  });

  if (!slug) {
    return <NotFoundDisplay message="分类不存在" />;
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Category Header */}
      {category && (
        <div className="card-base p-6 onload-animation">
          <h1 className="text-2xl font-bold text-90 mb-2">{category.name}</h1>
          {category.description && <p className="text-50">{category.description}</p>}
          {category.article_count !== undefined && (
            <p className="text-30 text-sm mt-2">{category.article_count} articles</p>
          )}
        </div>
      )}

      {/* Articles List */}
      {isLoading ? (
        <PostCardSkeletonList count={pageSize} />
      ) : articlesData?.data && articlesData.data.length > 0 ? (
        <>
          {isFetching && !isLoading && <InlineLoader />}
          <PostCardList articles={articlesData.data.map(toPostCardArticle)} />
          {articlesData.total > pageSize && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={articlesData.total}
              onPageChange={setPage}
            />
          )}
        </>
      ) : (
        <EmptyState message="该分类下暂无文章" />
      )}
    </div>
  );
}