package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"gin-quickstart/internal/model"
	"gin-quickstart/internal/pkg/logger"
	"gorm.io/gorm"
)

const defaultMaxSearchQueryLen = 100

// articleRepo 文章仓储实现
type articleRepo struct {
	db                *gorm.DB
	maxSearchQueryLen int
}

// NewArticleRepository 创建文章仓储
func NewArticleRepository(db *gorm.DB, maxSearchQueryLen int) ArticleRepository {
	if maxSearchQueryLen <= 0 {
		maxSearchQueryLen = defaultMaxSearchQueryLen
	}
	return &articleRepo{db: db, maxSearchQueryLen: maxSearchQueryLen}
}

func (r *articleRepo) FindByID(ctx context.Context, id uint) (*model.Article, error) {
	start := time.Now()
	var article model.Article
	err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Tags").
		First(&article, id).Error
	if err != nil {
		logger.Debug().Err(err).Uint("article_id", id).Dur("duration", time.Since(start)).Msg("FindByID 失败")
		return nil, err
	}
	logger.Debug().Uint("article_id", id).Dur("duration", time.Since(start)).Msg("FindByID 成功")
	return &article, nil
}

func (r *articleRepo) FindBySlug(ctx context.Context, slug string) (*model.Article, error) {
	start := time.Now()
	var article model.Article
	err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Tags").
		Where("slug = ?", slug).
		First(&article).Error
	if err != nil {
		logger.Debug().Err(err).Str("slug", slug).Dur("duration", time.Since(start)).Msg("FindBySlug 失败")
		return nil, err
	}
	logger.Debug().Uint("article_id", article.ID).Str("slug", slug).Dur("duration", time.Since(start)).Msg("FindBySlug 成功")
	return &article, nil
}

