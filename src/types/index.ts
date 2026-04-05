// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  nickname?: string;
  avatar_url?: string;
  bio?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// Category Types
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

// Tag Types
export interface Tag {
  id: number;
  name: string;
  slug: string;
  article_count?: number;
  created_at: string;
  updated_at: string;
}

// Article Types
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
  status: 'draft' | 'published';
  view_count: number;
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

export interface ArticleNav {
  title: string;
  slug: string;
}

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
  view_count: number;
  published_at?: string;
  created_at: string;
}

// Archive Types
export interface ArchiveMonth {
  month: number;
  count: number;
  articles: ArticleSummary[];
}

export interface ArchiveGroup {
  year: number;
  count: number;
  months: ArchiveMonth[];
}

// Component Props Types
export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface SearchProps {
  onSearch: (query: string) => void;
  initialValue?: string;
}

// Request Types
export interface CreateArticleRequest {
  title: string;
  content: string;
  summary?: string;
  cover_image?: string;
  category_id?: number;
  tag_ids?: number[];
  status?: 'draft' | 'published';
}

export interface UpdateArticleRequest {
  title?: string;
  content?: string;
  summary?: string;
  cover_image?: string;
  category_id?: number;
  tag_ids?: number[];
  status?: 'draft' | 'published';
  version: number;
}