import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useArticles, useDeleteArticle } from '@/hooks';
import {
  Pagination,
  AdminListSkeleton,
  ErrorDisplay,
  EmptyState,
  ActionButton,
} from '@/components';
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
    if (!confirm('确定要删除这篇文章吗？')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  if (!isAuthenticated || !accessToken) return null;

  if (error) {
    return <ErrorDisplay message="加载文章列表失败" />;
  }

  const articles = data?.data ?? [];
  const total = data?.total ?? 0;

  const statusLabels = {
    all: '全部',
    published: '已发布',
    draft: '草稿',
  };

  return (
    <div className="space-y-4">
      {/* 状态筛选和新建按钮 */}
      <div className="card-base p-4 fade-in-up flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'published', 'draft'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-[var(--radius-medium)] py-2 px-3 text-sm font-medium transition-all scale-animation ripple ${
                statusFilter === status
                  ? 'bg-gradient-to-r from-[var(--klein-blue)] to-[var(--klein-blue-light)] text-white'
                  : 'btn-regular'
              }`}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>
        <Link
          to="/admin/articles/new"
          className="rounded-[var(--radius-medium)] py-2 px-4 text-sm font-medium transition-all scale-animation ripple bg-gradient-to-r from-[var(--klein-blue)] to-[var(--klein-blue-light)] text-white hover:opacity-90"
        >
          新建
        </Link>
      </div>

      {/* 文章列表 */}
      {isLoading ? (
        <AdminListSkeleton count={pageSize} />
      ) : articles.length === 0 ? (
        <EmptyState
          icon="material-symbols:article-outline-rounded"
          message="未找到文章"
        />
      ) : (
        <div className="card-base fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="divide-y divide-[var(--border-light)]">
            {articles.map((article) => (
              <div
                key={article.id}
                className="p-4 flex items-center gap-4 hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/admin/articles/${article.id}/edit`}
                    className="text-90 font-bold hover:text-[var(--primary)] transition-colors block mb-1"
                  >
                    {article.title}
                  </Link>
                  <div className="flex items-center gap-2 text-50 text-xs">
                    <span>{formatDate(article.created_at)}</span>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      article.status === 'published'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {article.status === 'published' ? '已发布' : '草稿'}
                    </span>
                    <span>•</span>
                    <span>{article.view_count} 次浏览</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <ActionButton
                    icon="material-symbols:visibility-outline-rounded"
                    title="查看"
                    href={`/articles/${article.slug}`}
                  />
                  <ActionButton
                    icon="material-symbols:edit-outline-rounded"
                    title="编辑"
                    href={`/admin/articles/${article.id}/edit`}
                  />
                  <ActionButton
                    icon="material-symbols:delete-outline-rounded"
                    title="删除"
                    onClick={() => handleDelete(article.id)}
                    disabled={deleteMutation.isPending}
                    danger
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}