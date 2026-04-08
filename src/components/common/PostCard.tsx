/**
 * 文章卡片组件
 *
 * 用于文章列表页展示文章摘要信息
 * 移动端：卡片式布局，标题+摘要+封面，底部元信息
 * 桌面端：原布局（内容在上，封面在右侧）
 */

import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/utils/date';
import { LazyImage } from './LazyImage';
import type { PostCardArticle } from '@/types';

/** 桌面端封面图宽度百分比 */
const COVER_WIDTH_CSS = '28%';

/** 移动端封面图尺寸（更大方） */
const MOBILE_COVER_WIDTH = '120px';
const MOBILE_COVER_HEIGHT = '90px';

interface PostCardProps {
  article: PostCardArticle;
  className?: string;
  style?: React.CSSProperties;
}

/** 文章卡片主组件 */
export function PostCard({ article, className, style }: PostCardProps) {
  const hasCover = Boolean(article.cover_image);

  return (
    <article
      className={`card-base w-full rounded-[var(--radius-large)] overflow-hidden relative ${className || ''}`}
      style={{
        ...style,
        '--coverWidth': COVER_WIDTH_CSS,
      } as React.CSSProperties}
    >
      {/* 移动端：根据是否有封面选择布局 */}
      {hasCover ? (
        <MobileLayoutWithCover article={article} />
      ) : (
        <MobileLayoutNoCover article={article} />
      )}

      {/* 桌面端：原布局 + 悬浮效果 */}
      <div className="hidden md:block">
        <DesktopLayout article={article} hasCover={hasCover} />
      </div>

      {/* 桌面端悬浮效果 */}
      <div className="hidden md:block absolute inset-0 pointer-events-none card-hover-overlay rounded-[var(--radius-large)]" />
    </article>
  );
}

/** 移动端布局（有封面图） */
function MobileLayoutWithCover({ article }: { article: PostCardArticle }) {
  const formattedDate = formatDate(article.published_at || article.created_at);

  return (
    <Link
      to={`/articles/${article.slug}`}
      className="md:hidden flex gap-3 p-4 active:scale-[0.98] transition-transform duration-150"
    >
      {/* 左侧：标题 + 摘要 + 底部元信息 */}
      <div className="flex-1 min-w-0 flex flex-col">
        <h2 className="font-semibold text-[1.0625rem] text-150 leading-snug line-clamp-1 mb-1.5">
          {article.title}
        </h2>
        <p className="text-sm text-50 line-clamp-2 leading-relaxed flex-1">
          {article.summary || '暂无摘要'}
        </p>
        <div className="flex items-center gap-3 text-xs text-30 pt-2">
          <span className="flex items-center gap-1">
            <Icon icon="material-symbols:calendar-today-outline-rounded" className="text-sm" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <Icon icon="material-symbols:visibility-outline-rounded" className="text-sm" />
            {article.view_count}
          </span>
        </div>
      </div>

      {/* 右侧：封面图 - 底部与元信息齐平 */}
      <div
        className="flex-shrink-0 self-end rounded-lg overflow-hidden"
        style={{ width: MOBILE_COVER_WIDTH, height: MOBILE_COVER_HEIGHT }}
      >
        <LazyImage
          src={article.cover_image || ''}
          alt={article.title}
          className="w-full h-full object-cover"
          wrapperClassName="w-full h-full"
          effect="blur"
        />
      </div>
    </Link>
  );
}

