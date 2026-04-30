package request

type CreateCategoryRequest struct {
	Name        string `json:"name" validate:"required,min=1,max=100"`
	Slug        string `json:"slug" validate:"omitempty,min=1,max=100"`
	Description string `json:"description" validate:"omitempty,max=500"`
	ParentID    *uint  `json:"parent_id" validate:"omitempty"`
	SortOrder   int    `json:"sort_order" validate:"omitempty,min=0"`
}

type UpdateCategoryRequest struct {
	Name        string `json:"name" validate:"omitempty,min=1,max=100"`
	Slug        string `json:"slug" validate:"omitempty,min=1,max=100"`
	Description string `json:"description" validate:"omitempty,max=500"`
	ParentID    *uint  `json:"parent_id" validate:"omitempty"`
	SortOrder   int    `json:"sort_order" validate:"omitempty,min=0"`
}
