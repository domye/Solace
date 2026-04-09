import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { LazyImage } from '@/components/common/ui';
import { PostMeta } from './PostMeta';
import type { PostCardArticle } from '@/types';

const COVER_WIDTH_CSS = '28%';
const MOBILE_COVER_WIDTH = '120px';
const MOBILE_COVER_HEIGHT = '90px';

interface PostCardProps {
  article: PostCardArticle;
  className?: string;
  style?: React.CSSProperties;
}

export function PostCard({ article, className, style }: PostCardProps) {
  const hasCover = Boolean(article.cover_image);

  return (
    <article
      className={`card-base w-full rounded-[var(--radius-large)] overflow-hidden relative ${className || ''}`}
      style={{ ...style, '--coverWidth': COVER_WIDTH_CSS } as React.CSSProperties}
    >
      {/* 移动端布局 */}
      <Link
        to={`/articles/${article.slug}`}
        className="md:hidden flex gap-3 p-4 active:scale-[0.98] transition-transform duration-150"
      >
        <div className="flex-1 min-w-0 flex flex-col">
          <h2 className="font-semibold text-[1.0625rem] text-150 leading-snug line-clamp-1 mb-1.5">
            {article.title}
          </h2>
          <p className="text-sm text-50 line-clamp-2 leading-relaxed flex-1">
            {article.summary || '暂无摘要'}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {article.tags && article.tags.length > 0
              ? article.tags.slice(0, 3).map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/tags/${tag.slug}`}
                    className="btn-regular h-6 text-xs px-2 rounded-lg hover:text-[var(--primary)] whitespace-nowrap"
                  >
                    # {tag.name}
                  </Link>
                ))
              : <span className="text-xs text-30">暂无标签</span>}
          </div>
        </div>
        {hasCover && (
          <div className="flex-shrink-0 self-end rounded-lg overflow-hidden" style={{ width: MOBILE_COVER_WIDTH, height: MOBILE_COVER_HEIGHT }}>
            <LazyImage src={article.cover_image!} alt={article.title} className="w-full h-full object-cover" wrapperClassName="w-full h-full" effect="blur" />
          </div>
        )}
      </Link>

      {/* 桌面端布局 */}
      <div className="hidden md:flex md:flex-col w-full relative">
        <div className={`pl-9 pr-2 pt-7 pb-6 relative ${hasCover ? 'w-[calc(100%-var(--coverWidth)-12px)]' : 'w-[calc(100%-52px-12px)]'}`}>
          <Link
            to={`/articles/${article.slug}`}
            className="transition-smooth group w-full block font-bold mb-3 text-[1.625rem] text-70 hover:text-[var(--primary)]
              before:w-1 before:h-5 before:rounded-md before:bg-[var(--primary)]
              before:absolute before:top-[35px] before:left-[18px]"
          >
            {article.title}
            <Icon icon="material-symbols:chevron-right-rounded" className="text-[var(--primary)] text-[2rem] transition-bounce inline absolute translate-y-0.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0" />
          </Link>
          <PostMeta article={article} />
          <div className="transition-smooth text-75 mb-3.5 pr-4 line-clamp-1">{article.summary || '暂无摘要'}</div>
          <div className="flex flex-wrap gap-2 mt-2">
            {article.tags && article.tags.length > 0
              ? article.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/tags/${tag.slug}`}
                    className="btn-regular h-6 text-xs px-2 rounded-lg hover:text-[var(--primary)] whitespace-nowrap"
                  >
                    # {tag.name}
                  </Link>
                ))
              : <span className="text-xs text-30">暂无标签</span>}
          </div>
        </div>

        {hasCover ? (
          <Link to={`/articles/${article.slug}`} className="group w-[var(--coverWidth)] absolute top-3 bottom-3 right-3 rounded-xl overflow-hidden">
            <div className="absolute inset-0 group-hover:bg-black/30 transition-smooth" />
            <Icon icon="material-symbols:chevron-right-rounded" className="absolute z-20 opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 text-white text-5xl transition-bounce inset-0 m-auto" />
            <LazyImage src={article.cover_image!} alt={article.title} className="w-full h-full object-cover transition-smooth group-hover:scale-105" wrapperClassName="w-full h-full" effect="blur" />
          </Link>
        ) : (
          <Link to={`/articles/${article.slug}`} className="btn-regular w-[3.25rem] absolute right-3 top-3 bottom-3 rounded-xl hover:bg-[var(--btn-regular-bg-hover)] active:scale-95 transition-smooth">
            <Icon icon="material-symbols:chevron-right-rounded" className="text-[var(--primary)] text-4xl mx-auto" />
          </Link>
        )}
      </div>

      <div className="hidden md:block absolute inset-0 pointer-events-none card-hover-overlay rounded-[var(--radius-large)]" />
    </article>
  );
}