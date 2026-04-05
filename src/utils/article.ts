import type { ArticleSummary } from '@/types';

/**
 * Converts ArticleSummary from API to PostCard's expected Article format.
 * PostCard expects additional fields that ArticleSummary doesn't have.
 */
export function toPostCardArticle(article: ArticleSummary) {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    content: '', // not needed for list view
    summary: article.summary,
    cover_image: article.cover_image,
    author_id: article.author?.id || 0,
    author: article.author,
    status: article.status,
    view_count: article.view_count,
    is_top: false,
    version: 1,
    published_at: article.published_at,
    created_at: article.created_at,
    updated_at: article.created_at,
  };
}