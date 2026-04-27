package handler

import (
	"errors"
	"net/http"
	"strings"

	apperrors "gin-quickstart/internal/pkg/errors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"
)

// Response 标准 API 响应结构
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorBody  `json:"error,omitempty"`
}

// ErrorBody 错误响应结构
type ErrorBody struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// PagedResponse 分页响应结构
type PagedResponse struct {
	Success    bool        `json:"success"`
	Data       interface{} `json:"data"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	Total      int64       `json:"total"`
	TotalPages int         `json:"totalPages"`
}

func RespondWithSuccess(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    data,
	})
}

func RespondWithCreated(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    data,
	})
}

func RespondWithPaged(c *gin.Context, data interface{}, page, pageSize int, total int64) {
	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, PagedResponse{
		Success:    true,
		Data:       data,
		Page:       page,
		PageSize:   pageSize,
		Total:      total,
		TotalPages: totalPages,
	})
}

func RespondWithError(c *gin.Context, err error) {
	var appErr apperrors.AppError
	if errors.As(err, &appErr) {
		c.JSON(appErr.HTTPStatus(), Response{
			Success: false,
			Error: &ErrorBody{
				Code:    appErr.Code(),
				Message: appErr.Error(),
				Details: appErr.Details(),
			},
		})
		return
	}

	if isArticleSlugConflictError(err) {
		conflictErr := apperrors.NewConflict(
			"文章链接已存在，请修改标题或自定义 slug 后重试",
			map[string]string{"field": "slug"},
		)
		c.JSON(conflictErr.HTTPStatus(), Response{
			Success: false,
			Error: &ErrorBody{
				Code:    conflictErr.Code(),
				Message: conflictErr.Error(),
				Details: conflictErr.Details(),
			},
		})
		return
	}

	c.JSON(http.StatusInternalServerError, Response{
		Success: false,
		Error: &ErrorBody{
			Code:    "INTERNAL_ERROR",
			Message: "服务器内部错误",
		},
	})
}

func RespondWithNoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

func isArticleSlugConflictError(err error) bool {
	if err == nil {
		return false
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505" && pgErr.ConstraintName == "articles_slug_key"
	}

	return strings.Contains(err.Error(), "articles_slug_key")
}
