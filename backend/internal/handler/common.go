package handler

import (
	"context"
	"net/http"
	"strconv"
	"time"

	apperrors "gin-quickstart/internal/pkg/errors"
	"github.com/gin-gonic/gin"
)

const mediaSideEffectTimeout = 5 * time.Second

func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"status":    "healthy",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		},
	})
}

func detachedRequestContext(c *gin.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.WithoutCancel(c.Request.Context()), mediaSideEffectTimeout)
}

type PaginationParams struct {
	Page     int
	PageSize int
}

func ParsePagination(c *gin.Context, defaultSize, maxSize int) PaginationParams {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", strconv.Itoa(defaultSize)))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > maxSize {
		pageSize = defaultSize
	}

	return PaginationParams{Page: page, PageSize: pageSize}
}

func ParseLimit(c *gin.Context, defaultLimit, maxSize int) int {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", strconv.Itoa(defaultLimit)))
	if limit < 1 || limit > maxSize {
		limit = defaultLimit
	}
	return limit
}

func ParseID(c *gin.Context, paramName string) (uint, error) {
	idStr := c.Param(paramName)
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		return 0, apperrors.NewBadRequest("无效的ID参数", nil)
	}
	return uint(id), nil
}
