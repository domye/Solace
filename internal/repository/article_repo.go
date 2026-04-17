package repository

import (
	"context"

	"gin-quickstart/internal/model"
	"gorm.io/gorm"
)

// articleRepo 文章仓储实现
type articleRepo struct {
	db *gorm.DB
}

// NewArticleRepository 创建文章仓储
func NewArticleRepository(db *gorm.DB) ArticleRepository {
	return &articleRepo{db: db}
}

func (r *articleRepo) FindByID(ctx context.Context, id uint) (*model.Article, error) {
	var article model.Article
	err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Tags").
		First(&article, id).Error
	if err != nil {
		return nil, err
	}
	return &article, nil
}

func (r *articleRepo) FindBySlug(ctx context.Context, slug string) (*model.Article, error) {
	var article model.Article
	err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Tags").
		Where("slug = ?", slug).
		First(&article).Error
	if err != nil {
		return nil, err
	}
	return &article, nil
}

func (r *articleRepo) FindAll(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*model.Article, int64, error) {
	var articles []*model.Article
	var total int64

	query := r.db.WithContext(ctx).Model(&model.Article{}).Preload("Category").Preload("Tags")

	// 应用筛选条件
	if status, ok := filters["status"]; ok {
		query = query.Where("status = ?", status)
	}

	// 统计总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 获取分页结果
	if err := query.Order("is_top DESC, created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&articles).Error; err != nil {
		return nil, 0, err
	}

	return articles, total, nil
}

func (r *articleRepo) FindPublished(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*model.Article, int64, error) {
	var articles []*model.Article
	var total int64

	query := r.db.WithContext(ctx).
		Model(&model.Article{}).
		Preload("Category").
		Preload("Tags").
		Where("status = ?", model.StatusPublished)

	// 统计总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 获取分页结果
	if err := query.Order("is_top DESC, published_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&articles).Error; err != nil {
		return nil, 0, err
	}

	return articles, total, nil
}

func (r *articleRepo) FindByCategory(ctx context.Context, categorySlug string, limit, offset int) ([]*model.Article, int64, error) {
	var articles []*model.Article
	var total int64

	// 先获取分类ID
	var category model.Category
	if err := r.db.WithContext(ctx).Where("slug = ?", categorySlug).First(&category).Error; err != nil {
		return nil, 0, err
	}

	query := r.db.WithContext(ctx).
		Model(&model.Article{}).
		Preload("Category").
		Preload("Tags").
		Where("status = ? AND category_id = ?", model.StatusPublished, category.ID)

	// 统计总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 获取分页结果
	if err := query.Order("is_top DESC, published_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&articles).Error; err != nil {
		return nil, 0, err
	}

	return articles, total, nil
}

func (r *articleRepo) FindByTag(ctx context.Context, tagSlug string, limit, offset int) ([]*model.Article, int64, error) {
	var articles []*model.Article
	var total int64

	// 先获取标签ID
	var tag model.Tag
	if err := r.db.WithContext(ctx).Where("slug = ?", tagSlug).First(&tag).Error; err != nil {
		return nil, 0, err
	}

	query := r.db.WithContext(ctx).
		Model(&model.Article{}).
		Preload("Category").
		Preload("Tags").
		Joins("JOIN article_tags ON article_tags.article_id = articles.id").
		Where("articles.status = ? AND article_tags.tag_id = ?", model.StatusPublished, tag.ID)

	// 统计总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 获取分页结果
	if err := query.Order("articles.is_top DESC, articles.published_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&articles).Error; err != nil {
		return nil, 0, err
	}

	return articles, total, nil
}

func (r *articleRepo) FindByIDWithNav(ctx context.Context, id uint) (*model.Article, *model.Article, *model.Article, error) {
	article, err := r.FindByID(ctx, id)
	if err != nil {
		return nil, nil, nil, err
	}

	var prev, next *model.Article

	// 获取上一篇（更早发布的）
	r.db.WithContext(ctx).
		Select("id, title, slug").
		Where("status = ? AND published_at < ? AND id != ?", model.StatusPublished, article.PublishedAt, id).
		Order("published_at DESC").
		First(&prev)

	// 获取下一篇（更晚发布的）
	r.db.WithContext(ctx).
		Select("id, title, slug").
		Where("status = ? AND published_at > ? AND id != ?", model.StatusPublished, article.PublishedAt, id).
		Order("published_at ASC").
		First(&next)

	return article, prev, next, nil
}

