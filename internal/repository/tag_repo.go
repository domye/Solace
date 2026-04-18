package repository

import (
	"context"

	"gin-quickstart/internal/model"
	"gorm.io/gorm"
)

// tagRepo 标签仓储实现
type tagRepo struct {
	db *gorm.DB
}

// NewTagRepository 创建标签仓储
func NewTagRepository(db *gorm.DB) TagRepository {
	return &tagRepo{db: db}
}

func (r *tagRepo) FindByID(ctx context.Context, id uint) (*model.Tag, error) {
	var tag model.Tag
	err := r.db.WithContext(ctx).First(&tag, id).Error
	if err != nil {
		return nil, err
	}
	return &tag, nil
}

func (r *tagRepo) FindAll(ctx context.Context) ([]*model.Tag, error) {
	var tags []*model.Tag
	err := r.db.WithContext(ctx).
		Order("name ASC").
		Find(&tags).Error
	if err != nil {
		return nil, err
	}
	return tags, nil
}

func (r *tagRepo) FindAllWithCount(ctx context.Context) ([]*model.TagWithCount, error) {
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
		return nil, err
	}
	return results, nil
}

func (r *tagRepo) FindByIDs(ctx context.Context, ids []uint) ([]*model.Tag, error) {
	if len(ids) == 0 {
		return []*model.Tag{}, nil
	}
	var tags []*model.Tag
	err := r.db.WithContext(ctx).Find(&tags, ids).Error
	if err != nil {
		return nil, err
	}
	return tags, nil
}

func (r *tagRepo) Create(ctx context.Context, tag *model.Tag) error {
	return r.db.WithContext(ctx).Create(tag).Error
}

func (r *tagRepo) CreateIfNotExists(ctx context.Context, name string) (*model.Tag, error) {
	var tag model.Tag
	err := r.db.WithContext(ctx).
		Where("name = ?", name).
		Attrs(model.Tag{Name: name}).
		FirstOrCreate(&tag).Error
	if err != nil {
		return nil, err
	}
	return &tag, nil
}

func (r *tagRepo) Update(ctx context.Context, tag *model.Tag) error {
	return r.db.WithContext(ctx).Save(tag).Error
}

func (r *tagRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&model.Tag{}, id).Error
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
