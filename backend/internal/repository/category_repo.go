package repository

import (
	"context"
	stderrors "errors"
	"time"

	"gin-quickstart/internal/model"
	"gin-quickstart/internal/pkg/logger"

	"gorm.io/gorm"
)

type categoryRepo struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &categoryRepo{db: db}
}

func (r *categoryRepo) FindByID(ctx context.Context, id uint) (*model.Category, error) {
	start := time.Now()
	var category model.Category
	err := r.db.WithContext(ctx).First(&category, id).Error
	if err != nil {
		logger.Debug().Err(err).Uint("category_id", id).Dur("duration", time.Since(start)).Msg("FindByID 失败")
		if stderrors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, err
	}
	logger.Debug().Uint("category_id", id).Dur("duration", time.Since(start)).Msg("FindByID 成功")
	return &category, nil
}

func (r *categoryRepo) FindAllWithCount(ctx context.Context) ([]*model.CategoryWithCount, error) {
	start := time.Now()
	var results []*model.CategoryWithCount

	err := r.db.WithContext(ctx).
		Model(&model.Category{}).
		Select("categories.id, categories.name, categories.slug, categories.description, categories.parent_id, categories.sort_order, COUNT(articles.id) as article_count").
		Joins("LEFT JOIN articles ON articles.category_id = categories.id AND articles.deleted_at IS NULL AND articles.status = ?", model.StatusPublished).
		Group("categories.id").
		Order("categories.sort_order ASC, categories.name ASC").
		Scan(&results).Error

	if err != nil {
		logger.Error().Err(err).Dur("duration", time.Since(start)).Msg("FindAllWithCount 失败")
		return nil, err
	}
	logger.Debug().Int("count", len(results)).Dur("duration", time.Since(start)).Msg("FindAllWithCount 成功")
	return results, nil
}

func (r *categoryRepo) Create(ctx context.Context, category *model.Category) error {
	start := time.Now()
	err := r.db.WithContext(ctx).Create(category).Error
	if err != nil {
		logger.Error().Err(err).Str("name", category.Name).Dur("duration", time.Since(start)).Msg("Create 失败")
		return err
	}
	logger.Debug().Uint("category_id", category.ID).Dur("duration", time.Since(start)).Msg("Create 成功")
	return nil
}

func (r *categoryRepo) Update(ctx context.Context, category *model.Category) error {
	start := time.Now()
	err := r.db.WithContext(ctx).Save(category).Error
	if err != nil {
		logger.Error().Err(err).Uint("category_id", category.ID).Dur("duration", time.Since(start)).Msg("Update 失败")
		return err
	}
	logger.Debug().Uint("category_id", category.ID).Dur("duration", time.Since(start)).Msg("Update 成功")
	return nil
}

func (r *categoryRepo) Delete(ctx context.Context, id uint) error {
	start := time.Now()
	err := r.db.WithContext(ctx).Delete(&model.Category{}, id).Error
	if err != nil {
		logger.Error().Err(err).Uint("category_id", id).Dur("duration", time.Since(start)).Msg("Delete 失败")
		return err
	}
	logger.Debug().Uint("category_id", id).Dur("duration", time.Since(start)).Msg("Delete 成功")
	return nil
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
