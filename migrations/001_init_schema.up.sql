-- Initial schema migration for blog backend
-- Phase 1: Users, Articles, Refresh Tokens

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    avatar_url VARCHAR(500),
    bio TEXT,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Articles table
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    summary VARCHAR(500),
    cover_image VARCHAR(500),
    author_id INTEGER NOT NULL REFERENCES users(id),
    category_id INTEGER,  -- Placeholder for Phase 2, no FK yet
    status VARCHAR(20) DEFAULT 'draft',
    view_count INTEGER DEFAULT 0,
    is_top BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,  -- For optimistic locking
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_deleted_at ON articles(deleted_at);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC) WHERE status = 'published';

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_deleted_at ON refresh_tokens(deleted_at);