import { useState } from 'react';
import { useArticles } from '@/hooks';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { formatDate } from '@/utils';

export function ArchivePage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useArticles({
    page,
    pageSize,
    status: 'published',
  });

  if (error) {
    return (
      <div className="card-base p-8 text-center">
        <Icon icon="material-symbols:error-outline-rounded" className="text-4xl text-red-500 mb-4" />
        <p className="text-75">Failed to load archive</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card-base p-8 text-center">
        <Icon icon="material-symbols:refresh-rounded" className="animate-spin text-4xl text-50 mb-4" />
        <p className="text-50">Loading archive...</p>
      </div>
    );
  }

  const articles = data?.items ?? [];
  const total = data?.total ?? 0;

  // Group by year-month
  const groupedArticles = (articles ?? []).reduce<Record<string, NonNullable<typeof articles>>>((acc, article) => {
    const date = new Date(article.published_at ?? article.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = [];
    const arr = acc[key];
    if (arr) arr.push(article);
    return acc;
  }, {} as Record<string, NonNullable<typeof articles>>);

  const sortedKeys = Object.keys(groupedArticles).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      {/* Header */}
      <div className="card-base p-6 mb-4">
        <div className="flex items-center gap-2">
          <Icon icon="material-symbols:archive-outline-rounded" className="text-2xl text-[var(--primary)]" />
          <h1 className="text-90 text-2xl font-bold">Archive</h1>
        </div>
        <p className="text-50 text-sm mt-2">{total} articles total</p>
      </div>

      {/* Timeline */}
      <div className="card-base p-6">
        {sortedKeys.map((key) => (
          <div key={key} className="mb-6 last:mb-0">
            <div className="text-90 font-bold text-lg mb-3">
              {key.replace('-', ' / ')}
              <span className="text-50 text-sm ml-2">
                ({(groupedArticles[key]?.length ?? 0)} articles)
              </span>
            </div>

            <div className="space-y-2">
              {(groupedArticles[key] ?? []).map((article) => (
                <Link
                  key={article.id}
                  to={`/articles/${article.slug}`}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[var(--btn-plain-bg-hover)] transition"
                >
                  <span className="text-50 text-sm w-20 shrink-0">
                    {formatDate(article.published_at || article.created_at)}
                  </span>
                  <span className="text-75 text-sm flex-1 line-clamp-1">
                    {article.title}
                  </span>
                  <Icon
                    icon="material-symbols:chevron-right-rounded"
                    className="text-lg text-50"
                  />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {articles.length === 0 && (
          <div className="text-center py-8 text-50">
            <Icon icon="material-symbols:archive-outline-rounded" className="text-4xl mb-4" />
            <p>No articles archived yet</p>
          </div>
        )}

        {/* Load More */}
        {articles.length < total && (
          <button
            onClick={() => setPage(page + 1)}
            className="btn-regular rounded-lg w-full py-3 mt-4"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}