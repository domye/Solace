package request

// CreatePageRequest 创建页面请求体
type CreatePageRequest struct {
	Title      string `json:"title" validate:"required,min=1,max=200"`
	Slug       string `json:"slug" validate:"omitempty,min=1,max=200"`
	Template   string `json:"template" validate:"omitempty,oneof=default about projects footprints"`
	Content    string `json:"content" validate:"omitempty"`
	Summary    string `json:"summary" validate:"omitempty,max=500"`
	CoverImage string `json:"cover_image" validate:"omitempty,max=500"`
	Status     string `json:"status" validate:"omitempty,oneof=draft published"`
	Order      int    `json:"order" validate:"omitempty,min=0"`
	ShowInNav  bool   `json:"show_in_nav"`
}

// UpdatePageRequest 更新页面请求体
type UpdatePageRequest struct {
	Title      string `json:"title" validate:"omitempty,min=1,max=200"`
	Slug       string `json:"slug" validate:"omitempty,min=1,max=200"`
	Template   string `json:"template" validate:"omitempty,oneof=default about projects footprints"`
	Content    string `json:"content" validate:"omitempty"`
	Summary    string `json:"summary" validate:"omitempty,max=500"`
	CoverImage string `json:"cover_image" validate:"omitempty,max=500"`
	Status     string `json:"status" validate:"omitempty,oneof=draft published"`
	Order      int    `json:"order" validate:"omitempty,min=0"`
	ShowInNav  bool   `json:"show_in_nav"`
	Version    int    `json:"version" validate:"required,min=1"`
}

// PageListQuery 页面列表查询参数
type PageListQuery struct {
	Page     int    `form:"page" validate:"omitempty,min=1"`
	PageSize int    `form:"pageSize" validate:"omitempty,min=1,max=100"`
	Status   string `form:"status" validate:"omitempty,oneof=draft published"`
	Template string `form:"template" validate:"omitempty,oneof=default about projects footprints"`
}
