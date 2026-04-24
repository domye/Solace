package repository

import (
	"context"
	stderrors "errors"
	"time"

	"gin-quickstart/internal/model"
	"gin-quickstart/internal/pkg/logger"

	"gorm.io/gorm"
)

type tagRepo struct {
	db *gorm.DB
}

func NewTagRepository(db *gorm.DB) TagRepository {
	return &tagRepo{db: db}
}

func (r *tagRepo) FindByID(ctx context.Context, id uint) (*model.Tag, error) {
	start := time.Now()
	var tag model.Tag
	err := r.db.WithContext(ctx).First(&tag, id).Error
	if err != nil {
		logger.Debug().Err(err).Uint("tag_id", id).Dur("duration", time.Since(start)).Msg("FindByID 失败")
		if stderrors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, err
	}
	logger.Debug().Uint("tag_id", id).Dur("duration", time.Since(start)).Msg("FindByID 成功")
	return &tag, nil
}

func (r *tagRepo) FindAllWithCount(ctx context.Context) ([]*model.TagWithCount, error) {
	start := time.Now()
	var results []*model.TagWithCount

	err := r.db.WithContext(ctx).
		Model(&model.Tag{}).
		Select("tags.id, tags.name, tags.slug, COUNT(article_tags.article_id) as article_count").
		Joins("LEFT JOIN article_tags ON article_tags.tag_id = tags.id").
		Joins("LEFT JOIN articles ON articles.id = article_tags.article_id AND articles.deleted_at IS NULL AND articles.status = ?", model.StatusPublished).
		Where("tags.deleted_at IS NULL").
		Group("tags.id").
		Order("tags.name ASC").
		Scan(&results).Error

	if err != nil {
		logger.Error().Err(err).Dur("duration", time.Since(start)).Msg("FindAllWithCount 失败")
		return nil, err
	}
	logger.Debug().Int("count", len(results)).Dur("duration", time.Since(start)).Msg("FindAllWithCount 成功")
	return results, nil
}

func (r *tagRepo) FindByIDs(ctx context.Context, ids []uint) ([]*model.Tag, error) {
	if len(ids) == 0 {
		return []*model.Tag{}, nil
	}
	start := time.Now()
	var tags []*model.Tag
	err := r.db.WithContext(ctx).Find(&tags, ids).Error
	if err != nil {
		logger.Error().Err(err).Interface("ids", ids).Dur("duration", time.Since(start)).Msg("FindByIDs 失败")
		return nil, err
	}
	logger.Debug().Int("count", len(tags)).Dur("duration", time.Since(start)).Msg("FindByIDs 成功")
	return tags, nil
}

func (r *tagRepo) Create(ctx context.Context, tag *model.Tag) error {
	start := time.Now()
	err := r.db.WithContext(ctx).Create(tag).Error
	if err != nil {
		logger.Error().Err(err).Str("name", tag.Name).Dur("duration", time.Since(start)).Msg("Create 失败")
		return err
	}
	logger.Debug().Uint("tag_id", tag.ID).Dur("duration", time.Since(start)).Msg("Create 成功")
	return nil
}

func (r *tagRepo) Update(ctx context.Context, tag *model.Tag) error {
	start := time.Now()
	err := r.db.WithContext(ctx).Save(tag).Error
	if err != nil {
		logger.Error().Err(err).Uint("tag_id", tag.ID).Dur("duration", time.Since(start)).Msg("Update 失败")
		return err
	}
	logger.Debug().Uint("tag_id", tag.ID).Dur("duration", time.Since(start)).Msg("Update 成功")
	return nil
}

func (r *tagRepo) Delete(ctx context.Context, id uint) error {
	start := time.Now()
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("tag_id = ?", id).Delete(&model.ArticleTag{}).Error; err != nil {
			return err
		}
		return tx.Delete(&model.Tag{}, id).Error
	})
	if err != nil {
		logger.Error().Err(err).Uint("tag_id", id).Dur("duration", time.Since(start)).Msg("Delete 失败")
		return err
	}
	logger.Debug().Uint("tag_id", id).Dur("duration", time.Since(start)).Msg("Delete 成功")
	return nil
}

func (r *tagRepo) ExistsBySlug(ctx context.Context, slug string) bool {
	var count int64
	r.db.WithContext(ctx).Model(&model.Tag{}).Where("slug = ?", slug).Count(&count)
	return count > 0
}

func (r *tagRepo) ExistsByName(ctx context.Context, name string) bool {
	var count int64
	r.db.WithContext(ctx).Model(&model.Tag{}).Where("name = ?", name).Count(&count)
	return count > 0
}

func (r *tagRepo) CountArticles(ctx context.Context, tagID uint) int {
	var count int64
	r.db.WithContext(ctx).
		Model(&model.ArticleTag{}).
		Joins("JOIN articles ON articles.id = article_tags.article_id AND articles.deleted_at IS NULL AND articles.status = ?", model.StatusPublished).
		Where("article_tags.tag_id = ?", tagID).
		Count(&count)
	return int(count)
}
