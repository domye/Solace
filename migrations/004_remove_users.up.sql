-- Remove users table and related foreign key constraints
-- This migration simplifies the system to single-admin mode (config-based auth)

-- 1. Remove foreign key constraint from articles table
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_author_id_fkey;

-- 2. Remove foreign key constraint from refresh_tokens table
ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;

-- 3. Drop refresh_tokens table (depends on users)
DROP TABLE IF EXISTS refresh_tokens;

-- 4. Drop users table
DROP TABLE IF EXISTS users;

-- 5. Drop related indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_deleted_at;
DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
DROP INDEX IF EXISTS idx_refresh_tokens_token;
DROP INDEX IF EXISTS idx_refresh_tokens_deleted_at;
