-- 添加全文搜索支持
-- 为 articles 表添加 tsvector 列和索引

-- 1. 添加 search_vec 列（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'articles' AND column_name = 'search_vec'
    ) THEN
        ALTER TABLE articles ADD COLUMN search_vec tsvector;
    END IF;
END $$;

-- 2. 创建 GIN 索引（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'index_article_search'
    ) THEN
        CREATE INDEX index_article_search ON articles USING gin(search_vec);
    END IF;
END $$;

-- 3. 创建触发器函数：自动更新 search_vec
CREATE OR REPLACE FUNCTION update_article_search_vec()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vec :=
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.content, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'article_search_vec_update'
    ) THEN
        CREATE TRIGGER article_search_vec_update
        BEFORE INSERT OR UPDATE ON articles
        FOR EACH ROW EXECUTE FUNCTION update_article_search_vec();
    END IF;
END $$;

-- 5. 初始化现有数据的 search_vec
UPDATE articles SET search_vec =
    setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(summary, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(content, '')), 'C')
WHERE search_vec IS NULL;

-- 说明：
-- - 'simple' 配置不进行词干提取，适合中文
-- - 权重 A > B > C，标题权重最高，摘要次之，内容最低
-- - GIN 索引支持高效的全文搜索查询
-- - 触发器自动维护索引，无需手动更新
