package repository

import (
	"context"

	"gin-quickstart/internal/model"
	"gorm.io/gorm"
)

// categoryRepo 分类仓储实现
type categoryRepo struct {
	db *gorm.DB
}

// NewCategoryRepository 创建分类仓储
func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &categoryRepo{db: db}
}

func (r *categoryRepo) FindByID(ctx context.Context, id uint) (*model.Category, error) {
	var category model.Category
	err := r.db.WithContext(ctx).First(&category, id).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepo) FindAll(ctx context.Context) ([]*model.Category, error) {
	var categories []*model.Category
	err := r.db.WithContext(ctx).
		Order("sort_order ASC, name ASC").
		Find(&categories).Error
	if err != nil {
		return nil, err
	}
	return categories, nil
}

func (r *categoryRepo) FindAllWithCount(ctx context.Context) ([]*model.CategoryWithCount, error) {
	var results []*model.CategoryWithCount

	err := r.db.WithContext(ctx).
		Model(&model.Category{}).
		Select("categories.id, categories.name, categories.slug, categories.description, categories.parent_id, categories.sort_order, COUNT(articles.id) as article_count").
		Joins("LEFT JOIN articles ON articles.category_id = categories.id AND articles.deleted_at IS NULL AND articles.status = ?", model.StatusPublished).
		Group("categories.id").
		Order("categories.sort_order ASC, categories.name ASC").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}
	return results, nil
}

func (r *categoryRepo) FindChildren(ctx context.Context, parentID uint) ([]*model.Category, error) {
	var categories []*model.Category
	err := r.db.WithContext(ctx).
		Where("parent_id = ?", parentID).
		Order("sort_order ASC, name ASC").
		Find(&categories).Error
	if err != nil {
		return nil, err
	}
	return categories, nil
}

func (r *categoryRepo) Create(ctx context.Context, category *model.Category) error {
	return r.db.WithContext(ctx).Create(category).Error
}

func (r *categoryRepo) Update(ctx context.Context, category *model.Category) error {
	return r.db.WithContext(ctx).Save(category).Error
}

func (r *categoryRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&model.Category{}, id).Error
}

func (r *categoryRepo) ExistsBySlug(ctx context.Context, slug string) bool {
	var count int64
	r.db.WithContext(ctx).Model(&model.Category{}).Where("slug = ?", slug).Count(&count)
	return count > 0
}

func (r *categoryRepo) CountArticles(ctx context.Context, categoryID uint) int {
	var count int64
	r.db.WithContext(ctx).
		Model(&model.Article{}).
		Where("category_id = ? AND status = ? AND deleted_at IS NULL", categoryID, model.StatusPublished).
		Count(&count)
	return int(count)
}
