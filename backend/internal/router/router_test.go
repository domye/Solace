package router

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"gin-quickstart/internal/config"
	"gin-quickstart/internal/dto/request"
	"gin-quickstart/internal/dto/response"
	"gin-quickstart/internal/handler"
	pkgjwt "gin-quickstart/internal/pkg/jwt"
	"github.com/gin-gonic/gin"
)

type stubAuthService struct{}

func (stubAuthService) Login(context.Context, *request.LoginRequest) (*response.AuthResponse, error) {
	panic("unexpected call")
}

func (stubAuthService) Logout(context.Context, string) error {
	panic("unexpected call")
}

func (stubAuthService) Refresh(context.Context, *request.RefreshTokenRequest) (*response.RefreshResponse, error) {
	panic("unexpected call")
}

func (stubAuthService) ValidateAccessToken(string) (*pkgjwt.Claims, error) {
	return &pkgjwt.Claims{
		UserID:   1,
		Username: "admin",
		Role:     "admin",
	}, nil
}

func TestArticleIDRouteRequiresAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)

	app, _ := NewRouter(
		nil,
		nil,
		nil,
		nil,
		nil,
		nil,
		stubAuthService{},
		nil,
		nil,
		nil,
		&handler.UploadHandler{},
		nil,
		nil,
	).Setup(&config.Config{})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/articles/1", nil)
	rec := httptest.NewRecorder()
	app.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("GET /api/v1/articles/:id status = %d, want %d; body=%s", rec.Code, http.StatusUnauthorized, rec.Body.String())
	}
}
