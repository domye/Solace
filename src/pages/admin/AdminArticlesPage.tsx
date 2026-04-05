import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useArticles, useDeleteArticle } from '@/hooks';
import { Pagination } from '@/components';
import { Icon } from '@iconify/react';
import { useAuthStore } from '@/stores';
import { formatDate } from '@/utils';

export function AdminArticlesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const pageSize = 10;

  const { accessToken, isAuthenticated } = useAuthStore();
  const { data, isLoading, error } = useArticles({
    page,
    pageSize,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const deleteMutation = useDeleteArticle();

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (!isAuthenticated || !accessToken) {
    return null; // Protected by layout
  }

  if (error) {
    return (
      <div className="card-base p-8 text-center">
        <Icon icon="material-symbols:error-outline-rounded" className="text-4xl text-red-500 mb-4" />
        <p className="text-75">Failed to load articles</p>
      </div>
    );
  }

  const articles = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="card-base p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-90 text-2xl font-bold">Articles</h1>
            <p className="text-50 text-sm mt-1">{total} articles total</p>
          </div>
          <Link
            to="/admin/articles/new"
            className="btn-regular rounded-lg py-2 px-4 font-medium"
          >
            <Icon icon="material-symbols:add-rounded" className="mr-1" />
            New Article
          </Link>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mt-4">
          {(['all', 'published', 'draft'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`btn-plain rounded-lg py-2 px-3 text-sm ${
                statusFilter === status ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Article List */}
      {isLoading ? (
        <div className="card-base p-8 text-center">
          <Icon icon="material-symbols:refresh-rounded" className="animate-spin text-4xl text-50" />
        </div>
      ) : (
        <div className="card-base">
          {articles.length === 0 ? (
            <div className="p-8 text-center text-50">
              <Icon icon="material-symbols:article-outline-rounded" className="text-4xl mb-4" />
              <p>No articles found</p>
            </div>
          ) : (
            <div className="divide-y divide-black/10 dark:divide-white/10">
              {articles.map((article) => (
                <div key={article.id} className="p-4 flex items-center gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/admin/articles/${article.id}/edit`}
                      className="text-90 font-bold hover:text-[var(--primary)] transition block mb-1"
                    >
                      {article.title}
                    </Link>
                    <div className="flex items-center gap-2 text-50 text-xs">
                      <span>{formatDate(article.created_at)}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded ${
                        article.status === 'published'
                          ? 'bg-green-500/20 text-green-600'
                          : 'bg-yellow-500/20 text-yellow-600'
                      }`}>
                        {article.status}
                      </span>
                      <span>•</span>
                      <span>{article.view_count} views</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/articles/${article.slug}`}
                      className="btn-plain rounded-lg h-9 w-9"
                      title="View"
                    >
                      <Icon icon="material-symbols:visibility-outline-rounded" className="text-lg" />
                    </Link>
                    <Link
                      to={`/admin/articles/${article.id}/edit`}
                      className="btn-plain rounded-lg h-9 w-9"
                      title="Edit"
                    >
                      <Icon icon="material-symbols:edit-outline-rounded" className="text-lg" />
                    </Link>
                    <button
                      onClick={() => handleDelete(article.id)}
                      disabled={deleteMutation.isPending}
                      className="btn-plain rounded-lg h-9 w-9 text-red-500 hover:bg-red-500/10"
                      title="Delete"
                    >
                      <Icon icon="material-symbols:delete-outline-rounded" className="text-lg" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}