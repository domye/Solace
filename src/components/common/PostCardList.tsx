/**
 * 文章卡片列表组件
 *
 * 移动端布局规则：
 * - 有封面的卡片：占满整行
 * - 无封面的卡片：两两配对，两列布局
 * - 无封面卡片如果总数是奇数，最后一个占满整行
 * - 桌面端：单列布局
 */

import { PostCard } from './PostCard';
import type { PostCardArticle } from '@/types';

interface PostCardListProps {
  articles: PostCardArticle[];
  className?: string;
}

export function PostCardList({ articles, className = '' }: PostCardListProps) {
  // 预计算每个无封面卡片是否应该占半行
  // 无封面卡片按顺序两两配对，配对的两个各占半行
  const noCoverIndices = articles
    .map((article, index) => (!article.cover_image ? index : -1))
    .filter((i) => i !== -1);

  // 记录哪些无封面卡片应该占半行（配对成功的）
  const halfRowIndices = new Set<number>();

  // 两两配对
  for (let i = 0; i < noCoverIndices.length; i += 2) {
    const first = noCoverIndices[i];
    const second = noCoverIndices[i + 1];

    if (first !== undefined && second !== undefined) {
      // 有配对，两个都占半行
      halfRowIndices.add(first);
      halfRowIndices.add(second);
    }
    // 如果是奇数个，最后一个不加入halfRowIndices，会占整行
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-4 ${className}`}>
      {articles.map((article, index) => {
        const hasCover = Boolean(article.cover_image);

        // 有封面占整行，无封面根据配对情况决定
        const shouldSpanHalfRow = !hasCover && halfRowIndices.has(index);
        const colSpanClass = shouldSpanHalfRow
          ? 'md:col-span-1' // 配对成功，占半行
          : 'col-span-2 md:col-span-1'; // 占整行

        return (
          <PostCard
            key={article.id}
            article={article}
            className={`content-appear ${colSpanClass}`}
            style={{ animationDelay: `${index * 40}ms` }}
          />
        );
      })}
    </div>
  );
}
