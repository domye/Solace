package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"gin-quickstart/internal/dto/request"
	apperrors "gin-quickstart/internal/pkg/errors"
	"gin-quickstart/internal/service"
)

// CategoryHandler 分类处理器
type CategoryHandler struct {
	categoryService service.CategoryService
}

// NewCategoryHandler 创建分类处理器
func NewCategoryHandler(categoryService service.CategoryService) *CategoryHandler {
	return &CategoryHandler{categoryService: categoryService}
}

// Create 创建分类
// @Summary 创建分类
// @Tags category
// @Accept json
// @Produce json
// @Param request body request.CreateCategoryRequest true "分类数据"
// @Success 201 {object} Response
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Router /categories [post]
func (h *CategoryHandler) Create(c *gin.Context) {
	var req request.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的请求体", nil))
		return
	}

	category, err := h.categoryService.Create(
		c.Request.Context(),
		req.Name,
		req.Slug,
		req.Description,
		req.ParentID,
		req.SortOrder,
	)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithCreated(c, category)
}

// GetList 获取分类列表
// @Summary 获取分类列表
// @Tags category
// @Produce json
// @Success 200 {object} Response
// @Router /categories [get]
func (h *CategoryHandler) GetList(c *gin.Context) {
	list, err := h.categoryService.GetList(c.Request.Context())
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, list.Items)
}

// Update 更新分类
// @Summary 更新分类
// @Tags category
// @Accept json
// @Produce json
// @Param id path int true "分类ID"
// @Param request body request.UpdateCategoryRequest true "分类数据"
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Router /categories/{id} [put]
func (h *CategoryHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的分类ID", nil))
		return
	}

	var req request.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的请求体", nil))
		return
	}

	category, err := h.categoryService.Update(
		c.Request.Context(),
		uint(id),
		req.Name,
		req.Slug,
		req.Description,
		req.ParentID,
		req.SortOrder,
	)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, category)
}

// Delete 删除分类
// @Summary 删除分类
// @Tags category
// @Param id path int true "分类ID"
// @Success 204 "无内容"
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Router /categories/{id} [delete]
func (h *CategoryHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的分类ID", nil))
		return
	}

	if err := h.categoryService.Delete(c.Request.Context(), uint(id)); err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithNoContent(c)
}
