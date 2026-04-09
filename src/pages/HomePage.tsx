/** 首页 - 展示已发布文章列表 */

import { useState } from 'react';
import { useArticles } from '@/hooks';
import { PostCardList, PostCardSkeletonList, Pagination, EmptyState, InlineLoader } from '@/components';
import { CategoryBar } from '@/components/widget';
import { toPostCardArticle } from '@/utils/article';

export function HomePage() {
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const { data, isLoading, isFetching, error } = useArticles({ page, pageSize, status: 'published' });

  if (error) return <EmptyState icon="material-symbols:error-outline-rounded" message="加载文章失败" />;
  if (isLoading) return <PostCardSkeletonList count={pageSize} />;
  if (!data?.data?.length) return <EmptyState icon="material-symbols:article-outline-rounded" message="暂无文章" />;

  return (
    <>
      {isFetching && !isLoading && <InlineLoader />}
      <CategoryBar />
      <PostCardList articles={data.data.map(toPostCardArticle)} />
      <Pagination page={page} pageSize={pageSize} total={data.total} onPageChange={setPage} />
    </>
  );
}