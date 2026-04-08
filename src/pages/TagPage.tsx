import { useParams } from 'react-router-dom';
import { useTagBySlug, useArticles } from '@/hooks';
import { PostCard, PostCardSkeletonList, Pagination, EmptyState, InlineLoader, NotFoundDisplay } from '@/components';
import { useState } from 'react';
import { toPostCardArticle } from '@/utils/article';

export function TagPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: tag } = useTagBySlug(slug || '');
  const { data: articlesData, isLoading, isFetching } = useArticles({
    page,
    pageSize,
    tag: slug,
  });

  if (!slug) {
    return <NotFoundDisplay message="标签不存在" />;
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Tag Header */}
      {tag && (
        <div className="card-base p-6 onload-animation">
          <h1 className="text-2xl font-bold text-90 mb-2">#{tag.name}</h1>
          {tag.article_count !== undefined && (
            <p className="text-30 text-sm">{tag.article_count} articles</p>
          )}
        </div>
      )}

      {/* Articles List */}
      {isLoading ? (
        <PostCardSkeletonList count={pageSize} />
      ) : articlesData?.data && articlesData.data.length > 0 ? (
        <>
          {isFetching && !isLoading && <InlineLoader />}
          {articlesData.data.map((article, index) => (
            <PostCard
              key={article.id}
              article={toPostCardArticle(article)}
              className="content-appear"
              style={{ animationDelay: `${index * 40}ms` }}
            />
          ))}
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
        <EmptyState message="该标签下暂无文章" />
      )}
    </div>
  );
}