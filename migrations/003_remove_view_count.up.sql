-- Remove view_count column from articles table
ALTER TABLE articles DROP COLUMN IF EXISTS view_count;