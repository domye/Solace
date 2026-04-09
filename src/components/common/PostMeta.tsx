/**
 * 文章元信息组件
 *
 * 显示文章的日期、作者、状态等元信息
 */

import { formatDate } from '@/utils/date';
import { MetaItem } from './MetaItem';
import type { PostCardArticle } from '@/types';

interface PostMetaProps {
  article: PostCardArticle;
  /** 是否隐藏更新日期 */
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
