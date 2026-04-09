import { useParams } from 'react-router-dom';
import { useArticles } from '@/hooks';
import { PostCardList, PostCardSkeletonList, Pagination, EmptyState, InlineLoader, NotFoundDisplay } from '@/components';
import { CategoryBar } from '@/components/widget';
import { useState } from 'react';
import { toPostCardArticle } from '@/utils/article';

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);
  const pageSize = 10;

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
      {/* 分类导航栏 */}
      <CategoryBar />

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