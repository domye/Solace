-- Rollback Phase 2: Categories, Tags, Article-Tags

-- Remove indexes
DROP INDEX IF EXISTS idx_articles_category_id;
DROP INDEX IF EXISTS idx_article_tags_tag_id;
DROP INDEX IF EXISTS idx_article_tags_article_id;
DROP INDEX IF EXISTS idx_tags_deleted_at;
DROP INDEX IF EXISTS idx_tags_slug;
DROP INDEX IF EXISTS idx_categories_sort_order;
DROP INDEX IF EXISTS idx_categories_deleted_at;
DROP INDEX IF EXISTS idx_categories_parent_id;
DROP INDEX IF EXISTS idx_categories_slug;

-- Remove foreign key constraint
ALTER TABLE articles DROP CONSTRAINT IF EXISTS fk_articles_category;

-- Drop tables in reverse order
DROP TABLE IF EXISTS article_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS categories;