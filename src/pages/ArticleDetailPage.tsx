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
      <div className="card-base p-8 text-center fade-in-up">
        <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
          <Icon icon="material-symbols:error-outline-rounded" className="text-3xl text-red-500" />
        </div>
        <p className="text-75">加载文章失败</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card-base p-8 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-[var(--primary)] border-t-transparent mx-auto mb-4 animate-spin" />
        <p className="text-50">正在加载文章...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="card-base p-8 text-center fade-in-up">
        <div className="w-16 h-16 rounded-full bg-[var(--btn-regular-bg)] mx-auto mb-4 flex items-center justify-center">
          <Icon icon="material-symbols:search-rounded" className="text-3xl text-[var(--primary)]" />
        </div>
        <p className="text-75">未找到文章</p>
      </div>
    );
  }

  return (
    <article className="space-y-4">
      {/* 封面图片 */}
      {article.cover_image && (
        <div className="card-base overflow-hidden fade-in-up">
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-full h-[280px] md:h-[360px] object-cover"
          />
        </div>
      )}

      {/* 文章内容 */}
      <div className="card-base p-6 md:p-8 fade-in-up" style={{ animationDelay: '0.1s' }}>
        {/* 标题 */}
        <h1 className="text-90 text-2xl md:text-3xl font-bold mb-4">{article.title}</h1>

        {/* 元信息 */}
        <PostMeta article={article} />

        {/* 摘要 */}
        {article.summary && (
          <div className="text-50 border-l-2 border-[var(--primary)] pl-4 mb-6 italic">
            {article.summary}
          </div>
        )}

        {/* 正文内容 */}
        <div className="markdown-content mt-6">
          {article.content.split('\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {/* 底部信息 */}
        <div className="border-t border-[var(--border-light)] mt-8 pt-4">
          <div className="flex items-center justify-between text-50 text-sm">
            <div className="flex items-center gap-2">
              <Icon icon="material-symbols:calendar-today-outline-rounded" className="text-base" />
              {formatDate(article.published_at || article.created_at)}
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="material-symbols:visibility-outline-rounded" className="text-base" />
              {article.view_count} 次浏览
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}