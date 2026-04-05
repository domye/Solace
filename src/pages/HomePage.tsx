import { useState } from 'react';
import { useArticles } from '@/hooks';
import { PostCard, Pagination } from '@/components';
import { Icon } from '@iconify/react';

export function HomePage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error } = useArticles({
    page,
    pageSize,
    status: 'published',
  });

  if (error) {
    return (
      <div className="card-base p-8 text-center">
        <Icon icon="material-symbols:error-outline-rounded" className="text-4xl text-red-500 mb-4" />
        <p className="text-75">Failed to load articles</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card-base p-8 text-center">
        <Icon icon="material-symbols:refresh-rounded" className="animate-spin text-4xl text-50 mb-4" />
        <p className="text-50">Loading articles...</p>
      </div>
    );
  }

  const articles = data?.items ?? [];
  const total = data?.total ?? 0;

  if (articles.length === 0) {
    return (
      <div className="card-base p-8 text-center">
        <Icon icon="material-symbols:article-outline-rounded" className="text-4xl text-50 mb-4" />
        <p className="text-75">No articles yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Title */}
      <div className="card-base p-6 mb-4">
        <h1 className="text-90 text-2xl font-bold">Recent Posts</h1>
      </div>

      {/* Article List */}
      <div className="flex flex-col gap-4">
        {articles.map((article) => (
          <PostCard key={article.id} article={article} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}