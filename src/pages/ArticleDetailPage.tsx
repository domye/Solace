import { useParams } from 'react-router-dom';
import { useArticleBySlug } from '@/hooks';
import { PostMeta } from '@/components';
import { Icon } from '@iconify/react';
import { formatDate } from '@/utils';

export function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useArticleBySlug(slug ?? '');

  if (error) {
    return (
      <div className="card-base p-8 text-center">
        <Icon icon="material-symbols:error-outline-rounded" className="text-4xl text-red-500 mb-4" />
        <p className="text-75">Failed to load article</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card-base p-8 text-center">
        <Icon icon="material-symbols:refresh-rounded" className="animate-spin text-4xl text-50 mb-4" />
        <p className="text-50">Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="card-base p-8 text-center">
        <Icon icon="material-symbols:search-rounded" className="text-4xl text-50 mb-4" />
        <p className="text-75">Article not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Cover Image */}
      {article.cover_image && (
        <div className="card-base mb-4 overflow-hidden">
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-full h-[300px] object-cover"
          />
        </div>
      )}

      {/* Article Content */}
      <article className="card-base p-6 md:p-8">
        {/* Title */}
        <h1 className="text-90 text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>

        {/* Meta */}
        <PostMeta article={article} />

        {/* Summary */}
        {article.summary && (
          <div className="text-50 border-l-2 border-[var(--primary)] pl-4 mb-6 italic">
            {article.summary}
          </div>
        )}

        {/* Content */}
        <div className="markdown-content mt-6">
          {/* Simple markdown rendering - for production use a proper markdown parser */}
          <div className="prose dark:prose-invert max-w-none">
            {article.content.split('\n').map((paragraph, i) => (
              <p key={i} className="text-75 leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-black/10 dark:border-white/10 mt-8 pt-4">
          <div className="flex items-center justify-between text-50 text-sm">
            <div>Published: {formatDate(article.published_at || article.created_at)}</div>
            <div>{article.view_count} views</div>
          </div>
        </div>
      </article>
    </div>
  );
}