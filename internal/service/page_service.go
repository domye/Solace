package service

import (
	"context"
	stderrors "errors"

	"gorm.io/gorm"

	"gin-quickstart/internal/dto/response"
	"gin-quickstart/internal/model"
	"gin-quickstart/internal/pkg/errors"
	"gin-quickstart/internal/pkg/slug"
)

var (
	ErrPageVersionConflict = errors.NewBadRequest("页面版本冲突，请刷新后重试", nil)
	ErrPageSlugExists      = errors.NewBadRequest("页面 Slug 已存在", nil)
)

type PageService interface {
	Create(ctx context.Context, title, pageSlug, template, content, summary, coverImage, status string, order int, showInNav bool) (*response.PageResponse, error)
	GetByID(ctx context.Context, id uint) (*response.PageResponse, error)
	GetBySlug(ctx context.Context, slug string) (*response.PageResponse, error)
	GetList(ctx context.Context, page, pageSize int, status, template string) (*response.PageListResponse, error)
	GetNavPages(ctx context.Context) ([]*response.NavPageResponse, error)
	Update(ctx context.Context, id uint, version int, title, pageSlug, template, content, summary, coverImage, status string, order int, showInNav bool) (*response.PageResponse, error)
	Delete(ctx context.Context, id uint) error
}

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

type pageService struct {
	pageRepo pageRepository
}

func NewPageService(pageRepo pageRepository) PageService {
	return &pageService{
		pageRepo: pageRepo,
	}
}

func (s *pageService) Create(ctx context.Context, title, pageSlug, template, content, summary, coverImage, status string, order int, showInNav bool) (*response.PageResponse, error) {
	finalSlug := pageSlug
	if finalSlug == "" {
		finalSlug = slug.Generate(title)
	}

	if s.pageRepo.ExistsBySlug(ctx, finalSlug) {
		finalSlug = slug.GenerateWithTimestamp(title)
	}

	if template == "" {
		template = model.TemplateDefault
	}

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

func (s *pageService) GetByID(ctx context.Context, id uint) (*response.PageResponse, error) {
	page, err := s.pageRepo.FindByID(ctx, id)
	if err != nil {
		if stderrors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.NewNotFound("页面未找到")
		}
		return nil, err
	}

	return toPageResponse(page), nil
}

func (s *pageService) GetBySlug(ctx context.Context, slug string) (*response.PageResponse, error) {
	page, err := s.pageRepo.FindBySlug(ctx, slug)
	if err != nil {
		if stderrors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.NewNotFound("页面未找到")
		}
		return nil, err
	}

	return toPageResponse(page), nil
}

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

func (s *pageService) Update(ctx context.Context, id uint, version int, title, pageSlug, template, content, summary, coverImage, status string, order int, showInNav bool) (*response.PageResponse, error) {
	page, err := s.pageRepo.FindByID(ctx, id)
	if err != nil {
		if stderrors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.NewNotFound("页面未找到")
		}
		return nil, err
	}

	if page.Version != version {
		return nil, ErrPageVersionConflict
	}

	if title != "" {
		page.Title = title
	}
	if pageSlug != "" {
		newSlug := slug.Generate(pageSlug)
		if newSlug != page.Slug {
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

func (s *pageService) Delete(ctx context.Context, id uint) error {
	_, err := s.pageRepo.FindByID(ctx, id)
	if err != nil {
		if stderrors.Is(err, gorm.ErrRecordNotFound) {
			return errors.NewNotFound("页面未找到")
		}
		return err
	}

	return s.pageRepo.Delete(ctx, id)
}

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
