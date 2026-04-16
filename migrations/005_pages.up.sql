-- 创建 pages 表
CREATE TABLE pages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    template VARCHAR(50) DEFAULT 'default',
    content TEXT,
    summary VARCHAR(500),
    cover_image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    page_order INTEGER DEFAULT 0,
    show_in_nav BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_template ON pages(template);
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_pages_order ON pages(page_order);
CREATE INDEX idx_pages_deleted_at ON pages(deleted_at);

-- 插入默认页面示例
INSERT INTO pages (title, slug, template, content, status, page_order, show_in_nav) VALUES
('关于我', 'about', 'about', '---\ntimeline:\n  - date: "2024-03"\n    title: "开始写博客"\n    type: "milestone"\n---\n\n## 关于我\n\n欢迎来到我的博客！\n\n这是一个关于页面示例。', 'published', 1, true);