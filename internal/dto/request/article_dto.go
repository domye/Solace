package request

// CreateArticleRequest 创建文章请求体
type CreateArticleRequest struct {
	Title      string `json:"title" validate:"required,min=1,max=200"`
	Slug       string `json:"slug" validate:"omitempty,min=1,max=200"`
	Content    string `json:"content" validate:"required,min=1"`
	Summary    string `json:"summary" validate:"omitempty,max=500"`
	CoverImage string `json:"cover_image" validate:"omitempty,max=500"`
	CategoryID *uint  `json:"category_id" validate:"omitempty"`
	TagIDs     []uint `json:"tag_ids" validate:"omitempty"`
	Status     string `json:"status" validate:"omitempty,oneof=draft published"`
}

// UpdateArticleRequest 更新文章请求体
type UpdateArticleRequest struct {
	Title      string `json:"title" validate:"omitempty,min=1,max=200"`
	Slug       string `json:"slug" validate:"omitempty,min=1,max=200"`
	Content    string `json:"content" validate:"omitempty,min=1"`
	Summary    string `json:"summary" validate:"omitempty,max=500"`
	CoverImage string `json:"cover_image" validate:"omitempty,max=500"`
	CategoryID *uint  `json:"category_id" validate:"omitempty"`
	TagIDs     []uint `json:"tag_ids" validate:"omitempty"`
	Status     string `json:"status" validate:"omitempty,oneof=draft published"`
	Version    int    `json:"version" validate:"required,min=1"`
}

// ArticleListQuery 文章列表查询参数
type ArticleListQuery struct {
	Page     int    `form:"page" validate:"omitempty,min=1"`
	PageSize int    `form:"pageSize" validate:"omitempty,min=1,max=100"`
	Status   string `form:"status" validate:"omitempty,oneof=draft published"`
	Category string `form:"category" validate:"omitempty"` // 分类 slug
	Tag      string `form:"tag" validate:"omitempty"`      // 标签 slug
}
