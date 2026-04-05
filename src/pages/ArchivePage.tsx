import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { formatDate } from '@/utils/date';
import { useArchive } from '@/hooks/useApi';

export function ArchivePage() {
  const { data: groups, isLoading, error } = useArchive();

  if (error) {
    return (
      <div className="card-base p-8 text-center fade-in-up">
        <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
          <Icon icon="material-symbols:error-outline-rounded" className="text-3xl text-red-500" />
        </div>
        <p className="text-75">Failed to load archive</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card-base p-8 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-[var(--primary)] border-t-transparent mx-auto mb-4 animate-spin" />
        <p className="text-50">Loading archive...</p>
      </div>
    );
  }

  const totalArticles = groups?.reduce((sum, g) => sum + g.count, 0) ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card-base p-6 fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--klein-blue)] to-[var(--sky-blue)] flex items-center justify-center">
            <Icon icon="material-symbols:archive-outline-rounded" className="text-xl text-white" />
          </div>
          <div>
            <h1 className="text-90 text-xl font-bold">Archive</h1>
            <p className="text-50 text-sm">{totalArticles} articles</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card-base p-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
        {groups && groups.length > 0 ? (
          groups.map((yearGroup) => (
            <div key={yearGroup.year} className="mb-8 last:mb-0">
              {/* Year Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[var(--klein-blue)] to-[var(--sky-blue)]" />
                <h2 className="text-90 font-bold text-lg">
                  {yearGroup.year}
                </h2>
                <span className="text-50 text-sm ml-auto">
                  {yearGroup.count} articles
                </span>
              </div>

              {/* Articles by month */}
              {yearGroup.months.map((monthGroup) => (
                <div key={`${yearGroup.year}-${monthGroup.month}`} className="mb-6 last:mb-0 pl-5 border-l-2 border-[var(--border-light)]">
                  <div className="text-50 text-sm mb-2">
                    {monthGroup.month}月 ({monthGroup.count})
                  </div>
                  <div className="space-y-1">
                    {monthGroup.articles.map((article) => (
                      <Link
                        key={article.id}
                        to={`/articles/${article.slug}`}
                        className="flex items-center gap-4 py-2 px-3 rounded-[var(--radius-medium)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors duration-[var(--duration-normal)] group"
                      >
                        <span className="text-50 text-sm w-20 shrink-0">
                          {formatDate(article.published_at || article.created_at)}
                        </span>
                        <span className="text-75 text-sm flex-1 line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                          {article.title}
                        </span>
                        {article.tags && article.tags.length > 0 && (
                          <div className="hidden md:flex gap-1">
                            {article.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag.id}
                                className="text-30 text-xs px-2 py-0.5 rounded bg-[var(--btn-regular-bg)]"
                              >
                                #{tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <Icon
                          icon="material-symbols:chevron-right-rounded"
                          className="text-lg text-30 group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-50">
            <Icon icon="material-symbols:archive-outline-rounded" className="text-4xl mb-4" />
            <p>No archived articles</p>
          </div>
        )}
      </div>
    </div>
  );
}