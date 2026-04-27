package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"gin-quickstart/internal/model"
	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

type fakeArticleRepository struct {
	createdArticle             *model.Article
	updatedArticle             *model.Article
	storedArticle              *model.Article
	createErr                  error
	conflictOnCreateSlug       string
	allowCreateAfterSlugRetry  bool
}

func (r *fakeArticleRepository) FindByID(ctx context.Context, id uint) (*model.Article, error) {
	if r.storedArticle == nil {
		return nil, gorm.ErrRecordNotFound
	}
	copy := *r.storedArticle
	return &copy, nil
}

func (r *fakeArticleRepository) FindBySlug(ctx context.Context, slug string) (*model.Article, error) {
	return nil, gorm.ErrRecordNotFound
}

func (r *fakeArticleRepository) FindAll(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*model.Article, int64, error) {
	return nil, 0, nil
}

func (r *fakeArticleRepository) FindPublished(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*model.Article, int64, error) {
	return nil, 0, nil
}

func (r *fakeArticleRepository) FindByCategory(ctx context.Context, categorySlug string, limit, offset int) ([]*model.Article, int64, error) {
	return nil, 0, nil
}

func (r *fakeArticleRepository) FindByTag(ctx context.Context, tagSlug string, limit, offset int) ([]*model.Article, int64, error) {
	return nil, 0, nil
}

func (r *fakeArticleRepository) FindBySlugWithNav(ctx context.Context, slug string) (*model.Article, *model.Article, *model.Article, error) {
	return nil, nil, nil, gorm.ErrRecordNotFound
}

func (r *fakeArticleRepository) GetArchive(ctx context.Context) ([]*model.Article, error) {
	return nil, nil
}

func (r *fakeArticleRepository) Search(ctx context.Context, query string, limit, offset int) ([]*model.Article, int64, error) {
	return nil, 0, nil
}

func (r *fakeArticleRepository) FindRandom(ctx context.Context, limit int) ([]*model.Article, error) {
	return nil, nil
}

func (r *fakeArticleRepository) FindRecent(ctx context.Context, limit int) ([]*model.Article, error) {
	return nil, nil
}

func (r *fakeArticleRepository) Create(ctx context.Context, article *model.Article) error {
	if r.createErr != nil {
		return r.createErr
	}
	if r.conflictOnCreateSlug != "" && article.Slug == r.conflictOnCreateSlug {
		return &pgconn.PgError{Code: "23505", ConstraintName: "articles_slug_key"}
	}
	if r.conflictOnCreateSlug != "" && !r.allowCreateAfterSlugRetry && strings.HasPrefix(article.Slug, r.conflictOnCreateSlug+"-") {
		return &pgconn.PgError{Code: "23505", ConstraintName: "articles_slug_key"}
	}
	copy := *article
	copy.ID = 42
	r.createdArticle = &copy
	r.storedArticle = &copy
	return nil
}

func (r *fakeArticleRepository) CreateWithTags(ctx context.Context, article *model.Article, tagIDs []uint) error {
	return r.Create(ctx, article)
}

func (r *fakeArticleRepository) Update(ctx context.Context, article *model.Article) error {
	copy := *article
	r.updatedArticle = &copy
	r.storedArticle = &copy
	return nil
}

func (r *fakeArticleRepository) UpdateWithTags(ctx context.Context, article *model.Article, tagIDs []uint) error {
	return r.Update(ctx, article)
}

func (r *fakeArticleRepository) Delete(ctx context.Context, id uint) error {
	return nil
}

type fakeCategoryRepository struct{}

func (r *fakeCategoryRepository) FindByID(ctx context.Context, id uint) (*model.Category, error) {
	return nil, gorm.ErrRecordNotFound
}

func (r *fakeCategoryRepository) FindAllWithCount(ctx context.Context) ([]*model.CategoryWithCount, error) {
	return nil, nil
}

