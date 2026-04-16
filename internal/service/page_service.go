package service

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"gin-quickstart/internal/dto/response"
	"gin-quickstart/internal/model"
	"gin-quickstart/internal/pkg/slug"
)

var (
	ErrPageNotFound        = errors.New("页面未找到")
	ErrPageVersionConflict = errors.New("页面版本冲突，请刷新后重试")
	ErrPageSlugExists      = errors.New("页面 Slug 已存在")
)

// PageService 页面业务逻辑接口
type PageService interface {
	Create(ctx context.Context, title, pageSlug, template, content, summary, coverImage, status string, order int, showInNav bool) (*response.PageResponse, error)
	GetByID(ctx context.Context, id uint) (*response.PageResponse, error)
	GetBySlug(ctx context.Context, slug string) (*response.PageResponse, error)
	GetList(ctx context.Context, page, pageSize int, status, template string) (*response.PageListResponse, error)
	GetNavPages(ctx context.Context) ([]*response.NavPageResponse, error)
	Update(ctx context.Context, id uint, version int, title, pageSlug, template, content, summary, coverImage, status string, order int, showInNav bool) (*response.PageResponse, error)
	Delete(ctx context.Context, id uint) error
}

// pageRepository 页面数据访问接口
type pageRepository interface {
	Create(ctx context.Context, page *model.Page) error
	FindByID(ctx context.Context, id uint) (*model.Page, error)
	FindBySlug(ctx context.Context, slug string) (*model.Page, error)
	FindList(ctx context.Context, offset, limit int, status, template string) ([]*model.Page, int64, error)
	FindNavPages(ctx context.Context) ([]*model.Page, error)
	Update(ctx context.Context, page *model.Page) error
	Delete(ctx context.Context, id uint) error
	ExistsBySlug(ctx context.Context, slug string) bool
}

// pageService 页面服务实现
type pageService struct {
	pageRepo pageRepository
}

// NewPageService 创建页面服务
func NewPageService(pageRepo pageRepository) PageService {
	return &pageService{
		pageRepo: pageRepo,
	}
}

// Create 创建页面
func (s *pageService) Create(ctx context.Context, title, pageSlug, template, content, summary, coverImage, status string, order int, showInNav bool) (*response.PageResponse, error) {
	// 生成或使用自定义 slug
	finalSlug := pageSlug
	if finalSlug == "" {
		finalSlug = slug.Generate(title)
	}

	// 检查 slug 唯一性
	if s.pageRepo.ExistsBySlug(ctx, finalSlug) {
		finalSlug = slug.GenerateWithTimestamp(title)
	}

	// 默认模板
	if template == "" {
		template = model.TemplateDefault
	}

	// 默认状态
	if status == "" {
		status = model.PageStatusDraft
	}

	page := &model.Page{
		Title:      title,
		Slug:       finalSlug,
		Template:   template,
		Content:    content,
		Summary:    summary,
		CoverImage: coverImage,
		Status:     status,
		Order:      order,
		ShowInNav:  showInNav,
	}

	if err := s.pageRepo.Create(ctx, page); err != nil {
		return nil, err
	}

	return toPageResponse(page), nil
}

// GetByID 根据 ID 获取页面
func (s *pageService) GetByID(ctx context.Context, id uint) (*response.PageResponse, error) {
	page, err := s.pageRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPageNotFound
		}
		return nil, err
	}

	return toPageResponse(page), nil
}

// GetBySlug 根据 Slug 获取页面（仅已发布）
func (s *pageService) GetBySlug(ctx context.Context, slug string) (*response.PageResponse, error) {
	page, err := s.pageRepo.FindBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPageNotFound
		}
		return nil, err
	}

	return toPageResponse(page), nil
}

// GetList 获取页面列表
func (s *pageService) GetList(ctx context.Context, page, pageSize int, status, template string) (*response.PageListResponse, error) {
	offset := (page - 1) * pageSize

	pages, total, err := s.pageRepo.FindList(ctx, offset, pageSize, status, template)
	if err != nil {
		return nil, err
	}

	items := make([]*response.PageListItem, len(pages))
	for i, p := range pages {
		items[i] = toPageListItem(p)
	}

	return &response.PageListResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}, nil
}

// GetNavPages 获取导航页面列表
func (s *pageService) GetNavPages(ctx context.Context) ([]*response.NavPageResponse, error) {
	pages, err := s.pageRepo.FindNavPages(ctx)
	if err != nil {
		return nil, err
	}

	items := make([]*response.NavPageResponse, len(pages))
	for i, p := range pages {
		items[i] = &response.NavPageResponse{
			Slug:  p.Slug,
			Title: p.Title,
			Order: p.Order,
		}
	}

	return items, nil
}

// Update 更新页面
func (s *pageService) Update(ctx context.Context, id uint, version int, title, pageSlug, template, content, summary, coverImage, status string, order int, showInNav bool) (*response.PageResponse, error) {
	page, err := s.pageRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPageNotFound
		}
		return nil, err
	}

	// 乐观锁检查
	if page.Version != version {
		return nil, ErrPageVersionConflict
	}

	// 更新字段
	if title != "" {
		page.Title = title
	}
	if pageSlug != "" {
		newSlug := slug.Generate(pageSlug)
		if newSlug != page.Slug {
			// 检查新 slug 是否已被其他页面使用
			existing, err := s.pageRepo.FindBySlug(ctx, newSlug)
			if err == nil && existing != nil && existing.ID != page.ID {
				return nil, ErrPageSlugExists
			}
			page.Slug = newSlug
		}
	}
	if template != "" {
		page.Template = template
	}
	if content != "" {
		page.Content = content
	}
	if summary != "" {
		page.Summary = summary
	}
	if coverImage != "" {
		page.CoverImage = coverImage
	}
	if status != "" {
		page.Status = status
	}
	page.Order = order
	page.ShowInNav = showInNav
	page.Version++

	if err := s.pageRepo.Update(ctx, page); err != nil {
		return nil, err
	}

	return toPageResponse(page), nil
}

// Delete 删除页面
func (s *pageService) Delete(ctx context.Context, id uint) error {
	_, err := s.pageRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrPageNotFound
		}
		return err
	}

	return s.pageRepo.Delete(ctx, id)
}

// toPageResponse 转换为页面响应
func toPageResponse(page *model.Page) *response.PageResponse {
	return &response.PageResponse{
		ID:         page.ID,
		Title:      page.Title,
		Slug:       page.Slug,
		Template:   page.Template,
		Content:    page.Content,
		Summary:    page.Summary,
		CoverImage: page.CoverImage,
		Status:     page.Status,
		Order:      page.Order,
		ShowInNav:  page.ShowInNav,
		Version:    page.Version,
		CreatedAt:  page.CreatedAt,
		UpdatedAt:  page.UpdatedAt,
	}
}

// toPageListItem 转换为页面列表项
func toPageListItem(page *model.Page) *response.PageListItem {
	return &response.PageListItem{
		ID:         page.ID,
		Title:      page.Title,
		Slug:       page.Slug,
		Template:   page.Template,
		Summary:    page.Summary,
		CoverImage: page.CoverImage,
		Status:     page.Status,
		Order:      page.Order,
		ShowInNav:  page.ShowInNav,
		CreatedAt:  page.CreatedAt,
		UpdatedAt:  page.UpdatedAt,
	}
}
