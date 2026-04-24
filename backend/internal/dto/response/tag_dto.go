package response

import "time"

type TagResponse struct {
	ID           uint      `json:"id"`
	Name         string    `json:"name"`
	Slug         string    `json:"slug"`
	ArticleCount int       `json:"article_count,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type TagListResponse struct {
	Items []*TagResponse `json:"items"`
}