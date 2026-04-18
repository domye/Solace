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
	}

	category := &model.Category{
		Name:        name,
		Slug:        categorySlug,
		Description: description,
		ParentID:    parentID,
		SortOrder:   sortOrder,
	}

	if err := s.categoryRepo.Create(ctx, category); err != nil {
		return nil, err
	}

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
	category, err := s.categoryRepo.FindByID(ctx, id)
	if err != nil {
		if stderrors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.NewNotFound("分类未找到")
		}
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
		return nil, err
	}

	articleCount := s.categoryRepo.CountArticles(ctx, id)
	return toCategoryResponse(category, articleCount), nil
}

func (s *categoryService) Delete(ctx context.Context, id uint) error {
	// 检查是否存在文章
	if count := s.categoryRepo.CountArticles(ctx, id); count > 0 {
		return ErrCategoryHasArticles
	}

	return s.categoryRepo.Delete(ctx, id)
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
