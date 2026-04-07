import { useParams } from 'react-router-dom';
import { useTagBySlug, useArticles } from '@/hooks';
import { PostCard } from '@/components/common/PostCard';
import { PostCardSkeletonList } from '@/components/common/PostCardSkeleton';
import { Pagination } from '@/components/control/Pagination';
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
    return <div className="card-base p-8 text-center text-50">Tag not found</div>;
  }

  return (
    <div className="space-y-6">
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
        <div className="space-y-0">
          <PostCardSkeletonList count={pageSize} />
        </div>
      ) : articlesData?.data && articlesData.data.length > 0 ? (
        <>
          {/* 后台刷新时显示加载指示器 */}
          {isFetching && !isLoading && (
            <div className="flex justify-center py-2">
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
          <div className="space-y-0">
            {articlesData.data.map((article, index) => (
              <PostCard
                key={article.id}
                article={toPostCardArticle(article)}
                class="content-appear"
                style={{ animationDelay: `${index * 40}ms` }}
              />
            ))}
          </div>

          {/* Pagination */}
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
        <div className="card-base p-8 text-center text-50 onload-animation">
          No articles with this tag
        </div>
      )}
    </div>
  );
}
