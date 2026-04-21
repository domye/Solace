package service

import (
	"context"
	"time"

	"gin-quickstart/internal/config"
	"gin-quickstart/internal/dto/request"
	"gin-quickstart/internal/dto/response"
	apperrors "gin-quickstart/internal/pkg/errors"
	"gin-quickstart/internal/pkg/hash"
	"gin-quickstart/internal/pkg/jwt"
	"gin-quickstart/internal/pkg/logger"
)

// 认证相关错误
var (
	ErrInvalidCredentials = apperrors.NewUnauthorized("邮箱或密码错误")
	ErrTokenExpired       = apperrors.NewUnauthorized("令牌已过期")
	ErrTokenRevoked       = apperrors.NewUnauthorized("令牌已被撤销")
)

// AuthService 认证业务逻辑接口
type AuthService interface {
	Login(ctx context.Context, req *request.LoginRequest) (*response.AuthResponse, error)
	Logout(ctx context.Context, refreshToken string) error
	Refresh(ctx context.Context, req *request.RefreshTokenRequest) (*response.RefreshResponse, error)
	ValidateAccessToken(token string) (*jwt.Claims, error)
}

// authService 认证服务实现
type authService struct {
	cfg            *config.Config
	jwtManager     *jwt.JWTManager
	accessDuration time.Duration
}

// NewAuthService 创建认证服务
func NewAuthService(
	cfg *config.Config,
	jwtManager *jwt.JWTManager,
	accessDuration time.Duration,
) AuthService {
	return &authService{
		cfg:            cfg,
		jwtManager:     jwtManager,
		accessDuration: accessDuration,
	}
}

func (s *authService) Login(ctx context.Context, req *request.LoginRequest) (*response.AuthResponse, error) {
	log := logger.WithContext(ctx)

	log.Info().Str("email", req.Email).Msg("登录尝试")

	// 验证邮箱是否匹配配置的管理员邮箱
	if req.Email != s.cfg.AdminEmail() {
		log.Warn().Str("email", req.Email).Msg("邮箱不匹配")
		return nil, ErrInvalidCredentials
	}

	// 验证密码
	if !hash.CheckPassword(req.Password, s.cfg.AdminPasswordHash()) {
		log.Warn().Str("email", req.Email).Msg("密码错误")
		return nil, ErrInvalidCredentials
	}

	// 生成令牌
	log.Info().Str("email", req.Email).Msg("登录成功")
	return s.generateTokens()
}

func (s *authService) Logout(ctx context.Context, refreshToken string) error {
	log := logger.WithContext(ctx)
	log.Info().Msg("用户登出")
	// 单用户模式，登出无需额外处理
	return nil
}

func (s *authService) Refresh(ctx context.Context, req *request.RefreshTokenRequest) (*response.RefreshResponse, error) {
	log := logger.WithContext(ctx)

	log.Debug().Msg("刷新令牌")

	// 验证刷新令牌
	if err := s.jwtManager.ValidateRefreshToken(req.RefreshToken); err != nil {
		log.Warn().Err(err).Msg("刷新令牌验证失败")
		return nil, ErrTokenExpired
	}

	// 生成新令牌
	accessToken, err := s.jwtManager.GenerateAccessToken(1, s.cfg.AdminUsername(), "admin")
	if err != nil {
		log.Error().Err(err).Msg("生成访问令牌失败")
		return nil, err
	}

	refreshToken, _, err := s.jwtManager.GenerateRefreshToken(1)
	if err != nil {
		log.Error().Err(err).Msg("生成刷新令牌失败")
		return nil, err
	}

	log.Info().Msg("令牌刷新成功")

	return &response.RefreshResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.accessDuration.Seconds()),
	}, nil
}

func (s *authService) ValidateAccessToken(token string) (*jwt.Claims, error) {
	return s.jwtManager.ValidateAccessToken(token)
}

func (s *authService) generateTokens() (*response.AuthResponse, error) {
	// 生成访问令牌
	accessToken, err := s.jwtManager.GenerateAccessToken(1, s.cfg.AdminUsername(), "admin")
	if err != nil {
		return nil, err
	}

	// 生成刷新令牌
	refreshToken, _, err := s.jwtManager.GenerateRefreshToken(1)
	if err != nil {
		return nil, err
	}

	return &response.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.accessDuration.Seconds()),
		User: &response.UserResponse{
			ID:        1,
			Username:  s.cfg.AdminUsername(),
			Email:     s.cfg.AdminEmail(),
			Nickname:  s.cfg.AdminNickname(),
			AvatarURL: s.cfg.AdminAvatarURL(),
			Bio:       s.cfg.AdminBio(),
			GitHubURL: s.cfg.AdminGitHub(),
			Role:      "admin",
		},
	}, nil
}
