package service

import (
	"context"

	"gin-quickstart/internal/config"
	"gin-quickstart/internal/dto/response"
)

// OwnerService 站长服务接口
type OwnerService interface {
	GetOwner(ctx context.Context) (*response.OwnerResponse, error)
}

// ownerService 站长服务实现
type ownerService struct {
	cfg *config.Config
}

// NewOwnerService 创建站长服务
func NewOwnerService(cfg *config.Config) OwnerService {
	return &ownerService{cfg: cfg}
}

func (s *ownerService) GetOwner(ctx context.Context) (*response.OwnerResponse, error) {
	return &response.OwnerResponse{
		Nickname:    s.cfg.AdminNickname(),
		AvatarURL:   s.cfg.AdminAvatarURL(),
		Bio:         s.cfg.AdminBio(),
		GitHubURL:   s.cfg.AdminGitHub(),
		BilibiliURL: s.cfg.AdminBilibili(),
		XURL:        s.cfg.AdminX(),
		Email:       s.cfg.AdminEmail(),
		RSSURL:      s.cfg.SiteBaseURL() + "/rss.xml",
		SitemapURL:  s.cfg.SiteBaseURL() + "/sitemap.xml",
	}, nil
}
