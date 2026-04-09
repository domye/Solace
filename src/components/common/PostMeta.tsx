/**
 * 文章元信息组件
 */

import { formatDate } from '@/utils/date';
import { MetaItem } from './MetaItem';
import type { PostCardArticle } from '@/types';

export function PostMeta({ article, hideUpdateDate }: { article: PostCardArticle; hideUpdateDate?: boolean }) {
  const showUpdate = !hideUpdateDate && article.updated_at !== article.created_at;

  return (
    <div className="flex flex-wrap text-50 items-center gap-4 gap-y-2 mb-4">
      <MetaItem icon="material-symbols:calendar-today-outline-rounded" text={formatDate(article.published_at || article.created_at)} />
      {showUpdate && <MetaItem icon="material-symbols:edit-calendar-outline-rounded" text={formatDate(article.updated_at)} />}
      {article.author && <MetaItem icon="material-symbols:person-outline-rounded" text={article.author.nickname || article.author.username} />}
      {article.status === 'draft' && <MetaItem icon="material-symbols:edit-note-rounded" text="草稿" variant="warning" />}
    </div>
  );
}
