package service

import (
	"context"
	"testing"

	"gin-quickstart/internal/config"
)

func TestOwnerServiceGetOwnerIncludesExtendedSocialLinks(t *testing.T) {
	cfg := &config.Config{}
	cfg.Admin.Nickname = "花生酱拌饭"
	cfg.Admin.Bio = "你所热爱的，就是你的生活。"
	cfg.Admin.GitHub = "https://github.com/HSJ-BanFan"
	cfg.Admin.Email = "meijiahao94@gmail.com"
	cfg.Admin.Bilibili = "https://space.bilibili.com/123705919?spm_id_from=333.1007.0.0"
	cfg.Admin.X = "https://x.com/MJH1650025"
	cfg.Site.BaseURL = "https://blog.meilunaria.dpdns.org"

	service := NewOwnerService(cfg)
	owner, err := service.GetOwner(context.Background())
	if err != nil {
		t.Fatalf("GetOwner() error = %v", err)
	}

	if owner.Nickname != cfg.Admin.Nickname {
		t.Fatalf("Nickname = %q, want %q", owner.Nickname, cfg.Admin.Nickname)
	}
	if owner.Bio != cfg.Admin.Bio {
		t.Fatalf("Bio = %q, want %q", owner.Bio, cfg.Admin.Bio)
	}
	if owner.GitHubURL != cfg.Admin.GitHub {
		t.Fatalf("GitHubURL = %q, want %q", owner.GitHubURL, cfg.Admin.GitHub)
	}
	if owner.Email != cfg.Admin.Email {
		t.Fatalf("Email = %q, want %q", owner.Email, cfg.Admin.Email)
	}
	if owner.BilibiliURL != cfg.Admin.Bilibili {
		t.Fatalf("BilibiliURL = %q, want %q", owner.BilibiliURL, cfg.Admin.Bilibili)
	}
	if owner.XURL != cfg.Admin.X {
		t.Fatalf("XURL = %q, want %q", owner.XURL, cfg.Admin.X)
	}
	if owner.RSSURL != cfg.Site.BaseURL+"/rss.xml" {
		t.Fatalf("RSSURL = %q, want %q", owner.RSSURL, cfg.Site.BaseURL+"/rss.xml")
	}
	if owner.SitemapURL != cfg.Site.BaseURL+"/sitemap.xml" {
		t.Fatalf("SitemapURL = %q, want %q", owner.SitemapURL, cfg.Site.BaseURL+"/sitemap.xml")
	}
}
