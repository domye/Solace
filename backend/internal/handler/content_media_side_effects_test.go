package handler

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"gin-quickstart/internal/dto/response"
	"gin-quickstart/internal/model"
	apperrors "gin-quickstart/internal/pkg/errors"
	"gin-quickstart/internal/service"
	"github.com/gin-gonic/gin"
)

type contentTestArticleService struct{}

func (s *contentTestArticleService) Create(context.Context, uint, string, string, string, string, string, *uint, []uint, string) (*response.ArticleResponse, error) {
	now := time.Now()
	return &response.ArticleResponse{
		ID:        1,
		Title:     "title",
		Slug:      "title",
		Content:   "content",
		Status:    "draft",
		Version:   1,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

func (s *contentTestArticleService) GetByID(context.Context, uint) (*response.ArticleResponse, error) {
	panic("unexpected call")
}

func (s *contentTestArticleService) GetBySlug(context.Context, string) (*response.ArticleResponse, error) {
	panic("unexpected call")
}

func (s *contentTestArticleService) GetList(context.Context, int, int, string, string, string) (*response.ArticleListResponse, error) {
	panic("unexpected call")
}

func (s *contentTestArticleService) GetArchive(context.Context) (*response.ArchiveResponse, error) {
	panic("unexpected call")
}

func (s *contentTestArticleService) Search(context.Context, string, int, int) (*response.ArticleListResponse, error) {
	panic("unexpected call")
}

func (s *contentTestArticleService) GetRandom(context.Context, int) ([]*response.ArticleSummary, error) {
	panic("unexpected call")
}

func (s *contentTestArticleService) GetRecent(context.Context, int) ([]*response.ArticleSummary, error) {
	panic("unexpected call")
}

func (s *contentTestArticleService) Update(context.Context, uint, int, string, string, string, string, string, *uint, []uint, string) (*response.ArticleResponse, error) {
	now := time.Now()
	return &response.ArticleResponse{
		ID:        1,
		Title:     "updated",
		Slug:      "updated",
		Content:   "content",
		Status:    "draft",
		Version:   2,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

func (s *contentTestArticleService) Delete(context.Context, uint) error {
	return nil
}

type contentTestPageService struct{}

func (s *contentTestPageService) Create(context.Context, string, string, string, string, string, string, string, int, bool) (*response.PageResponse, error) {
	now := time.Now()
	return &response.PageResponse{
		ID:        1,
		Title:     "title",
		Slug:      "title",
		Template:  "default",
		Content:   "content",
		Status:    "draft",
		Version:   1,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

func (s *contentTestPageService) GetByID(context.Context, uint) (*response.PageResponse, error) {
	panic("unexpected call")
}

func (s *contentTestPageService) GetBySlug(context.Context, string) (*response.PageResponse, error) {
	panic("unexpected call")
}

func (s *contentTestPageService) GetList(context.Context, int, int, string, string) (*response.PageListResponse, error) {
	panic("unexpected call")
}

func (s *contentTestPageService) GetNavPages(context.Context) ([]*response.NavPageResponse, error) {
	panic("unexpected call")
}

func (s *contentTestPageService) Update(context.Context, uint, int, string, string, string, string, string, string, string, int, bool) (*response.PageResponse, error) {
	now := time.Now()
	return &response.PageResponse{
		ID:        1,
		Title:     "updated",
		Slug:      "updated",
		Template:  "default",
		Content:   "content",
		Status:    "draft",
		Version:   2,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

func (s *contentTestPageService) Delete(context.Context, uint) error {
	return nil
}

type failingSyncMediaService struct{}

func (s *failingSyncMediaService) RegisterUpload(context.Context, service.RegisterMediaAssetInput) (*model.MediaAsset, error) {
	panic("unexpected call")
}

func (s *failingSyncMediaService) SyncArticleRefs(context.Context, uint, string, string) error {
	return apperrors.NewBadRequest("sync failed", nil)
}

func (s *failingSyncMediaService) SyncPageRefs(context.Context, uint, string, string) error {
	return apperrors.NewBadRequest("sync failed", nil)
}

func (s *failingSyncMediaService) ReleaseArticleRefs(context.Context, uint) error {
	return apperrors.NewBadRequest("release failed", nil)
}

func (s *failingSyncMediaService) ReleasePageRefs(context.Context, uint) error {
	return apperrors.NewBadRequest("release failed", nil)
}

type contextCapturingMediaService struct {
	articleSyncContextErr    error
	articleReleaseContextErr error
	pageSyncContextErr       error
	pageReleaseContextErr    error
}

func (s *contextCapturingMediaService) RegisterUpload(context.Context, service.RegisterMediaAssetInput) (*model.MediaAsset, error) {
	panic("unexpected call")
}

func (s *contextCapturingMediaService) SyncArticleRefs(ctx context.Context, _ uint, _ string, _ string) error {
	s.articleSyncContextErr = ctx.Err()
	return nil
}

func (s *contextCapturingMediaService) SyncPageRefs(ctx context.Context, _ uint, _ string, _ string) error {
	s.pageSyncContextErr = ctx.Err()
	return nil
}

func (s *contextCapturingMediaService) ReleaseArticleRefs(ctx context.Context, _ uint) error {
	s.articleReleaseContextErr = ctx.Err()
	return nil
}

func (s *contextCapturingMediaService) ReleasePageRefs(ctx context.Context, _ uint) error {
	s.pageReleaseContextErr = ctx.Err()
	return nil
}

func TestArticleCreateIgnoresMediaSyncFailure(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewArticleHandler(&contentTestArticleService{}, &failingSyncMediaService{})
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("user_id", uint(1))
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/articles", bytes.NewBufferString(`{"title":"title","content":"content"}`))
	ctx.Request.Header.Set("Content-Type", "application/json")

	handler.Create(ctx)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("Create() status = %d, want %d; body=%s", recorder.Code, http.StatusCreated, recorder.Body.String())
	}
}

func TestArticleUpdateIgnoresMediaSyncFailure(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewArticleHandler(&contentTestArticleService{}, &failingSyncMediaService{})
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/v1/articles/1", bytes.NewBufferString(`{"title":"updated","content":"content","version":1}`))
	ctx.Params = gin.Params{{Key: "id", Value: "1"}}
	ctx.Request.Header.Set("Content-Type", "application/json")

	handler.Update(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("Update() status = %d, want %d; body=%s", recorder.Code, http.StatusOK, recorder.Body.String())
	}
}

func TestArticleDeleteIgnoresMediaReleaseFailure(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewArticleHandler(&contentTestArticleService{}, &failingSyncMediaService{})
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/v1/articles/1", nil)
	ctx.Params = gin.Params{{Key: "id", Value: "1"}}

	handler.Delete(ctx)

	if ctx.Writer.Status() != http.StatusNoContent {
		t.Fatalf("Delete() status = %d, want %d; body=%s", ctx.Writer.Status(), http.StatusNoContent, recorder.Body.String())
	}
}

func TestPageCreateIgnoresMediaSyncFailure(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewPageHandler(&contentTestPageService{}, &failingSyncMediaService{})
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/pages", bytes.NewBufferString(`{"title":"title"}`))
	ctx.Request.Header.Set("Content-Type", "application/json")

	handler.Create(ctx)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("Create() status = %d, want %d; body=%s", recorder.Code, http.StatusCreated, recorder.Body.String())
	}
}

func TestPageUpdateIgnoresMediaSyncFailure(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewPageHandler(&contentTestPageService{}, &failingSyncMediaService{})
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/v1/pages/1", bytes.NewBufferString(`{"title":"updated","version":1}`))
	ctx.Params = gin.Params{{Key: "id", Value: "1"}}
	ctx.Request.Header.Set("Content-Type", "application/json")

	handler.Update(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("Update() status = %d, want %d; body=%s", recorder.Code, http.StatusOK, recorder.Body.String())
	}
}

func TestPageDeleteIgnoresMediaReleaseFailure(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewPageHandler(&contentTestPageService{}, &failingSyncMediaService{})
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/v1/pages/1", nil)
	ctx.Params = gin.Params{{Key: "id", Value: "1"}}

	handler.Delete(ctx)

	if ctx.Writer.Status() != http.StatusNoContent {
		t.Fatalf("Delete() status = %d, want %d; body=%s", ctx.Writer.Status(), http.StatusNoContent, recorder.Body.String())
	}
}

func TestArticleCreateUsesDetachedContextForMediaSync(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mediaService := &contextCapturingMediaService{}
	handler := NewArticleHandler(&contentTestArticleService{}, mediaService)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	requestContext, cancel := context.WithCancel(context.Background())
	cancel()
	ctx.Set("user_id", uint(1))
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/articles", bytes.NewBufferString(`{"title":"title","content":"content"}`)).WithContext(requestContext)
	ctx.Request.Header.Set("Content-Type", "application/json")

	handler.Create(ctx)

	if mediaService.articleSyncContextErr != nil {
		t.Fatalf("SyncArticleRefs() context err = %v, want nil", mediaService.articleSyncContextErr)
	}
}

func TestPageCreateUsesDetachedContextForMediaSync(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mediaService := &contextCapturingMediaService{}
	handler := NewPageHandler(&contentTestPageService{}, mediaService)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	requestContext, cancel := context.WithCancel(context.Background())
	cancel()
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/pages", bytes.NewBufferString(`{"title":"title"}`)).WithContext(requestContext)
	ctx.Request.Header.Set("Content-Type", "application/json")

	handler.Create(ctx)

	if mediaService.pageSyncContextErr != nil {
		t.Fatalf("SyncPageRefs() context err = %v, want nil", mediaService.pageSyncContextErr)
	}
}

func TestArticleUpdateUsesDetachedContextForMediaSync(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mediaService := &contextCapturingMediaService{}
	handler := NewArticleHandler(&contentTestArticleService{}, mediaService)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	requestContext, cancel := context.WithCancel(context.Background())
	cancel()
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/v1/articles/1", bytes.NewBufferString(`{"title":"updated","content":"content","version":1}`)).WithContext(requestContext)
	ctx.Params = gin.Params{{Key: "id", Value: "1"}}
	ctx.Request.Header.Set("Content-Type", "application/json")

	handler.Update(ctx)

	if mediaService.articleSyncContextErr != nil {
		t.Fatalf("SyncArticleRefs() context err = %v, want nil", mediaService.articleSyncContextErr)
	}
}

func TestPageUpdateUsesDetachedContextForMediaSync(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mediaService := &contextCapturingMediaService{}
	handler := NewPageHandler(&contentTestPageService{}, mediaService)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	requestContext, cancel := context.WithCancel(context.Background())
	cancel()
	ctx.Request = httptest.NewRequest(http.MethodPut, "/api/v1/pages/1", bytes.NewBufferString(`{"title":"updated","version":1}`)).WithContext(requestContext)
	ctx.Params = gin.Params{{Key: "id", Value: "1"}}
	ctx.Request.Header.Set("Content-Type", "application/json")

	handler.Update(ctx)

	if mediaService.pageSyncContextErr != nil {
		t.Fatalf("SyncPageRefs() context err = %v, want nil", mediaService.pageSyncContextErr)
	}
}

func TestArticleDeleteUsesDetachedContextForMediaRelease(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mediaService := &contextCapturingMediaService{}
	handler := NewArticleHandler(&contentTestArticleService{}, mediaService)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	requestContext, cancel := context.WithCancel(context.Background())
	cancel()
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/v1/articles/1", nil).WithContext(requestContext)
	ctx.Params = gin.Params{{Key: "id", Value: "1"}}

	handler.Delete(ctx)

	if mediaService.articleReleaseContextErr != nil {
		t.Fatalf("ReleaseArticleRefs() context err = %v, want nil", mediaService.articleReleaseContextErr)
	}
}

func TestPageDeleteUsesDetachedContextForMediaRelease(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mediaService := &contextCapturingMediaService{}
	handler := NewPageHandler(&contentTestPageService{}, mediaService)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	requestContext, cancel := context.WithCancel(context.Background())
	cancel()
	ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/v1/pages/1", nil).WithContext(requestContext)
	ctx.Params = gin.Params{{Key: "id", Value: "1"}}

	handler.Delete(ctx)

	if mediaService.pageReleaseContextErr != nil {
		t.Fatalf("ReleasePageRefs() context err = %v, want nil", mediaService.pageReleaseContextErr)
	}
}
