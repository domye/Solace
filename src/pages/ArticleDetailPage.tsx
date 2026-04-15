import { useParams, Link } from 'react-router-dom';
import { useArticleBySlug } from '@/hooks';
import { PostMeta, MarkdownRenderer, ErrorDisplay, NotFoundDisplay, ArticleDetailSkeleton, LazyImage, SafeIcon, LicenseBlock, RecommendedPosts, ReadingProgress } from '@/components';
import type { TocHeading } from '@/components/widget/TableOfContents';
import { formatDate } from '@/utils';
import { useEffect, useCallback, useRef } from 'react';
import { useTocStore } from '@/stores';

export function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useArticleBySlug(slug ?? '');
  const { setHeadings, clearHeadings, setArticleLoading } = useTocStore();
  const articleRef = useRef<HTMLElement>(null);

  // 切换文章时平滑滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  useEffect(() => { setArticleLoading(isLoading); }, [isLoading, setArticleLoading]);
  useEffect(() => { return () => { clearHeadings(); setArticleLoading(false); }; }, [clearHeadings, setArticleLoading]);

  const handleHeadings = useCallback((h: TocHeading[]) => setHeadings(h), [setHeadings]);

  if (error) return <ErrorDisplay message="加载文章失败" />;
  if (isLoading) return <ArticleDetailSkeleton />;
  if (!article) return <NotFoundDisplay message="未找到文章" />;

  // 判断是否有更新（更新时间与创建时间不同）
  const hasUpdate = article.updated_at && article.updated_at !== article.created_at;

  return (
    <>
      <ReadingProgress show={true} articleRef={articleRef} />
      <article ref={articleRef} className="flex-1 min-w-0 space-y-4">
      <div className="card-base p-6 md:p-8 fade-in-up">
        <h1 className="text-90 text-2xl md:text-3xl font-bold mb-4">{article.title}</h1>
        <PostMeta article={article} />
        {!article.cover_image && <div className="border-[var(--border-light)] border-dashed border-b mb-5" />}
        {article.summary && (
          <div className="text-50 border-l-2 border-[var(--primary)] pl-4 mb-6 bg-[var(--btn-regular-bg)]  py-2 italic">
            {article.summary}
          </div>
        )}
        {article.cover_image && (
          <LazyImage src={article.cover_image} alt={article.title} className="w-full h-full object-cover rounded-xl" wrapperClassName="w-full aspect-video rounded-xl overflow-hidden mb-6" effect="blur" />
        )}
        <MarkdownRenderer content={article.content} className="mt-6" onHeadingsExtracted={handleHeadings} />

        {/* 版权声明 */}
        <LicenseBlock
          title={article.title}
          url={window.location.href}
          publishedAt={article.published_at || article.created_at}
        />

        <div className="border-t border-[var(--border-light)] mt-8 pt-4">
          <div className="flex items-center justify-between text-50 text-sm">
            {/* 左下角：更新时间 */}
            <span className="flex items-center gap-2">
              <SafeIcon icon="material-symbols:edit-calendar-outline-rounded" size="1rem" />
              {hasUpdate ? formatDate(article.updated_at) : formatDate(article.published_at || article.created_at)}
            </span>
            {/* 右下角：标签 */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {article.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/tags/${tag.slug}`}
                    className="btn-regular h-6 text-xs px-2 rounded-lg hover:text-[var(--primary)] whitespace-nowrap"
                  >
                    # {tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 推荐文章 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RecommendedPosts mode="random" excludeId={article.id} limit={5} />
        <RecommendedPosts mode="recent" excludeId={article.id} limit={5} />
      </div>
    </article>
    </>
  );
}