func (r *articleRepo) FindBySlugWithNav(ctx context.Context, slug string) (*model.Article, *model.Article, *model.Article, error) {
	article, err := r.FindBySlug(ctx, slug)
	if err != nil {
		return nil, nil, nil, err
	}

	var prev, next *model.Article

	// 获取上一篇（更早发布的）
	r.db.WithContext(ctx).
		Select("id, title, slug").
		Where("status = ? AND published_at < ? AND id != ?", model.StatusPublished, article.PublishedAt, article.ID).
		Order("published_at DESC").
		First(&prev)

	// 获取下一篇（更晚发布的）
	r.db.WithContext(ctx).
		Select("id, title, slug").
		Where("status = ? AND published_at > ? AND id != ?", model.StatusPublished, article.PublishedAt, article.ID).
		Order("published_at ASC").
		First(&next)

	return article, prev, next, nil
}

func (r *articleRepo) GetArchive(ctx context.Context) ([]*model.Article, error) {
	var articles []*model.Article

	err := r.db.WithContext(ctx).
		Select("id, title, slug, summary, published_at, category_id").
		Preload("Category").
		Preload("Tags").
		Where("status = ?", model.StatusPublished).
		Order("published_at DESC").
		Find(&articles).Error

	if err != nil {
		return nil, err
	}
	return articles, nil
}

func (r *articleRepo) Search(ctx context.Context, query string, limit, offset int) ([]*model.Article, int64, error) {
	var articles []*model.Article
	var total int64

	searchPattern := "%" + query + "%"

	dbQuery := r.db.WithContext(ctx).
		Model(&model.Article{}).
		Preload("Category").
		Where("status = ?", model.StatusPublished).
		Where("title ILIKE ? OR content ILIKE ?", searchPattern, searchPattern)

	// 统计总数
	if err := dbQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 获取分页结果
	if err := dbQuery.Order("published_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&articles).Error; err != nil {
		return nil, 0, err
	}

	return articles, total, nil
}

func (r *articleRepo) Create(ctx context.Context, article *model.Article) error {
	return r.db.WithContext(ctx).Create(article).Error
}

func (r *articleRepo) CreateWithTags(ctx context.Context, article *model.Article, tagIDs []uint) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 创建文章
		if err := tx.Create(article).Error; err != nil {
			return err
		}

		// 关联标签
		if len(tagIDs) > 0 {
			var tags []*model.Tag
			if err := tx.Find(&tags, tagIDs).Error; err != nil {
				return err
			}
			if err := tx.Model(article).Association("Tags").Replace(tags); err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *articleRepo) Update(ctx context.Context, article *model.Article) error {
	return r.db.WithContext(ctx).Save(article).Error
}

func (r *articleRepo) UpdateWithTags(ctx context.Context, article *model.Article, tagIDs []uint) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 更新文章
		if err := tx.Save(article).Error; err != nil {
			return err
		}

		// 更新标签关联
		if tagIDs != nil {
			var tags []*model.Tag
			if len(tagIDs) > 0 {
				if err := tx.Find(&tags, tagIDs).Error; err != nil {
					return err
				}
			}
			if err := tx.Model(article).Association("Tags").Replace(tags); err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *articleRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&model.Article{}, id).Error
}

func (r *articleRepo) SyncTags(ctx context.Context, articleID uint, tagIDs []uint) error {
	var article model.Article
	article.ID = articleID

	var tags []*model.Tag
	if len(tagIDs) > 0 {
		if err := r.db.WithContext(ctx).Find(&tags, tagIDs).Error; err != nil {
			return err
		}
	}

	return r.db.WithContext(ctx).Model(&article).Association("Tags").Replace(tags)
}

// FindRandom 获取随机文章（仅已发布）
func (r *articleRepo) FindRandom(ctx context.Context, limit int) ([]*model.Article, error) {
	var articles []*model.Article

	err := r.db.WithContext(ctx).
		Select("id, title, slug, summary, cover_image, category_id, published_at").
		Preload("Category").
		Preload("Tags").
		Where("status = ?", model.StatusPublished).
		Order("RANDOM()").
		Limit(limit).
		Find(&articles).Error

	if err != nil {
		return nil, err
	}
	return articles, nil
}

// FindRecent 获取最近文章（仅已发布，按发布时间降序）
func (r *articleRepo) FindRecent(ctx context.Context, limit int) ([]*model.Article, error) {
	var articles []*model.Article

	err := r.db.WithContext(ctx).
		Select("id, title, slug, summary, cover_image, category_id, published_at").
		Preload("Category").
		Preload("Tags").
		Where("status = ?", model.StatusPublished).
		Order("published_at DESC").
		Limit(limit).
		Find(&articles).Error

	if err != nil {
		return nil, err
	}
	return articles, nil
}
