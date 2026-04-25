-- Re-add view_count column to articles table
ALTER TABLE articles ADD COLUMN view_count INTEGER DEFAULT 0;