package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"gin-quickstart/internal/dto/request"
	apperrors "gin-quickstart/internal/pkg/errors"
	"gin-quickstart/internal/service"
)

// PageHandler 页面处理器
type PageHandler struct {
	pageService service.PageService
}

// NewPageHandler 创建页面处理器
func NewPageHandler(pageService service.PageService) *PageHandler {
	return &PageHandler{pageService: pageService}
}

// Create 创建页面
// @Summary 创建页面
// @Tags page
// @Accept json
// @Produce json
// @Param request body request.CreatePageRequest true "页面数据"
// @Success 201 {object} Response
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Router /pages [post]
func (h *PageHandler) Create(c *gin.Context) {
	var req request.CreatePageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的请求体", nil))
		return
	}

	page, err := h.pageService.Create(
		c.Request.Context(),
		req.Title,
		req.Slug,
		req.Template,
		req.Content,
		req.Summary,
		req.CoverImage,
		req.Status,
		req.Order,
		req.ShowInNav,
	)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithCreated(c, page)
}

// GetByID 根据 ID 获取页面
// @Summary 根据 ID 获取页面
// @Tags page
// @Produce json
// @Param id path int true "页面ID"
// @Success 200 {object} Response
// @Failure 404 {object} Response
// @Router /pages/{id} [get]
func (h *PageHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的页面ID", nil))
		return
	}

	page, err := h.pageService.GetByID(c.Request.Context(), uint(id))
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, page)
}

// GetBySlug 根据 Slug 获取页面（公开访问）
// @Summary 根据 Slug 获取页面
// @Tags page
// @Produce json
// @Param slug path string true "页面 Slug"
// @Success 200 {object} Response
// @Failure 404 {object} Response
// @Router /pages/slug/{slug} [get]
func (h *PageHandler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		RespondWithError(c, apperrors.NewBadRequest("页面 Slug 不能为空", nil))
		return
	}

	page, err := h.pageService.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, page)
}

// GetList 获取页面列表（管理用）
// @Summary 获取页面列表
// @Tags page
// @Produce json
// @Param page query int false "页码" default(1)
// @Param pageSize query int false "每页数量" default(10)
// @Param status query string false "按状态筛选"
// @Param template query string false "按模板筛选"
// @Success 200 {object} Response
// @Router /pages [get]
func (h *PageHandler) GetList(c *gin.Context) {
	var query request.PageListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的查询参数", nil))
		return
	}

	if query.Page == 0 {
		query.Page = 1
	}
	if query.PageSize == 0 {
		query.PageSize = 10
	}

	resp, err := h.pageService.GetList(
		c.Request.Context(),
		query.Page,
		query.PageSize,
		query.Status,
		query.Template,
	)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithPaged(c, resp.Items, resp.Page, resp.PageSize, resp.Total)
}

// GetNavPages 获取导航页面列表（公开访问）
// @Summary 获取导航页面列表
// @Tags page
// @Produce json
// @Success 200 {object} Response
// @Router /pages/nav [get]
func (h *PageHandler) GetNavPages(c *gin.Context) {
	pages, err := h.pageService.GetNavPages(c.Request.Context())
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, pages)
}

// Update 更新页面
// @Summary 更新页面
// @Tags page
// @Accept json
// @Produce json
// @Param id path int true "页面ID"
// @Param request body request.UpdatePageRequest true "页面数据"
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Router /pages/{id} [put]
func (h *PageHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的页面ID", nil))
		return
	}

	var req request.UpdatePageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的请求体", nil))
		return
	}

	page, err := h.pageService.Update(
		c.Request.Context(),
		uint(id),
		req.Version,
		req.Title,
		req.Slug,
		req.Template,
		req.Content,
		req.Summary,
		req.CoverImage,
		req.Status,
		req.Order,
		req.ShowInNav,
	)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, page)
}

// Delete 删除页面
// @Summary 删除页面
// @Tags page
// @Param id path int true "页面ID"
// @Success 204 "无内容"
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Router /pages/{id} [delete]
func (h *PageHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的页面ID", nil))
		return
	}

	if err := h.pageService.Delete(c.Request.Context(), uint(id)); err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithNoContent(c)
}
