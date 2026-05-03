package service

import (
	"context"
	"sync"
	"time"

	"gin-quickstart/internal/config"
	"gin-quickstart/internal/dto/request"
	"gin-quickstart/internal/dto/response"
	apperrors "gin-quickstart/internal/pkg/errors"
	"gin-quickstart/internal/pkg/hash"
	"gin-quickstart/internal/pkg/jwt"
	"gin-quickstart/internal/pkg/logger"
)

const (
	maxLoginAttempts = 5
	lockoutDuration  = 15 * time.Minute
)

// 认证相关错误
var (
	ErrInvalidCredentials = apperrors.NewUnauthorized("邮箱或密码错误")
	ErrTokenExpired       = apperrors.NewUnauthorized("令牌已过期")
	ErrAccountLocked      = apperrors.NewUnauthorized("账户已锁定，请稍后再试")
)

// AuthService 认证业务逻辑接口
type AuthService interface {
	Login(ctx context.Context, req *request.LoginRequest) (*response.AuthResponse, error)
	Logout(ctx context.Context, refreshToken string) error
	Refresh(ctx context.Context, req *request.RefreshTokenRequest) (*response.RefreshResponse, error)
	ValidateAccessToken(token string) (*jwt.Claims, error)
}

// loginAttempt 登录尝试记录
type loginAttempt struct {
	count    int
	lockedAt time.Time
}

// authService 认证服务实现
type authService struct {
	cfg            *config.Config
	jwtManager     *jwt.JWTManager
	accessDuration time.Duration
	attempts       map[string]*loginAttempt
	mu             sync.RWMutex
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
		attempts:       make(map[string]*loginAttempt),
	}
}

func (s *authService) Login(ctx context.Context, req *request.LoginRequest) (*response.AuthResponse, error) {
	log := logger.WithContext(ctx)

	log.Info().Str("email", req.Email).Msg("登录尝试")

	if s.isAccountLocked(req.Email) {
		log.Warn().Str("email", req.Email).Msg("账户已锁定")
		return nil, ErrAccountLocked
	}

	if req.Email != s.cfg.AdminEmail() {
		log.Warn().Str("email", req.Email).Msg("邮箱不匹配")
		s.recordFailedAttempt(req.Email)
		return nil, ErrInvalidCredentials
	}

	if !hash.CheckPassword(req.Password, s.cfg.AdminPasswordHash()) {
		log.Warn().Str("email", req.Email).Msg("密码错误")
		s.recordFailedAttempt(req.Email)
		return nil, ErrInvalidCredentials
	}

	s.resetAttempts(req.Email)

	log.Info().Str("email", req.Email).Msg("登录成功")
	return s.generateTokens()
}

func (s *authService) isAccountLocked(email string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	attempt, exists := s.attempts[email]
	if !exists {
		return false
	}

	if attempt.count >= maxLoginAttempts {
		if time.Since(attempt.lockedAt) < lockoutDuration {
			return true
		}
	}

	return false
}

func (s *authService) recordFailedAttempt(email string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	attempt, exists := s.attempts[email]
	if !exists {
		attempt = &loginAttempt{count: 0}
		s.attempts[email] = attempt
	}

	attempt.count++
	if attempt.count >= maxLoginAttempts {
		attempt.lockedAt = time.Now()
	}
}

func (s *authService) resetAttempts(email string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.attempts, email)
}

func (s *authService) Logout(ctx context.Context, refreshToken string) error {
	log := logger.WithContext(ctx)
	log.Info().Msg("用户登出")
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
