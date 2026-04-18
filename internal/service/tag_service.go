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

// TagService 标签业务逻辑接口
type TagService interface {
	Create(ctx context.Context, name, customSlug string) (*response.TagResponse, error)
	GetList(ctx context.Context) (*response.TagListResponse, error)
	Update(ctx context.Context, id uint, name, customSlug string) (*response.TagResponse, error)
	Delete(ctx context.Context, id uint) error
}

// tagService 标签服务实现
type tagService struct {
	tagRepo tagRepository
}

// NewTagService 创建标签服务
func NewTagService(tagRepo tagRepository) TagService {
	return &tagService{tagRepo: tagRepo}
}

func (s *tagService) Create(ctx context.Context, name, customSlug string) (*response.TagResponse, error) {
	if s.tagRepo.ExistsByName(ctx, name) {
		return nil, errors.NewBadRequest("标签已存在", nil)
	}

	tagSlug := customSlug
	if tagSlug == "" {
		tagSlug = slug.Generate(name)
	} else {
		tagSlug = slug.Generate(tagSlug)
	}

	if s.tagRepo.ExistsBySlug(ctx, tagSlug) {
		tagSlug = slug.GenerateWithTimestamp(name)
	}

	tag := &model.Tag{
		Name: name,
		Slug: tagSlug,
	}

	if err := s.tagRepo.Create(ctx, tag); err != nil {
		return nil, err
	}

	return toTagResponse(tag, 0), nil
}

func (s *tagService) GetList(ctx context.Context) (*response.TagListResponse, error) {
	tags, err := s.tagRepo.FindAllWithCount(ctx)
	if err != nil {
		return nil, err
	}

	items := make([]*response.TagResponse, len(tags))
	for i, t := range tags {
		items[i] = &response.TagResponse{
			ID:           t.ID,
			Name:         t.Name,
			Slug:         t.Slug,
			ArticleCount: t.ArticleCount,
		}
	}

	return &response.TagListResponse{Items: items}, nil
}

func (s *tagService) Update(ctx context.Context, id uint, name, customSlug string) (*response.TagResponse, error) {
	tag, err := s.tagRepo.FindByID(ctx, id)
	if err != nil {
		if stderrors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.NewNotFound("标签未找到")
		}
		return nil, err
	}

	if name != "" {
		if name != tag.Name && s.tagRepo.ExistsByName(ctx, name) {
			return nil, errors.NewBadRequest("标签已存在", nil)
		}
		tag.Name = name
	}
	// 更新 slug（仅当提供了新 slug 时）
	if customSlug != "" {
		newSlug := slug.Generate(customSlug)
		if newSlug != tag.Slug && s.tagRepo.ExistsBySlug(ctx, newSlug) {
			newSlug = slug.GenerateWithTimestamp(customSlug)
		}
		tag.Slug = newSlug
	}

	if err := s.tagRepo.Update(ctx, tag); err != nil {
		return nil, err
	}

	articleCount := s.tagRepo.CountArticles(ctx, id)
	return toTagResponse(tag, articleCount), nil
}

func (s *tagService) Delete(ctx context.Context, id uint) error {
	return s.tagRepo.Delete(ctx, id)
}

func toTagResponse(tag *model.Tag, articleCount int) *response.TagResponse {
	return &response.TagResponse{
		ID:           tag.ID,
		Name:         tag.Name,
		Slug:         tag.Slug,
		ArticleCount: articleCount,
		CreatedAt:    tag.CreatedAt,
		UpdatedAt:    tag.UpdatedAt,
	}
}
