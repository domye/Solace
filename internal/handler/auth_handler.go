package handler

import (
	"gin-quickstart/internal/dto/request"
	apperrors "gin-quickstart/internal/pkg/errors"
	"gin-quickstart/internal/service"
	"github.com/gin-gonic/gin"
)

// AuthHandler 认证处理器
type AuthHandler struct {
	authService service.AuthService
}

// NewAuthHandler 创建认证处理器
func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Login 用户登录
// @Summary 用户登录
// @Tags auth
// @Accept json
// @Produce json
// @Param request body request.LoginRequest true "登录凭据"
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req request.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的请求体", nil))
		return
	}

	resp, err := h.authService.Login(c.Request.Context(), &req)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, resp)
}

// Logout 用户登出
// @Summary 用户登出
// @Tags auth
// @Accept json
// @Produce json
// @Param request body request.RefreshTokenRequest true "要撤销的刷新令牌"
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	var req request.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的请求体", nil))
		return
	}

	if err := h.authService.Logout(c.Request.Context(), req.RefreshToken); err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, gin.H{"message": "登出成功"})
}

// Refresh 刷新令牌
// @Summary 刷新访问令牌
// @Tags auth
// @Accept json
// @Produce json
// @Param request body request.RefreshTokenRequest true "刷新令牌"
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Router /auth/refresh [post]
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req request.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的请求体", nil))
		return
	}

	resp, err := h.authService.Refresh(c.Request.Context(), &req)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, resp)
}
