package repository

import (
	"context"
	stderrors "errors"
	"time"

	"gin-quickstart/internal/model"
	"gin-quickstart/internal/pkg/logger"

	"gorm.io/gorm"
)

type pageRepo struct {
	db *gorm.DB
}

func NewPageRepository(db *gorm.DB) PageRepository {
	return &pageRepo{db: db}
}

func (r *pageRepo) Create(ctx context.Context, page *model.Page) error {
	start := time.Now()
	err := r.db.WithContext(ctx).Create(page).Error
	if err != nil {
		logger.Error().Err(err).Str("title", page.Title).Dur("duration", time.Since(start)).Msg("Create 失败")
		return err
	}
	logger.Debug().Uint("page_id", page.ID).Dur("duration", time.Since(start)).Msg("Create 成功")
	return nil
}

func (r *pageRepo) FindByID(ctx context.Context, id uint) (*model.Page, error) {
	start := time.Now()
	var page model.Page
	err := r.db.WithContext(ctx).First(&page, id).Error
	if err != nil {
		logger.Debug().Err(err).Uint("page_id", id).Dur("duration", time.Since(start)).Msg("FindByID 失败")
		if stderrors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, err
	}
	logger.Debug().Uint("page_id", id).Dur("duration", time.Since(start)).Msg("FindByID 成功")
	return &page, nil
}

func (r *pageRepo) FindBySlug(ctx context.Context, slug string) (*model.Page, error) {
	start := time.Now()
	var page model.Page
	err := r.db.WithContext(ctx).
		Where("slug = ? AND status = ?", slug, model.PageStatusPublished).
		First(&page).Error
	if err != nil {
		logger.Debug().Err(err).Str("slug", slug).Dur("duration", time.Since(start)).Msg("FindBySlug 失败")
		if stderrors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, err
	}
	logger.Debug().Uint("page_id", page.ID).Str("slug", slug).Dur("duration", time.Since(start)).Msg("FindBySlug 成功")
	return &page, nil
}

func (r *pageRepo) FindList(ctx context.Context, offset, limit int, status, template string) ([]*model.Page, int64, error) {
	start := time.Now()
	var pages []*model.Page
	var total int64

	query := r.db.WithContext(ctx).Model(&model.Page{})

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if template != "" {
		query = query.Where("template = ?", template)
	}

	if err := query.Count(&total).Error; err != nil {
		logger.Error().Err(err).Dur("duration", time.Since(start)).Msg("FindList 统计失败")
		return nil, 0, err
	}

	if err := query.Order("page_order ASC, created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&pages).Error; err != nil {
		logger.Error().Err(err).Dur("duration", time.Since(start)).Msg("FindList 查询失败")
		return nil, 0, err
	}

	logger.Debug().Int64("total", total).Dur("duration", time.Since(start)).Msg("FindList 成功")
	return pages, total, nil
}

func (r *pageRepo) FindNavPages(ctx context.Context) ([]*model.Page, error) {
	start := time.Now()
	var pages []*model.Page

	err := r.db.WithContext(ctx).
		Select("id, title, slug, page_order").
		Where("status = ? AND show_in_nav = ?", model.PageStatusPublished, true).
		Order("page_order ASC").
		Find(&pages).Error

	if err != nil {
		logger.Error().Err(err).Dur("duration", time.Since(start)).Msg("FindNavPages 失败")
		return nil, err
	}
	logger.Debug().Int("count", len(pages)).Dur("duration", time.Since(start)).Msg("FindNavPages 成功")
	return pages, nil
}

func (r *pageRepo) Update(ctx context.Context, page *model.Page) error {
	start := time.Now()
	err := r.db.WithContext(ctx).Save(page).Error
	if err != nil {
		logger.Error().Err(err).Uint("page_id", page.ID).Dur("duration", time.Since(start)).Msg("Update 失败")
		return err
	}
	logger.Debug().Uint("page_id", page.ID).Dur("duration", time.Since(start)).Msg("Update 成功")
	return nil
}

func (r *pageRepo) Delete(ctx context.Context, id uint) error {
	start := time.Now()
	err := r.db.WithContext(ctx).Delete(&model.Page{}, id).Error
	if err != nil {
		logger.Error().Err(err).Uint("page_id", id).Dur("duration", time.Since(start)).Msg("Delete 失败")
		return err
	}
	logger.Debug().Uint("page_id", id).Dur("duration", time.Since(start)).Msg("Delete 成功")
	return nil
}

func (r *pageRepo) ExistsBySlug(ctx context.Context, slug string) bool {
	var count int64
	r.db.WithContext(ctx).Model(&model.Page{}).Where("slug = ?", slug).Count(&count)
	return count > 0
}
