package handler

import (
	"fmt"
	"strings"
	"time"

	"gin-quickstart/internal/config"
	"gin-quickstart/internal/service"

	"github.com/gin-gonic/gin"
)

type SitemapHandler struct {
	articleService  service.ArticleService
	categoryService service.CategoryService
	tagService      service.TagService
	pageService     service.PageService
	cfg             *config.Config
}

func NewSitemapHandler(
	articleService service.ArticleService,
	categoryService service.CategoryService,
	tagService service.TagService,
	pageService service.PageService,
	cfg *config.Config,
) *SitemapHandler {
	return &SitemapHandler{
		articleService:  articleService,
		categoryService: categoryService,
		tagService:      tagService,
		pageService:     pageService,
		cfg:             cfg,
	}
}

func (h *SitemapHandler) GetSitemap(c *gin.Context) {
	baseURL := h.cfg.SiteBaseURL()
	if baseURL == "" {
		c.String(500, "site base_url not configured")
		return
	}

	var sb strings.Builder
	sb.Grow(8192)

	sb.WriteString(`<?xml version="1.0" encoding="UTF-8"?>`)
	sb.WriteByte('\n')
	sb.WriteString(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`)
	sb.WriteByte('\n')

	h.buildURL(&sb, baseURL, "", "1.0", "daily")
	h.buildURL(&sb, baseURL+"/archive", "", "0.8", "weekly")

	pages, _ := h.pageService.GetList(c.Request.Context(), 1, 100, "published", "")
	for _, pg := range pages.Items {
		h.buildURL(&sb, baseURL+"/pages/"+pg.Slug, "", "0.6", "monthly")
	}

	categories, _ := h.categoryService.GetList(c.Request.Context())
	for _, cat := range categories.Items {
		h.buildURL(&sb, baseURL+"/categories/"+cat.Slug, "", "0.6", "weekly")
	}

	tags, _ := h.tagService.GetList(c.Request.Context())
	for _, tag := range tags.Items {
		h.buildURL(&sb, baseURL+"/tags/"+tag.Slug, "", "0.5", "weekly")
	}

	articles, _ := h.articleService.GetArchive(c.Request.Context())
	for _, group := range articles.Groups {
		for _, post := range group.Posts {
			lastmod := ""
			if post.PublishedAt != nil {
				lastmod = post.PublishedAt.Format("2006-01-02")
			}
			h.buildURL(&sb, baseURL+"/articles/"+post.Slug, lastmod, "0.7", "")
		}
	}

	sb.WriteString("</urlset>")

	c.Header("Content-Type", "application/xml")
	c.String(200, sb.String())
}

func (h *SitemapHandler) buildURL(sb *strings.Builder, loc, lastmod, priority, changefreq string) {
	sb.WriteString("  <url>\n")
	fmt.Fprintf(sb, "    <loc>%s</loc>\n", loc)
	if lastmod != "" {
		fmt.Fprintf(sb, "    <lastmod>%s</lastmod>\n", lastmod)
	} else {
		fmt.Fprintf(sb, "    <lastmod>%s</lastmod>\n", time.Now().Format("2006-01-02"))
	}
	if changefreq != "" {
		fmt.Fprintf(sb, "    <changefreq>%s</changefreq>\n", changefreq)
	}
	if priority != "" {
		fmt.Fprintf(sb, "    <priority>%s</priority>\n", priority)
	}
	sb.WriteString("  </url>\n")
}
