import { useParams } from 'react-router-dom';
import { useArticleBySlug } from '@/hooks';
import { PostMeta, MarkdownRenderer, ErrorDisplay, NotFoundDisplay, ArticleDetailSkeleton, LazyImage } from '@/components';
import { type TocHeading } from '@/components/widget/TableOfContents';
import { Icon } from '@iconify/react';
import { formatDate } from '@/utils';
import { useEffect, useCallback } from 'react';
import { useTocStore } from '@/stores';

export function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useArticleBySlug(slug ?? '');
  const { setHeadings, clearHeadings, setArticleLoading } = useTocStore();

  // 文章加载状态变化时同步到 store
  useEffect(() => {
    setArticleLoading(isLoading);
  }, [isLoading, setArticleLoading]);

  // 离开页面时清理
  useEffect(() => {
    return () => {
      clearHeadings();
      setArticleLoading(false);
    };
  }, [clearHeadings, setArticleLoading]);

  const handleHeadingsExtracted = useCallback((extractedHeadings: TocHeading[]) => {
    setHeadings(extractedHeadings);
  }, [setHeadings]);

  if (error) {
    return <ErrorDisplay message="加载文章失败" />;
  }

  if (isLoading) {
    return <ArticleDetailSkeleton />;
  }

  if (!article) {
    return <NotFoundDisplay message="未找到文章" />;
  }

  return (
    <article className="flex-1 min-w-0 space-y-4">
      {/* 文章内容 */}
      <div className="card-base p-6 md:p-8 fade-in-up">
        <h1 className="text-90 text-2xl md:text-3xl font-bold mb-4">{article.title}</h1>
        <PostMeta article={article} />

        {/* 分隔线（无封面时显示） */}
        {!article.cover_image && (
          <div className="border-[var(--border-light)] border-dashed border-b mb-5" />
        )}

        {/* 摘要 */}
        {article.summary && (
          <div className="text-50 border-l-2 border-[var(--primary)] pl-4 mb-6 bg-[var(--btn-regular-bg)] rounded-r-[var(--radius-medium)] py-2 italic">
            {article.summary}
          </div>
        )}

        {/* 封面图片 - 在标题下方 */}
        {article.cover_image && (
          <LazyImage
            src={article.cover_image}
            alt={article.title}
            className="w-full h-full object-cover rounded-xl"
            wrapperClassName="w-full aspect-video rounded-xl overflow-hidden mb-6"
            effect="blur"
          />
        )}

        {/* 正文内容 */}
        <MarkdownRenderer
          content={article.content}
          className="mt-6"
          onHeadingsExtracted={handleHeadingsExtracted}
        />

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