func (r *fakeCategoryRepository) Create(ctx context.Context, category *model.Category) error {
	return nil
}

func (r *fakeCategoryRepository) Update(ctx context.Context, category *model.Category) error {
	return nil
}

func (r *fakeCategoryRepository) Delete(ctx context.Context, id uint) error {
	return nil
}

func (r *fakeCategoryRepository) ExistsBySlug(ctx context.Context, slug string) bool {
	return false
}

func (r *fakeCategoryRepository) CountArticles(ctx context.Context, categoryID uint) int {
	return 0
}

type fakeTagRepository struct{}

func (r *fakeTagRepository) FindByID(ctx context.Context, id uint) (*model.Tag, error) {
	return nil, gorm.ErrRecordNotFound
}

func (r *fakeTagRepository) FindByIDs(ctx context.Context, ids []uint) ([]*model.Tag, error) {
	return nil, nil
}

func (r *fakeTagRepository) FindAllWithCount(ctx context.Context) ([]*model.TagWithCount, error) {
	return nil, nil
}

func (r *fakeTagRepository) Create(ctx context.Context, tag *model.Tag) error {
	return nil
}

func (r *fakeTagRepository) Update(ctx context.Context, tag *model.Tag) error {
	return nil
}

func (r *fakeTagRepository) Delete(ctx context.Context, id uint) error {
	return nil
}

func (r *fakeTagRepository) ExistsBySlug(ctx context.Context, slug string) bool {
	return false
}

func (r *fakeTagRepository) ExistsByName(ctx context.Context, name string) bool {
	return false
}

func (r *fakeTagRepository) CountArticles(ctx context.Context, tagID uint) int {
	return 0
}

func TestArticleServiceCreateSetsAuthorIDFromParameter(t *testing.T) {
	repo := &fakeArticleRepository{}
	service := NewArticleService(repo, &fakeCategoryRepository{}, &fakeTagRepository{})

	_, err := service.Create(context.Background(), 7, "图片宽度闭环验证", "", "正文", "摘要", "", nil, nil, model.StatusDraft)
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if repo.createdArticle == nil {
		t.Fatal("Create() did not persist an article")
	}
	if repo.createdArticle.AuthorID != 7 {
		t.Fatalf("created AuthorID = %d, want %d", repo.createdArticle.AuthorID, 7)
	}
}

func TestArticleServiceCreateRejectsMissingAuthorID(t *testing.T) {
	service := NewArticleService(&fakeArticleRepository{}, &fakeCategoryRepository{}, &fakeTagRepository{})

	_, err := service.Create(context.Background(), 0, "图片宽度闭环验证", "", "正文", "摘要", "", nil, nil, model.StatusDraft)
	if err == nil {
		t.Fatal("Create() error = nil, want error")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) && err.Error() != "无效用户标识" {
		t.Fatalf("Create() error = %v, want invalid author error", err)
	}
}

func TestArticleServiceCreateRetriesAutoGeneratedSlugAfterUniqueConstraintConflict(t *testing.T) {
	repo := &fakeArticleRepository{
		conflictOnCreateSlug:      "ce-shi-biao-ti",
		allowCreateAfterSlugRetry: true,
	}
	service := NewArticleService(repo, &fakeCategoryRepository{}, &fakeTagRepository{})

	_, err := service.Create(context.Background(), 7, "测试标题", "", "正文", "摘要", "", nil, nil, model.StatusPublished)
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if repo.createdArticle == nil {
		t.Fatal("Create() did not persist an article")
	}
	if repo.createdArticle.Slug == "ce-shi-biao-ti" {
		t.Fatalf("created slug = %q, want retried unique slug", repo.createdArticle.Slug)
	}
	if !strings.HasPrefix(repo.createdArticle.Slug, "ce-shi-biao-ti-") {
		t.Fatalf("created slug = %q, want timestamp-suffixed slug", repo.createdArticle.Slug)
	}
}
