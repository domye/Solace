package repository

import (
	"context"

	"gin-quickstart/internal/model"
)

// ArticleRepository 文章数据访问接口
type ArticleRepository interface {
	FindByID(ctx context.Context, id uint) (*model.Article, error)
	FindBySlug(ctx context.Context, slug string) (*model.Article, error)
	FindAll(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*model.Article, int64, error)
	FindPublished(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*model.Article, int64, error)
	FindByCategory(ctx context.Context, categorySlug string, limit, offset int) ([]*model.Article, int64, error)
	FindByTag(ctx context.Context, tagSlug string, limit, offset int) ([]*model.Article, int64, error)
	FindByIDWithNav(ctx context.Context, id uint) (*model.Article, *model.Article, *model.Article, error)
	FindBySlugWithNav(ctx context.Context, slug string) (*model.Article, *model.Article, *model.Article, error)
	GetArchive(ctx context.Context) ([]*model.Article, error)
	Search(ctx context.Context, query string, limit, offset int) ([]*model.Article, int64, error)
	FindRandom(ctx context.Context, limit int) ([]*model.Article, error)
	FindRecent(ctx context.Context, limit int) ([]*model.Article, error)
	Create(ctx context.Context, article *model.Article) error
	CreateWithTags(ctx context.Context, article *model.Article, tagIDs []uint) error
	Update(ctx context.Context, article *model.Article) error
	UpdateWithTags(ctx context.Context, article *model.Article, tagIDs []uint) error
	Delete(ctx context.Context, id uint) error
	SyncTags(ctx context.Context, articleID uint, tagIDs []uint) error
}

// CategoryRepository 分类数据访问接口
type CategoryRepository interface {
	FindByID(ctx context.Context, id uint) (*model.Category, error)
	FindAll(ctx context.Context) ([]*model.Category, error)
	FindAllWithCount(ctx context.Context) ([]*model.CategoryWithCount, error)
	FindChildren(ctx context.Context, parentID uint) ([]*model.Category, error)
	Create(ctx context.Context, category *model.Category) error
	Update(ctx context.Context, category *model.Category) error
	Delete(ctx context.Context, id uint) error
	ExistsBySlug(ctx context.Context, slug string) bool
	CountArticles(ctx context.Context, categoryID uint) int
}

// TagRepository 标签数据访问接口
type TagRepository interface {
	FindByID(ctx context.Context, id uint) (*model.Tag, error)
	FindAll(ctx context.Context) ([]*model.Tag, error)
	FindAllWithCount(ctx context.Context) ([]*model.TagWithCount, error)
	FindByIDs(ctx context.Context, ids []uint) ([]*model.Tag, error)
	Create(ctx context.Context, tag *model.Tag) error
	CreateIfNotExists(ctx context.Context, name string) (*model.Tag, error)
	Update(ctx context.Context, tag *model.Tag) error
	Delete(ctx context.Context, id uint) error
	ExistsBySlug(ctx context.Context, slug string) bool
	ExistsByName(ctx context.Context, name string) bool
	CountArticles(ctx context.Context, tagID uint) int
}
