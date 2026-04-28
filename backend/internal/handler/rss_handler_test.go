package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"gin-quickstart/internal/config"
	"gin-quickstart/internal/dto/response"

	"github.com/gin-gonic/gin"
)

func TestEscapeXMLPreservesUTF8Text(t *testing.T) {
	input := "花生酱拌饭"

	got := escapeXML(input)

	if got != input {
		t.Fatalf("escapeXML() = %q, want %q", got, input)
	}
}

func TestGetRSSPreservesUTF8Title(t *testing.T) {
	gin.SetMode(gin.TestMode)

	publishedAt := time.Date(2026, 4, 25, 22, 0, 0, 0, time.FixedZone("CST", 8*3600))
	ownerService := &stubOwnerService{
		owner: &response.OwnerResponse{Nickname: "花生酱拌饭"},
	}
	articleService := &stubArticleService{
		recent: []*response.ArticleSummary{{
			Title:       "图片宽度闭环验证",
			Slug:        "tu-pian-kuan-du-bi-huan-yan-zheng",
			Summary:     "你所热爱的，就是你的生活。",
			PublishedAt: &publishedAt,
		}},
	}
	cfg := &config.Config{}
	cfg.Site.BaseURL = "http://localhost:8088"

	handler := NewRSSHandler(articleService, ownerService, cfg)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/rss.xml", nil)

	handler.GetRSS(ctx)

	body := recorder.Body.String()
	if !strings.Contains(body, "<title>花生酱拌饭&apos;s Blog</title>") {
		t.Fatalf("RSS title not preserved in body: %q", body)
	}
}

type stubArticleService struct {
	recent []*response.ArticleSummary
}

func (s *stubArticleService) Create(context.Context, uint, string, string, string, string, string, *uint, []uint, string) (*response.ArticleResponse, error) {
	panic("unexpected call")
}

func (s *stubArticleService) GetByID(context.Context, uint) (*response.ArticleResponse, error) {
	panic("unexpected call")
}

func (s *stubArticleService) GetBySlug(context.Context, string) (*response.ArticleResponse, error) {
	panic("unexpected call")
}

func (s *stubArticleService) GetList(context.Context, int, int, string, string, string) (*response.ArticleListResponse, error) {
	panic("unexpected call")
}

func (s *stubArticleService) GetArchive(context.Context) (*response.ArchiveResponse, error) {
	panic("unexpected call")
}

func (s *stubArticleService) Search(context.Context, string, int, int) (*response.ArticleListResponse, error) {
	panic("unexpected call")
}

func (s *stubArticleService) GetRandom(context.Context, int) ([]*response.ArticleSummary, error) {
	panic("unexpected call")
}

func (s *stubArticleService) GetRecent(context.Context, int) ([]*response.ArticleSummary, error) {
	return s.recent, nil
}

func (s *stubArticleService) Update(context.Context, uint, int, string, string, string, string, string, *uint, []uint, string) (*response.ArticleResponse, error) {
	panic("unexpected call")
}

func (s *stubArticleService) Delete(context.Context, uint) error {
	panic("unexpected call")
}

type stubOwnerService struct {
	owner *response.OwnerResponse
}

func (s *stubOwnerService) GetOwner(context.Context) (*response.OwnerResponse, error) {
	return s.owner, nil
}
