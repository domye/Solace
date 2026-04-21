package service

import (
	"context"
	stderrors "errors"

	"gorm.io/gorm"

	"gin-quickstart/internal/dto/response"
	"gin-quickstart/internal/model"
	"gin-quickstart/internal/pkg/errors"
	"gin-quickstart/internal/pkg/logger"
	"gin-quickstart/internal/pkg/slug"
)

// CategoryService 分类业务逻辑接口
type CategoryService interface {
	Create(ctx context.Context, name, customSlug, description string, parentID *uint, sortOrder int) (*response.CategoryResponse, error)
	GetList(ctx context.Context) (*response.CategoryListResponse, error)
	Update(ctx context.Context, id uint, name, customSlug, description string, parentID *uint, sortOrder int) (*response.CategoryResponse, error)
	Delete(ctx context.Context, id uint) error
}

// categoryService 分类服务实现
type categoryService struct {
	categoryRepo categoryRepository
}

// NewCategoryService 创建分类服务
func NewCategoryService(categoryRepo categoryRepository) CategoryService {
	return &categoryService{categoryRepo: categoryRepo}
}

func (s *categoryService) Create(ctx context.Context, name, customSlug, description string, parentID *uint, sortOrder int) (*response.CategoryResponse, error) {
	log := logger.WithContext(ctx)
	log.Info().Str("name", name).Interface("parent_id", parentID).Msg("创建分类开始")

	// 生成或使用自定义 slug
	categorySlug := customSlug
	if categorySlug == "" {
		// 没有提供 slug，从名称自动生成
		categorySlug = slug.Generate(name)
	} else {
		// 提供了自定义 slug，进行格式化处理
		categorySlug = slug.Generate(categorySlug)
	}

	// 检查 slug 唯一性
	if s.categoryRepo.ExistsBySlug(ctx, categorySlug) {
		categorySlug = slug.GenerateWithTimestamp(name)
		log.Debug().Str("new_slug", categorySlug).Msg("slug 已存在，生成新 slug")
	}

	category := &model.Category{
		Name:        name,
		Slug:        categorySlug,
		Description: description,
		ParentID:    parentID,
		SortOrder:   sortOrder,
	}

	if err := s.categoryRepo.Create(ctx, category); err != nil {
		log.Error().Err(err).Msg("创建分类失败")
		return nil, err
	}

	log.Info().Uint("category_id", category.ID).Str("slug", categorySlug).Msg("分类创建成功")
	return toCategoryResponse(category, 0), nil
}

func (s *categoryService) GetList(ctx context.Context) (*response.CategoryListResponse, error) {
	categories, err := s.categoryRepo.FindAllWithCount(ctx)
	if err != nil {
		return nil, err
	}

	items := make([]*response.CategoryResponse, len(categories))
	for i, c := range categories {
		items[i] = &response.CategoryResponse{
			ID:           c.ID,
			Name:         c.Name,
			Slug:         c.Slug,
			Description:  c.Description,
			ParentID:     c.ParentID,
			SortOrder:    c.SortOrder,
			ArticleCount: c.ArticleCount,
		}
	}

	return &response.CategoryListResponse{Items: items}, nil
}

func (s *categoryService) Update(ctx context.Context, id uint, name, customSlug, description string, parentID *uint, sortOrder int) (*response.CategoryResponse, error) {
	log := logger.WithContext(ctx)
	log.Info().Uint("category_id", id).Msg("更新分类开始")

	category, err := s.categoryRepo.FindByID(ctx, id)
	if err != nil {
		if stderrors.Is(err, gorm.ErrRecordNotFound) {
			log.Warn().Uint("category_id", id).Msg("分类不存在")
			return nil, errors.NewNotFound("分类未找到")
		}
		log.Error().Err(err).Uint("category_id", id).Msg("获取分类失败")
		return nil, err
	}

	if name != "" {
		category.Name = name
	}
	// 更新 slug（仅当提供了新 slug 时）
	if customSlug != "" {
		newSlug := slug.Generate(customSlug)
		if newSlug != category.Slug && s.categoryRepo.ExistsBySlug(ctx, newSlug) {
			newSlug = slug.GenerateWithTimestamp(customSlug)
		}
		category.Slug = newSlug
	}
	if description != "" {
		category.Description = description
	}
	if parentID != nil {
		category.ParentID = parentID
	}
	if sortOrder >= 0 {
		category.SortOrder = sortOrder
	}

	if err := s.categoryRepo.Update(ctx, category); err != nil {
		log.Error().Err(err).Uint("category_id", id).Msg("更新分类失败")
		return nil, err
	}

	log.Info().Uint("category_id", id).Msg("分类更新成功")
	articleCount := s.categoryRepo.CountArticles(ctx, id)
	return toCategoryResponse(category, articleCount), nil
}

func (s *categoryService) Delete(ctx context.Context, id uint) error {
	log := logger.WithContext(ctx)
	log.Info().Uint("category_id", id).Msg("删除分类开始")

	// 检查是否存在文章
	if count := s.categoryRepo.CountArticles(ctx, id); count > 0 {
		log.Warn().Uint("category_id", id).Int("article_count", count).Msg("分类下存在文章，无法删除")
		return ErrCategoryHasArticles
	}

	if err := s.categoryRepo.Delete(ctx, id); err != nil {
		log.Error().Err(err).Uint("category_id", id).Msg("删除分类失败")
		return err
	}

	log.Info().Uint("category_id", id).Msg("分类删除成功")
	return nil
}

func toCategoryResponse(category *model.Category, articleCount int) *response.CategoryResponse {
	return &response.CategoryResponse{
		ID:           category.ID,
		Name:         category.Name,
		Slug:         category.Slug,
		Description:  category.Description,
		ParentID:     category.ParentID,
		SortOrder:    category.SortOrder,
		ArticleCount: articleCount,
		CreatedAt:    category.CreatedAt,
		UpdatedAt:    category.UpdatedAt,
	}
}
