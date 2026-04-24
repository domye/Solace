package response

import "time"

type CategoryResponse struct {
	ID           uint      `json:"id"`
	Name         string    `json:"name"`
	Slug         string    `json:"slug"`
	Description  string    `json:"description,omitempty"`
	ParentID     *uint     `json:"parent_id,omitempty"`
	SortOrder    int       `json:"sort_order"`
	ArticleCount int       `json:"article_count,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CategoryListResponse struct {
	Items []*CategoryResponse `json:"items"`
}