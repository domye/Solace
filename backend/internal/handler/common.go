package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	apperrors "gin-quickstart/internal/pkg/errors"
)

// HealthCheck 返回服务器健康状态
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"status":    "healthy",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		},
	})
}

// PaginationParams 分页参数
type PaginationParams struct {
	Page     int
	PageSize int
}

// ParsePagination 从请求参数解析分页，返回标准化后的值
// page: 默认 1，最小 1
// pageSize: 默认 defaultSize，最小 1，最大 maxSize
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

// ParseLimit 解析 limit 参数，用于非分页的列表查询
// 返回值在 [1, maxSize] 范围内，默认为 defaultLimit
func ParseLimit(c *gin.Context, defaultLimit, maxSize int) int {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", strconv.Itoa(defaultLimit)))
	if limit < 1 || limit > maxSize {
		limit = defaultLimit
	}
	return limit
}

// ParseID 从路径参数解析 ID
func ParseID(c *gin.Context, paramName string) (uint, error) {
	idStr := c.Param(paramName)
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		return 0, apperrors.NewBadRequest("无效的ID参数", nil)
	}
	return uint(id), nil
}
