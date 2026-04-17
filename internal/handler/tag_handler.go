package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"gin-quickstart/internal/dto/request"
	apperrors "gin-quickstart/internal/pkg/errors"
	"gin-quickstart/internal/service"
)

// TagHandler 标签处理器
type TagHandler struct {
	tagService service.TagService
}

// NewTagHandler 创建标签处理器
func NewTagHandler(tagService service.TagService) *TagHandler {
	return &TagHandler{tagService: tagService}
}

// Create 创建标签
// @Summary 创建标签
// @Tags tag
// @Accept json
// @Produce json
// @Param request body request.CreateTagRequest true "标签数据"
// @Success 201 {object} Response
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Router /tags [post]
func (h *TagHandler) Create(c *gin.Context) {
	var req request.CreateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的请求体", nil))
		return
	}

	tag, err := h.tagService.Create(c.Request.Context(), req.Name, req.Slug)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithCreated(c, tag)
}

// GetByID 根据ID获取标签
// @Summary 根据ID获取标签
// @Tags tag
// @Produce json
// @Param id path int true "标签ID"
// @Success 200 {object} Response
// @Failure 404 {object} Response
// @Router /tags/{id} [get]
func (h *TagHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的标签ID", nil))
		return
	}

	tag, err := h.tagService.GetByID(c.Request.Context(), uint(id))
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, tag)
}

// GetBySlug 根据Slug获取标签
// @Summary 根据Slug获取标签
// @Tags tag
// @Produce json
// @Param slug path string true "标签Slug"
// @Success 200 {object} Response
// @Failure 404 {object} Response
// @Router /tags/slug/{slug} [get]
func (h *TagHandler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		RespondWithError(c, apperrors.NewBadRequest("标签Slug不能为空", nil))
		return
	}

	tag, err := h.tagService.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, tag)
}

// GetList 获取标签列表
// @Summary 获取标签列表
// @Tags tag
// @Produce json
// @Success 200 {object} Response
// @Router /tags [get]
func (h *TagHandler) GetList(c *gin.Context) {
	list, err := h.tagService.GetList(c.Request.Context())
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, list.Items)
}

// Update 更新标签
// @Summary 更新标签
// @Tags tag
// @Accept json
// @Produce json
// @Param id path int true "标签ID"
// @Param request body request.UpdateTagRequest true "标签数据"
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Router /tags/{id} [put]
func (h *TagHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的标签ID", nil))
		return
	}

	var req request.UpdateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的请求体", nil))
		return
	}

	tag, err := h.tagService.Update(c.Request.Context(), uint(id), req.Name, req.Slug)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, tag)
}

// Delete 删除标签
// @Summary 删除标签
// @Tags tag
// @Param id path int true "标签ID"
// @Success 204 "无内容"
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Router /tags/{id} [delete]
func (h *TagHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的标签ID", nil))
		return
	}

	if err := h.tagService.Delete(c.Request.Context(), uint(id)); err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithNoContent(c)
}
