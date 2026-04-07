/**
 * 文章数据转换工具
 */

import type { ArticleSummary, PostCardArticle } from '@/types';

/** 将 ArticleSummary 转换为 PostCard 组件所需格式 */
export function toPostCardArticle(article: ArticleSummary): PostCardArticle {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    cover_image: article.cover_image,
    author: article.author,
    status: article.status,
    view_count: article.view_count,
    published_at: article.published_at,
    created_at: article.created_at,
    updated_at: article.created_at,
  };
}