func (r *articleRepo) FindAll(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*model.Article, int64, error) {
	var articles []*model.Article
	var total int64

	status, hasStatus := filters["status"]

	baseQuery := r.db.WithContext(ctx).Model(&model.Article{})
	if hasStatus {
		baseQuery = baseQuery.Where("status = ?", status)
	}

	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	query := r.db.WithContext(ctx).
		Select("id, title, slug, summary, cover_image, category_id, status, is_top, published_at, created_at, updated_at").
		Preload("Category").
		Preload("Tags")
	if hasStatus {
		query = query.Where("status = ?", status)
	}

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

	if err := r.db.WithContext(ctx).
		Model(&model.Article{}).
		Where("status = ?", model.StatusPublished).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.WithContext(ctx).
		Select("id, title, slug, summary, cover_image, category_id, status, is_top, published_at, created_at, updated_at").
		Preload("Category").
		Preload("Tags").
		Where("status = ?", model.StatusPublished).
		Order("is_top DESC, published_at DESC").
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

	if err := r.db.WithContext(ctx).
		Model(&model.Article{}).
		Where("status = ? AND category_id = ?", model.StatusPublished, category.ID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Tags").
		Where("status = ? AND category_id = ?", model.StatusPublished, category.ID).
		Order("is_top DESC, published_at DESC").
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

	var tag model.Tag
	if err := r.db.WithContext(ctx).Where("slug = ?", tagSlug).First(&tag).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.WithContext(ctx).
		Model(&model.Article{}).
		Joins("JOIN article_tags ON article_tags.article_id = articles.id").
		Where("articles.status = ? AND article_tags.tag_id = ?", model.StatusPublished, tag.ID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Tags").
		Joins("JOIN article_tags ON article_tags.article_id = articles.id").
		Where("articles.status = ? AND article_tags.tag_id = ?", model.StatusPublished, tag.ID).
		Order("articles.is_top DESC, articles.published_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&articles).Error; err != nil {
		return nil, 0, err
	}

	return articles, total, nil
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

const maxSearchQueryLength = 100

func (r *articleRepo) GetArchive(ctx context.Context) ([]*model.Article, error) {
	start := time.Now()
	var articles []*model.Article

	err := r.db.WithContext(ctx).
		Select("id, title, slug, summary, published_at, category_id").
		Preload("Category").
		Where("status = ?", model.StatusPublished).
		Order("published_at DESC").
		Find(&articles).Error

	if err != nil {
		logger.Error().Err(err).Dur("duration", time.Since(start)).Msg("GetArchive 失败")
		return nil, err
	}
	logger.Debug().Int("count", len(articles)).Dur("duration", time.Since(start)).Msg("GetArchive 成功")
	return articles, nil
}

func (r *articleRepo) Search(ctx context.Context, query string, limit, offset int) ([]*model.Article, int64, error) {
	start := time.Now()
	var articles []*model.Article
	var total int64

	if len(query) > r.maxSearchQueryLen {
		query = query[:r.maxSearchQueryLen]
	}

	// 使用 PostgreSQL 全文搜索
	// plainto_tsquery 自动处理用户输入，'simple' 配置适合中文
	tsQuery := fmt.Sprintf("plainto_tsquery('simple', '%s')", strings.ReplaceAll(query, "'", "''"))

	// 统计总数
	countSQL := fmt.Sprintf(`
		SELECT COUNT(*) FROM articles
		WHERE status = 'published' AND deleted_at IS NULL
		AND search_vec @@ %s
	`, tsQuery)
	if err := r.db.WithContext(ctx).Raw(countSQL).Scan(&total).Error; err != nil {
		logger.Error().Err(err).Str("query", query).Dur("duration", time.Since(start)).Msg("Search 统计失败")
		return nil, 0, err
	}

	// 获取分页结果，按相关度排序
	searchSQL := fmt.Sprintf(`
		SELECT * FROM articles
		WHERE status = 'published' AND deleted_at IS NULL
		AND search_vec @@ %s
		ORDER BY ts_rank(search_vec, %s) DESC, published_at DESC
		LIMIT ? OFFSET ?
	`, tsQuery, tsQuery)
	if err := r.db.WithContext(ctx).Raw(searchSQL, limit, offset).Scan(&articles).Error; err != nil {
		logger.Error().Err(err).Str("query", query).Dur("duration", time.Since(start)).Msg("Search 查询失败")
		return nil, 0, err
	}

	// 加载关联数据
	for _, article := range articles {
		if article.CategoryID != nil {
			r.db.WithContext(ctx).First(&article.Category, *article.CategoryID)
		}
		r.db.WithContext(ctx).Model(article).Association("Tags").Find(&article.Tags)
	}

	logger.Debug().Str("query", query).Int64("total", total).Dur("duration", time.Since(start)).Msg("Search 成功")
	return articles, total, nil
}

func (r *articleRepo) Create(ctx context.Context, article *model.Article) error {
	start := time.Now()
	err := r.db.WithContext(ctx).Create(article).Error
	if err != nil {
		logger.Error().Err(err).Str("title", article.Title).Dur("duration", time.Since(start)).Msg("Create 文章失败")
		return err
	}
	logger.Debug().Uint("article_id", article.ID).Dur("duration", time.Since(start)).Msg("Create 文章成功")
	return nil
}

func (r *articleRepo) CreateWithTags(ctx context.Context, article *model.Article, tagIDs []uint) error {
	start := time.Now()
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
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
	if err != nil {
		logger.Error().Err(err).Str("title", article.Title).Interface("tag_ids", tagIDs).Dur("duration", time.Since(start)).Msg("CreateWithTags 失败")
		return err
	}
	logger.Debug().Uint("article_id", article.ID).Interface("tag_ids", tagIDs).Dur("duration", time.Since(start)).Msg("CreateWithTags 成功")
	return nil
}

func (r *articleRepo) Update(ctx context.Context, article *model.Article) error {
	start := time.Now()
	err := r.db.WithContext(ctx).Save(article).Error
	if err != nil {
		logger.Error().Err(err).Uint("article_id", article.ID).Dur("duration", time.Since(start)).Msg("Update 文章失败")
		return err
	}
	logger.Debug().Uint("article_id", article.ID).Dur("duration", time.Since(start)).Msg("Update 文章成功")
	return nil
}

func (r *articleRepo) UpdateWithTags(ctx context.Context, article *model.Article, tagIDs []uint) error {
	start := time.Now()
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
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
	if err != nil {
		logger.Error().Err(err).Uint("article_id", article.ID).Interface("tag_ids", tagIDs).Dur("duration", time.Since(start)).Msg("UpdateWithTags 失败")
		return err
	}
	logger.Debug().Uint("article_id", article.ID).Interface("tag_ids", tagIDs).Dur("duration", time.Since(start)).Msg("UpdateWithTags 成功")
	return nil
}

func (r *articleRepo) Delete(ctx context.Context, id uint) error {
	start := time.Now()
	err := r.db.WithContext(ctx).Delete(&model.Article{}, id).Error
	if err != nil {
		logger.Error().Err(err).Uint("article_id", id).Dur("duration", time.Since(start)).Msg("Delete 文章失败")
		return err
	}
	logger.Debug().Uint("article_id", id).Dur("duration", time.Since(start)).Msg("Delete 文章成功")
	return nil
}

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

func (r *articleRepo) GetContributions(ctx context.Context, from, to time.Time) ([]*model.Article, error) {
	start := time.Now()
	var articles []*model.Article

	err := r.db.WithContext(ctx).
		Select("id, title, slug, published_at").
		Where("status = ? AND published_at >= ? AND published_at <= ?", model.StatusPublished, from, to).
		Order("published_at DESC").
		Find(&articles).Error

	if err != nil {
		logger.Error().Err(err).Dur("duration", time.Since(start)).Msg("GetContributions 失败")
		return nil, err
	}

	logger.Debug().Int("count", len(articles)).Dur("duration", time.Since(start)).Msg("GetContributions 成功")
	return articles, nil
}