/** 移动端布局（无封面图） */
function MobileLayoutNoCover({ article }: { article: PostCardArticle }) {
  const formattedDate = formatDate(article.published_at || article.created_at);

  return (
    <Link
      to={`/articles/${article.slug}`}
      className="md:hidden flex flex-col gap-2 p-4 active:scale-[0.98] transition-transform duration-150"
    >
      <h2 className="font-semibold text-[1.0625rem] text-150 leading-snug line-clamp-2">
        {article.title}
      </h2>
      <p className="text-sm text-50 line-clamp-2 leading-relaxed flex-1">
        {article.summary || '暂无摘要'}
      </p>
      <div className="flex items-center gap-3 text-xs text-30">
        <span className="flex items-center gap-1">
          <Icon icon="material-symbols:calendar-today-outline-rounded" className="text-sm" />
          {formattedDate}
        </span>
        <span className="flex items-center gap-1">
          <Icon icon="material-symbols:visibility-outline-rounded" className="text-sm" />
          {article.view_count}
        </span>
      </div>
    </Link>
  );
}

/** 桌面端布局（原风格） */
function DesktopLayout({ article, hasCover }: { article: PostCardArticle; hasCover: boolean }) {
  return (
    <div className="hidden md:flex md:flex-col w-full relative">
      <ContentArea article={article} hasCover={hasCover} />
      {hasCover && <DesktopCoverImage article={article} />}
      {!hasCover && <EntryButton slug={article.slug} />}
    </div>
  );
}

/** 桌面端内容区域 */
function ContentArea({ article, hasCover }: { article: PostCardArticle; hasCover: boolean }) {
  const contentWidth = hasCover
    ? 'w-[calc(100%-var(--coverWidth)-12px)]'
    : 'w-[calc(100%-52px-12px)]';

  return (
    <div className={`pl-9 pr-2 pt-7 pb-6 relative ${contentWidth}`}>
      <TitleLink article={article} />
      <PostMeta article={article} />
      <Summary text={article.summary} />
      <ViewCount count={article.view_count} />
    </div>
  );
}

/** 标题链接（桌面端） */
function TitleLink({ article }: { article: PostCardArticle }) {
  return (
    <Link
      to={`/articles/${article.slug}`}
      className="transition-smooth group w-full block font-bold mb-3 text-3xl text-90
        hover:text-[var(--primary)] dark:hover:text-[var(--primary)]
        before:w-1 before:h-5 before:rounded-md before:bg-[var(--primary)]
        before:absolute before:top-[35px] before:left-[18px]"
    >
      {article.title}
      <Icon
        icon="material-symbols:chevron-right-rounded"
        className="text-[var(--primary)] text-[2rem] transition-bounce inline absolute translate-y-0.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0"
      />
    </Link>
  );
}

/** 桌面端封面图片 */
function DesktopCoverImage({ article }: { article: PostCardArticle }) {
  return (
    <Link
      to={`/articles/${article.slug}`}
      className="group aspect-auto max-h-none
        w-[var(--coverWidth)] absolute top-3 bottom-3 right-3
        rounded-xl overflow-hidden"
    >
      <div className="absolute pointer-events-none z-10 w-full h-full group-hover:bg-black/30 transition-smooth" />
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

/** 进入按钮（无封面时，桌面端） */
function EntryButton({ slug }: { slug: string }) {
  return (
    <Link
      to={`/articles/${slug}`}
      className="btn-regular w-[3.25rem] absolute right-3 top-3 bottom-3 rounded-xl bg-[var(--btn-regular-bg)]
        hover:bg-[var(--btn-regular-bg-hover)] active:bg-[var(--btn-regular-bg-active)] active:scale-95 transition-smooth"
    >
      <Icon
        icon="material-symbols:chevron-right-rounded"
        className="transition-bounce text-[var(--primary)] text-4xl mx-auto"
      />
    </Link>
  );
}

/** 摘要（桌面端） */
function Summary({ text }: { text?: string }) {
  return (
    <div className="transition-smooth text-75 mb-3.5 pr-4 line-clamp-1">
      {text || '暂无摘要'}
    </div>
  );
}

/** 浏览量（桌面端） */
function ViewCount({ count }: { count: number }) {
  return (
    <div className="text-sm text-30 flex gap-4 transition-smooth">
      <span>{count} 次浏览</span>
    </div>
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