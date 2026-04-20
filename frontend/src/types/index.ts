/**
 * 全局类型定义
 *
 * 包含 API 响应、数据模型、组件属性等类型
 */

// ============ API 响应类型 ============

/** 通用 API 响应 */
export interface ApiResponse<T> {
	success: boolean;
	data: T;
	error?: {
		code: string;
		message: string;
		details?: Record<string, string>;
	};
}

/** 分页响应 */
export interface PagedResponse<T> {
	data: T[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}

// ============ 用户类型 ============

/** 用户信息 */
export interface User {
	id: number;
	username: string;
	email: string;
	nickname?: string;
	avatar_url?: string;
	bio?: string;
	github_url?: string;
	role: string;
	created_at?: string;
	updated_at?: string;
}

/** 站长公开信息 */
export interface Owner {
	nickname?: string;
	avatar_url?: string;
	bio?: string;
	github_url?: string;
}

// ============ 分类类型 ============

/** 分类 */
export interface Category {
	id: number;
	name: string;
	slug: string;
	description?: string;
	parent_id?: number;
	sort_order: number;
	article_count?: number;
	created_at: string;
	updated_at: string;
}

// ============ 标签类型 ============

/** 标签 */
export interface Tag {
	id: number;
	name: string;
	slug: string;
	article_count?: number;
	created_at: string;
	updated_at: string;
}

// ============ 文章类型 ============

/** 文章详情 */
export interface Article {
	id: number;
	title: string;
	slug: string;
	content: string;
	summary?: string;
	cover_image?: string;
	author_id: number;
	author?: User;
	category?: Category;
	tags?: Tag[];
	status: "draft" | "published";
	is_top: boolean;
	version: number;
	word_count: number;
	read_time: number;
	prev?: ArticleNav;
	next?: ArticleNav;
	published_at?: string;
	created_at: string;
	updated_at: string;
}

/** 文章导航（上一篇/下一篇） */
export interface ArticleNav {
	title: string;
	slug: string;
}

/** 文章摘要（列表项） */
export interface ArticleSummary {
	id: number;
	title: string;
	slug: string;
	summary?: string;
	cover_image?: string;
	author?: User;
	category?: Category;
	tags?: Tag[];
	status: string;
	published_at?: string;
	created_at: string;
	updated_at?: string;
}

/** 归档分组（按年份） */
export interface ArchiveGroup {
	year: number;
	count: number;
	posts: ArticleSummary[];
}

// ============ 组件属性类型 ============

/** 分页组件属性 */
export interface PaginationProps {
	page: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
}

/** 搜索组件属性 */
export interface SearchProps {
	onSearch: (query: string) => void;
	initialValue?: string;
}

// ============ 请求类型 ============

/** 创建文章请求 */
export interface CreateArticleRequest {
	title: string;
	content: string;
	summary?: string;
	cover_image?: string;
	category_id?: number;
	tag_ids?: number[];
	status?: "draft" | "published";
}

/** 更新文章请求 */
export interface UpdateArticleRequest {
	title?: string;
	content?: string;
	summary?: string;
	cover_image?: string;
	category_id?: number;
	tag_ids?: number[];
	status?: "draft" | "published";
	version: number;
}

// ============ 展示类型 ============

/** 文章卡片展示数据（精简字段） */
export interface PostCardArticle {
	id: number;
	title: string;
	slug: string;
	summary?: string;
	cover_image?: string;
	author?: { id: number; username: string; nickname?: string };
	category?: Category;
	tags?: Tag[];
	status: string;
	published_at?: string;
	created_at: string;
	updated_at: string;
}

// ============ 页面类型 ============

/** 页面模板类型 */
export type PageTemplate = "default" | "about" | "projects" | "footprints";

/** 页面详情 */
export interface Page {
	id: number;
	title: string;
	slug: string;
	template: PageTemplate;
	content: string;
	summary?: string;
	cover_image?: string;
	status: "draft" | "published";
	order: number;
	show_in_nav: boolean;
	version: number;
	created_at: string;
	updated_at: string;
}

/** 页面列表项（不含 content） */
export interface PageListItem {
	id: number;
	title: string;
	slug: string;
	template: PageTemplate;
	summary?: string;
	cover_image?: string;
	status: "draft" | "published";
	order: number;
	show_in_nav: boolean;
	created_at: string;
	updated_at: string;
}

/** 导航页面项（精简） */
export interface NavPage {
	slug: string;
	title: string;
	order: number;
}

// ============ Frontmatter 类型 ============

/** 关于我模板 frontmatter */
export interface AboutFrontmatter {}

/** GitHub 仓库信息（API 返回） */
export interface GitHubRepoInfo {
	name: string;
	description: string | null;
	html_url: string;
	stargazers_count: number;
	forks_count: number;
	language: string | null;
	owner: {
		login: string;
		avatar_url: string;
	};
}

/** 项目 */
export interface Project {
	name: string;
	description: string;
	tech: string[];
	github?: string;
	githubRepo?: string;
	demo?: string;
	cover?: string;
	avatar?: string;
	status: "active" | "archived";
	highlights?: string[];
}

/** 项目模板 frontmatter */
export interface ProjectsFrontmatter {
	projects?: Project[];
}

/** 城市足迹 */
export interface FootprintCity {
	name: string;
	country: string;
	province?: string;
	visited_at?: string;
	duration?: string;
	highlights?: string[];
	coords?: { lat: number; lng: number };
	photos?: string[];
	notes?: string;
}

/** 足迹模板 frontmatter */
export interface FootprintsFrontmatter {
	cities?: FootprintCity[];
}

/** 解析后的内容 */
export interface ParsedContent<T> {
	frontmatter: T;
	markdown: string;
}
