/**
 * 首页
 *
 * 展示已发布文章列表（分页）
 */

import { useState } from 'react';
import { useArticles } from '@/hooks';
import { PostCard, PostCardSkeletonList, Pagination, EmptyState, InlineLoader } from '@/components';
import { toPostCardArticle } from '@/utils/article';

export function HomePage() {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const { data, isLoading, isFetching, error } = useArticles({
    page,
    pageSize,
    status: 'published',
  });

  if (error) {
    return <EmptyState icon="material-symbols:error-outline-rounded" message="加载文章失败" />;
  }

  const articles = data?.data ?? [];
  const total = data?.total ?? 0;

  if (isLoading) {
    return <PostCardSkeletonList count={pageSize} />;
  }

  if (articles.length === 0) {
    return <EmptyState icon="material-symbols:article-outline-rounded" message="暂无文章" />;
  }

  return (
    <>
      {isFetching && !isLoading && <InlineLoader />}
      {/* 文章列表容器 */}
      <div className="flex flex-col rounded-[var(--radius-large)] bg-[var(--card-bg)] py-1 md:py-0 md:bg-transparent md:gap-4">
        {articles.map((article, index) => (
          <PostCard
            key={article.id}
            article={toPostCardArticle(article)}
            className="content-appear"
            style={{ animationDelay: `${index * 40}ms` }}
          />
        ))}
      </div>
      {/* 分页 - 在容器外 */}
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </>
  );
}