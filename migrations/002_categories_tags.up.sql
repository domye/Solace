-- Phase 2: Categories, Tags, Article-Tags

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tags table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Article-Tags junction table (many-to-many)
CREATE TABLE article_tags (
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- Add foreign key constraint for category_id in articles
ALTER TABLE articles
    ADD CONSTRAINT fk_articles_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_deleted_at ON categories(deleted_at);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_deleted_at ON tags(deleted_at);

CREATE INDEX idx_article_tags_article_id ON article_tags(article_id);
CREATE INDEX idx_article_tags_tag_id ON article_tags(tag_id);

-- Update articles index for category filtering
CREATE INDEX idx_articles_category_id ON articles(category_id) WHERE deleted_at IS NULL;

-- Enable pg_trgm extension for full-text search (optional, requires superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX idx_articles_title_trgm ON articles USING gin (title gin_trgm_ops);
-- CREATE INDEX idx_articles_content_trgm ON articles USING gin (content gin_trgm_ops);