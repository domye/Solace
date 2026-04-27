package handler

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"gin-quickstart/internal/model"
	"gin-quickstart/internal/service"
	"github.com/gin-gonic/gin"
)

type stubMediaService struct {
	registerCalled bool
}

func (s *stubMediaService) RegisterUpload(context.Context, service.RegisterMediaAssetInput) (*model.MediaAsset, error) {
	s.registerCalled = true
	return &model.MediaAsset{ID: 1, URL: "https://img.example/file.png", FileID: "file.png", Provider: "imgbed"}, nil
}

func (s *stubMediaService) SyncArticleRefs(context.Context, uint, string, string) error {
	panic("unexpected call")
}

func (s *stubMediaService) SyncPageRefs(context.Context, uint, string, string) error {
	panic("unexpected call")
}

func (s *stubMediaService) ReleaseArticleRefs(context.Context, uint) error {
	panic("unexpected call")
}

func (s *stubMediaService) ReleasePageRefs(context.Context, uint) error {
	panic("unexpected call")
}

func TestRegisterAssetRejectsInvalidURL(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mediaService := &stubMediaService{}
	handler := NewMediaHandler(mediaService)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/admin/media/assets/register", bytes.NewBufferString(`{"url":"javascript:alert(1)","file_id":"asset-1"}`))
	ctx.Request.Header.Set("Content-Type", "application/json")

	handler.RegisterAsset(ctx)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("RegisterAsset() status = %d, want %d; body=%s", recorder.Code, http.StatusBadRequest, recorder.Body.String())
	}
	if mediaService.registerCalled {
		t.Fatal("RegisterUpload() called, want request rejected at handler boundary")
	}
}
