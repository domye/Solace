import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/utils/date';

// 文章类型（匹配 API 响应）
interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  cover_image?: string;
  author_id: number;
  author?: { id: number; username: string; nickname?: string };
  status: string;
  view_count: number;
  is_top: boolean;
  version: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

interface PostCardProps {
  article: Article;
  class?: string;
  style?: React.CSSProperties;
}

export function PostCard({ article, class: className, style }: PostCardProps) {
  const hasCover = article.cover_image && article.cover_image !== '';
  const coverWidth = '28%';

  return (
    <>
      <div
        className={`card-base flex flex-col-reverse md:flex-col w-full rounded-[var(--radius-large)] overflow-hidden relative ${className || ''}`}
        style={style}
      >
        {/* 内容区域 */}
        <div className={`pl-6 md:pl-9 pr-6 md:pr-2 pt-6 md:pt-7 pb-6 relative ${
          hasCover
            ? 'w-full md:w-[calc(100%-var(--coverWidth)-12px)]'
            : 'w-full md:w-[calc(100%-52px-12px)]'
        }`}>
          {/* 标题 */}
          <Link
            to={`/articles/${article.slug}`}
            className="transition group w-full block font-bold mb-3 text-3xl text-90
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
              className="text-[var(--primary)] text-[2rem] transition hidden md:inline absolute translate-y-0.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0"
            />
          </Link>

          {/* 元信息 */}
          <PostMeta article={article} hideTagsForMobile />

          {/* 摘要 */}
          <div className="transition text-75 mb-3.5 pr-4 line-clamp-2 md:line-clamp-1">
            {article.summary || '暂无摘要'}
          </div>

          {/* 浏览量 */}
          <div className="text-sm text-30 flex gap-4 transition">
            <div>{article.view_count} 次浏览</div>
          </div>
        </div>

        {/* 封面图片 */}
        {hasCover && (
          <Link
            to={`/articles/${article.slug}`}
            className="group max-h-[20vh] md:max-h-none mx-4 mt-4 -mb-2 md:mb-0 md:mx-0 md:mt-0
              md:w-[var(--coverWidth)] relative md:absolute md:top-3 md:bottom-3 md:right-3
              rounded-xl overflow-hidden active:scale-95"
          >
            <div className="absolute pointer-events-none z-10 w-full h-full group-hover:bg-black/30 group-active:bg-black/50 transition" />
            <div className="absolute pointer-events-none z-20 w-full h-full flex items-center justify-center">
              <Icon
                icon="material-symbols:chevron-right-rounded"
                className="transition opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 text-white text-5xl"
              />
            </div>
            <img
              src={article.cover_image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </Link>
        )}

        {/* 进入按钮（无封面时） */}
        {!hasCover && (
          <Link
            to={`/articles/${article.slug}`}
            className="!hidden md:!flex btn-regular w-[3.25rem] absolute right-3 top-3 bottom-3 rounded-xl bg-[var(--btn-regular-bg)]
              hover:bg-[var(--btn-regular-bg-hover)] active:bg-[var(--btn-regular-bg-active)] active:scale-95"
          >
            <Icon
              icon="material-symbols:chevron-right-rounded"
              className="transition text-[var(--primary)] text-4xl mx-auto"
            />
          </Link>
        )}
      </div>

      {/* 分隔线（移动端） */}
      <div className="transition border-t-[1px] border-dashed mx-6 border-[var(--border-medium)] last:border-t-0 md:hidden" />

      <style>{`:root { --coverWidth: ${coverWidth}; }`}</style>
    </>
  );
}

interface PostMetaProps {
  article: Article;
  hideUpdateDate?: boolean;
  hideTagsForMobile?: boolean;
}

export function PostMeta({ article, hideUpdateDate, hideTagsForMobile }: PostMetaProps) {
  const showUpdate = !hideUpdateDate && article.updated_at !== article.created_at;

  return (
    <div className={`flex flex-wrap text-50 items-center gap-4 gap-x-4 gap-y-2 mb-4 ${hideTagsForMobile ? '' : ''}`}>
      {/* 发布日期 */}
      <div className="flex items-center">
        <div className="meta-icon">
          <Icon icon="material-symbols:calendar-today-outline-rounded" className="text-xl" />
        </div>
        <span className="text-50 text-sm font-medium">{formatDate(article.published_at || article.created_at)}</span>
      </div>

      {/* 更新日期 */}
      {showUpdate && (
        <div className="flex items-center">
          <div className="meta-icon">
            <Icon icon="material-symbols:edit-calendar-outline-rounded" className="text-xl" />
          </div>
          <span className="text-50 text-sm font-medium">{formatDate(article.updated_at)}</span>
        </div>
      )}

      {/* 作者 */}
      {article.author && (
        <div className="flex items-center">
          <div className="meta-icon">
            <Icon icon="material-symbols:person-outline-rounded" className="text-xl" />
          </div>
          <span className="text-50 text-sm font-medium">{article.author.nickname || article.author.username}</span>
        </div>
      )}

      {/* 状态（草稿） */}
      {article.status === 'draft' && (
        <div className="flex items-center">
          <div className="meta-icon bg-amber-500/20 text-amber-600">
            <Icon icon="material-symbols:edit-note-rounded" className="text-xl" />
          </div>
          <span className="text-50 text-sm font-medium">草稿</span>
        </div>
      )}
    </div>
  );
}