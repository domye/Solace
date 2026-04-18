package handler

import (
	"gin-quickstart/internal/pkg/text"
	"strconv"

	"github.com/gin-gonic/gin"

	"gin-quickstart/internal/dto/request"
	apperrors "gin-quickstart/internal/pkg/errors"
	"gin-quickstart/internal/service"
)

// ArticleHandler 文章处理器
type ArticleHandler struct {
	articleService service.ArticleService
}

// NewArticleHandler 创建文章处理器
func NewArticleHandler(articleService service.ArticleService) *ArticleHandler {
	return &ArticleHandler{articleService: articleService}
}

// Create 创建文章
// @Summary 创建文章
// @Tags article
// @Accept json
// @Produce json
// @Param request body request.CreateArticleRequest true "文章数据"
// @Success 201 {object} Response
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Router /articles [post]
func (h *ArticleHandler) Create(c *gin.Context) {
	var req request.CreateArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的请求体", nil))
		return
	}

	// 如果没有提供摘要，则从内容生成
	summary := req.Summary
	if summary == "" {
		summary = text.GenerateSummary(req.Content, 100)
	}

	// 默认状态为草稿
	status := req.Status
	if status == "" {
		status = "draft"
	}

	article, err := h.articleService.Create(
		c.Request.Context(),
		req.Title,
		req.Slug,
		req.Content,
		summary,
		req.CoverImage,
		req.CategoryID,
		req.TagIDs,
		status,
	)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithCreated(c, article)
}

// GetByID 根据 ID 获取文章
// @Summary 根据 ID 获取文章
// @Tags article
// @Produce json
// @Param id path int true "文章ID"
// @Success 200 {object} Response
// @Failure 404 {object} Response
// @Router /articles/{id} [get]
func (h *ArticleHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的文章ID", nil))
		return
	}

	article, err := h.articleService.GetByID(c.Request.Context(), uint(id))
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, article)
}

// GetBySlug 根据 Slug 获取文章
// @Summary 根据 Slug 获取文章
// @Tags article
// @Produce json
// @Param slug path string true "文章 Slug"
// @Success 200 {object} Response
// @Failure 404 {object} Response
// @Router /articles/slug/{slug} [get]
func (h *ArticleHandler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		RespondWithError(c, apperrors.NewBadRequest("文章 Slug 不能为空", nil))
		return
	}

	article, err := h.articleService.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, article)
}

// GetList 获取文章列表
// @Summary 获取文章列表
// @Tags article
// @Produce json
// @Param page query int false "页码" default(1)
// @Param pageSize query int false "每页数量" default(10)
// @Param status query string false "按状态筛选"
// @Param category query string false "按分类slug筛选"
// @Param tag query string false "按标签slug筛选"
// @Success 200 {object} Response
// @Router /articles [get]
func (h *ArticleHandler) GetList(c *gin.Context) {
	var query request.ArticleListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的查询参数", nil))
		return
	}

	if query.Page == 0 {
		query.Page = 1
	}
	if query.PageSize == 0 {
		query.PageSize = 8
	}

	resp, err := h.articleService.GetList(
		c.Request.Context(),
		query.Page,
		query.PageSize,
		query.Status,
		query.Category,
		query.Tag,
	)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithPaged(c, resp.Items, resp.Page, resp.PageSize, resp.Total)
}

// GetArchive 获取归档列表
// @Summary 获取归档列表
// @Tags article
// @Produce json
// @Success 200 {object} Response
// @Router /articles/archive [get]
func (h *ArticleHandler) GetArchive(c *gin.Context) {
	resp, err := h.articleService.GetArchive(c.Request.Context())
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, resp.Groups)
}

// Search 搜索文章
// @Summary 搜索文章
// @Tags article
// @Produce json
// @Param q query string true "搜索关键词"
// @Param page query int false "页码" default(1)
// @Param pageSize query int false "每页数量" default(10)
// @Success 200 {object} Response
// @Router /articles/search [get]
func (h *ArticleHandler) Search(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		RespondWithError(c, apperrors.NewBadRequest("搜索关键词不能为空", nil))
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	resp, err := h.articleService.Search(c.Request.Context(), query, page, pageSize)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithPaged(c, resp.Items, resp.Page, resp.PageSize, resp.Total)
}

// Update 更新文章
// @Summary 更新文章
// @Tags article
// @Accept json
// @Produce json
// @Param id path int true "文章ID"
// @Param request body request.UpdateArticleRequest true "文章数据"
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Router /articles/{id} [put]
func (h *ArticleHandler) Update(c *gin.Context) {
	idStr := c.Param("id")

	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的文章ID", nil))
		return
	}

	var req request.UpdateArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的请求体", nil))
		return
	}

	// 如果没有提供摘要，则从内容生成
	summary := req.Summary
	if summary == "" {
		summary = text.GenerateSummary(req.Content, 100)
	}

	article, err := h.articleService.Update(
		c.Request.Context(),
		uint(id),
		req.Version,
		req.Title,
		req.Slug,
		req.Content,
		summary,
		req.CoverImage,
		req.CategoryID,
		req.TagIDs,
		req.Status,
	)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, article)
}

// Delete 删除文章
// @Summary 删除文章
// @Tags article
// @Param id path int true "文章ID"
// @Success 204 "无内容"
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Router /articles/{id} [delete]
func (h *ArticleHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")

	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的文章ID", nil))
		return
	}

	if err := h.articleService.Delete(c.Request.Context(), uint(id)); err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithNoContent(c)
}

// GetRandom 获取随机文章
// @Summary 获取随机文章
// @Tags article
// @Produce json
// @Param limit query int false "数量" default(5)
// @Success 200 {object} Response
// @Router /articles/random [get]
func (h *ArticleHandler) GetRandom(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "5"))
	if limit < 1 || limit > 20 {
		limit = 5
	}

	articles, err := h.articleService.GetRandom(c.Request.Context(), limit)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, articles)
}

// GetRecent 获取最近文章
// @Summary 获取最近文章
// @Tags article
// @Produce json
// @Param limit query int false "数量" default(5)
// @Success 200 {object} Response
// @Router /articles/recent [get]
func (h *ArticleHandler) GetRecent(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "5"))
	if limit < 1 || limit > 20 {
		limit = 5
	}

	articles, err := h.articleService.GetRecent(c.Request.Context(), limit)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, articles)
}
