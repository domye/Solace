/** 首页 - 展示已发布文章列表 */

import { useSearchParams } from 'react-router-dom';
import { useArticles } from '@/hooks';
import { PostCardList, PostCardSkeletonList, Pagination, EmptyState, InlineLoader } from '@/components';
import { CategoryBar } from '@/components/widget';
import { toPostCardArticle } from '@/utils/article';

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 10;

  const { data, isLoading, isFetching, error } = useArticles({ page, pageSize, status: 'published' });

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: String(newPage) });
  };

  if (error) return <EmptyState icon="material-symbols:error-outline-rounded" message="加载文章失败" />;
  if (isLoading) return <PostCardSkeletonList count={pageSize} />;
  if (!data?.data?.length) return <EmptyState icon="material-symbols:article-outline-rounded" message="暂无文章" />;

  return (
    <>
      {isFetching && !isLoading && <InlineLoader />}
      <CategoryBar />
      <PostCardList articles={data.data.map(toPostCardArticle)} />
      <Pagination page={page} pageSize={pageSize} total={data.total} onPageChange={handlePageChange} />
    </>
  );
}