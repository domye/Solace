/**
 * 文章卡片组件
 *
 * 用于文章列表页展示文章摘要信息
 */

import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/utils/date';
import { LazyImage } from './LazyImage';
import type { PostCardArticle } from '@/types';

/** 封面图宽度百分比 */
const COVER_WIDTH_CSS = '28%';

interface PostCardProps {
  article: PostCardArticle;
  className?: string;
  style?: React.CSSProperties;
}

/** 文章卡片主组件 */
export function PostCard({ article, className, style }: PostCardProps) {
  const hasCover = Boolean(article.cover_image);

  return (
    <>
      <article
        className={`card-base card-hover flex flex-col-reverse md:flex-col w-full rounded-[var(--radius-large)] overflow-hidden relative ${className || ''}`}
        style={{
          ...style,
          '--coverWidth': COVER_WIDTH_CSS,
        } as React.CSSProperties}
      >
        <ContentArea article={article} hasCover={hasCover} />
        {hasCover && <CoverImage article={article} />}
        {!hasCover && <EntryButton slug={article.slug} />}
      </article>
      <Divider />
    </>
  );
}

/** 内容区域（标题、元信息、摘要、浏览量） */
function ContentArea({ article, hasCover }: { article: PostCardArticle; hasCover: boolean }) {
  const contentWidth = hasCover
    ? 'w-full md:w-[calc(100%-var(--coverWidth)-12px)]'
    : 'w-full md:w-[calc(100%-52px-12px)]';

  return (
    <div className={`pl-6 md:pl-9 pr-6 md:pr-2 pt-6 md:pt-7 pb-6 relative ${contentWidth}`}>
      <TitleLink article={article} />
      <PostMeta article={article} />
      <Summary text={article.summary} />
      <ViewCount count={article.view_count} />
    </div>
  );
}

/** 标题链接 */
function TitleLink({ article }: { article: PostCardArticle }) {
  return (
    <Link
      to={`/articles/${article.slug}`}
      className="transition-smooth group w-full block font-bold mb-3 text-3xl text-90
        hover:text-[var(--primary)] dark:hover:text-[var(--primary)]
        active:text-[var(--primary)]
        before:w-1 before:h-5 before:rounded-md before:bg-[var(--primary)]
        before:absolute before:top-[35px] before:left-[18px] before:hidden md:before:block"
    >
      {article.title}
      <Icon
        icon="material-symbols:chevron-right-rounded"
        className="inline text-[2rem] text-[var(--primary)] md:hidden translate-y-0.5 absolute"
      />
      <Icon
        icon="material-symbols:chevron-right-rounded"
        className="text-[var(--primary)] text-[2rem] transition-bounce hidden md:inline absolute translate-y-0.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0"
      />
    </Link>
  );
}

/** 封面图片 */
function CoverImage({ article }: { article: PostCardArticle }) {
  return (
    <Link
      to={`/articles/${article.slug}`}
      className="group max-h-[20vh] md:max-h-none mx-4 mt-4 -mb-2 md:mb-0 md:mx-0 md:mt-0
        md:w-[var(--coverWidth)] relative md:absolute md:top-3 md:bottom-3 md:right-3
        rounded-xl overflow-hidden active:scale-95"
    >
      <div className="absolute pointer-events-none z-10 w-full h-full group-hover:bg-black/30 group-active:bg-black/50 transition-smooth" />
      <div className="absolute pointer-events-none z-20 w-full h-full flex items-center justify-center">
        <Icon
          icon="material-symbols:chevron-right-rounded"
          className="transition-bounce opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 text-white text-5xl"
        />
      </div>
      <LazyImage
        src={article.cover_image || ''}
        alt={article.title}
        className="w-full h-full object-cover transition-smooth group-hover:scale-105"
        wrapperClassName="w-full h-full"
        effect="blur"
      />
    </Link>
  );
}

/** 进入按钮（无封面时显示） */
function EntryButton({ slug }: { slug: string }) {
  return (
    <Link
      to={`/articles/${slug}`}
      className="!hidden md:!flex btn-regular w-[3.25rem] absolute right-3 top-3 bottom-3 rounded-xl bg-[var(--btn-regular-bg)]
        hover:bg-[var(--btn-regular-bg-hover)] active:bg-[var(--btn-regular-bg-active)] active:scale-95 transition-smooth"
    >
      <Icon
        icon="material-symbols:chevron-right-rounded"
        className="transition-bounce text-[var(--primary)] text-4xl mx-auto"
      />
    </Link>
  );
}

/** 摘要 */
function Summary({ text }: { text?: string }) {
  return (
    <div className="transition-smooth text-75 mb-3.5 pr-4 line-clamp-2 md:line-clamp-1">
      {text || '暂无摘要'}
    </div>
  );
}

/** 浏览量 */
function ViewCount({ count }: { count: number }) {
  return (
    <div className="text-sm text-30 flex gap-4 transition-smooth">
      <span>{count} 次浏览</span>
    </div>
  );
}

/** 分隔线（移动端） */
function Divider() {
  return (
    <div className="transition-smooth border-t-[1px] border-dashed mx-6 my-4 border-[var(--border-medium)] last:border-t-0 md:hidden" />
  );
}

/** 文章元信息（日期、作者、状态） */
interface PostMetaProps {
  article: PostCardArticle;
  hideUpdateDate?: boolean;
}

export function PostMeta({ article, hideUpdateDate }: PostMetaProps) {
  const showUpdate = !hideUpdateDate && article.updated_at !== article.created_at;

  return (
    <div className="flex flex-wrap text-50 items-center gap-4 gap-x-4 gap-y-2 mb-4">
      <MetaItem
        icon="material-symbols:calendar-today-outline-rounded"
        text={formatDate(article.published_at || article.created_at)}
      />
      {showUpdate && (
        <MetaItem
          icon="material-symbols:edit-calendar-outline-rounded"
          text={formatDate(article.updated_at)}
        />
      )}
      {article.author && (
        <MetaItem
          icon="material-symbols:person-outline-rounded"
          text={article.author.nickname || article.author.username}
        />
      )}
      {article.status === 'draft' && (
        <MetaItem
          icon="material-symbols:edit-note-rounded"
          text="草稿"
          variant="warning"
        />
      )}
    </div>
  );
}

/** 元信息项 */
function MetaItem({
  icon,
  text,
  variant = 'default',
}: {
  icon: string;
  text: string;
  variant?: 'default' | 'warning';
}) {
  const iconClass = variant === 'warning'
    ? 'meta-icon bg-amber-500/20 text-amber-600'
    : 'meta-icon transition-smooth';

  return (
    <div className="flex items-center transition-smooth hover:text-[var(--primary)]">
      <div className={iconClass}>
        <Icon icon={icon} className="text-xl" />
      </div>
      <span className="text-50 text-sm font-medium">{text}</span>
    </div>
  );
}