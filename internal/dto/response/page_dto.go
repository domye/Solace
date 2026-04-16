package response

import "time"

// PageResponse 页面响应（完整内容）
type PageResponse struct {
	ID         uint      `json:"id"`
	Title      string    `json:"title"`
	Slug       string    `json:"slug"`
	Template   string    `json:"template"`
	Content    string    `json:"content"`
	Summary    string    `json:"summary,omitempty"`
	CoverImage string    `json:"cover_image,omitempty"`
	Status     string    `json:"status"`
	Order      int       `json:"order"`
	ShowInNav  bool      `json:"show_in_nav"`
	Version    int       `json:"version"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// PageListItem 页面列表项（不含 content）
type PageListItem struct {
	ID         uint      `json:"id"`
	Title      string    `json:"title"`
	Slug       string    `json:"slug"`
	Template   string    `json:"template"`
	Summary    string    `json:"summary,omitempty"`
	CoverImage string    `json:"cover_image,omitempty"`
	Status     string    `json:"status"`
	Order      int       `json:"order"`
	ShowInNav  bool      `json:"show_in_nav"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// PageListResponse 页面列表响应
type PageListResponse struct {
	Items    []*PageListItem `json:"data"`
	Page     int             `json:"page"`
	PageSize int             `json:"pageSize"`
	Total    int64           `json:"total"`
}

// NavPageResponse 导航页面项（精简）
type NavPageResponse struct {
	Slug  string `json:"slug"`
	Title string `json:"title"`
	Order int    `json:"order"`
}
