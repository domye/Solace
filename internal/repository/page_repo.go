package repository

import (
	"context"

	"gin-quickstart/internal/model"
	"gorm.io/gorm"
)

// PageRepository 页面数据访问接口
type PageRepository interface {
	Create(ctx context.Context, page *model.Page) error
	FindByID(ctx context.Context, id uint) (*model.Page, error)
	FindBySlug(ctx context.Context, slug string) (*model.Page, error)
	FindList(ctx context.Context, offset, limit int, status, template string) ([]*model.Page, int64, error)
	FindNavPages(ctx context.Context) ([]*model.Page, error)
	FindAllPublished(ctx context.Context) ([]*model.Page, error)
	Update(ctx context.Context, page *model.Page) error
	Delete(ctx context.Context, id uint) error
	ExistsBySlug(ctx context.Context, slug string) bool
}

// pageRepo 页面仓储实现
type pageRepo struct {
	db *gorm.DB
}

// NewPageRepository 创建页面仓储
func NewPageRepository(db *gorm.DB) PageRepository {
	return &pageRepo{db: db}
}

// Create 创建页面
func (r *pageRepo) Create(ctx context.Context, page *model.Page) error {
	return r.db.WithContext(ctx).Create(page).Error
}

// FindByID 根据 ID 查询页面
func (r *pageRepo) FindByID(ctx context.Context, id uint) (*model.Page, error) {
	var page model.Page
	err := r.db.WithContext(ctx).First(&page, id).Error
	if err != nil {
		return nil, err
	}
	return &page, nil
}

// FindBySlug 根据 Slug 查询页面（仅已发布）
func (r *pageRepo) FindBySlug(ctx context.Context, slug string) (*model.Page, error) {
	var page model.Page
	err := r.db.WithContext(ctx).
		Where("slug = ? AND status = ?", slug, model.PageStatusPublished).
		First(&page).Error
	if err != nil {
		return nil, err
	}
	return &page, nil
}

// FindList 查询页面列表（管理用，支持筛选）
func (r *pageRepo) FindList(ctx context.Context, offset, limit int, status, template string) ([]*model.Page, int64, error) {
	var pages []*model.Page
	var total int64

	query := r.db.WithContext(ctx).Model(&model.Page{})

	// 应用筛选条件
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if template != "" {
		query = query.Where("template = ?", template)
	}

	// 统计总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 获取分页结果
	if err := query.Order("page_order ASC, created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&pages).Error; err != nil {
		return nil, 0, err
	}

	return pages, total, nil
}

// FindNavPages 查询导航页面列表（已发布且显示在导航中）
func (r *pageRepo) FindNavPages(ctx context.Context) ([]*model.Page, error) {
	var pages []*model.Page

	err := r.db.WithContext(ctx).
		Select("id, title, slug, page_order").
		Where("status = ? AND show_in_nav = ?", model.PageStatusPublished, true).
		Order("page_order ASC").
		Find(&pages).Error

	if err != nil {
		return nil, err
	}
	return pages, nil
}

// FindAllPublished 查询所有已发布页面
func (r *pageRepo) FindAllPublished(ctx context.Context) ([]*model.Page, error) {
	var pages []*model.Page

	err := r.db.WithContext(ctx).
		Where("status = ?", model.PageStatusPublished).
		Order("page_order ASC, created_at DESC").
		Find(&pages).Error

	if err != nil {
		return nil, err
	}
	return pages, nil
}

// Update 更新页面
func (r *pageRepo) Update(ctx context.Context, page *model.Page) error {
	return r.db.WithContext(ctx).Save(page).Error
}

// Delete 删除页面
func (r *pageRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&model.Page{}, id).Error
}

// ExistsBySlug 检查 Slug 是否已存在
func (r *pageRepo) ExistsBySlug(ctx context.Context, slug string) bool {
	var count int64
	r.db.WithContext(ctx).Model(&model.Page{}).Where("slug = ?", slug).Count(&count)
	return count > 0
}
