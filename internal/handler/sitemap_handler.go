package handler

import (
	"fmt"
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

	var xml string
	xml = `<?xml version="1.0" encoding="UTF-8"?>` + "\n"
	xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` + "\n"

	xml += h.buildURL(baseURL, "", "1.0", "daily")
	xml += h.buildURL(baseURL+"/archive", "", "0.8", "weekly")

	pages, _ := h.pageService.GetList(c.Request.Context(), 1, 100, "published", "")
	for _, pg := range pages.Items {
		xml += h.buildURL(baseURL+"/pages/"+pg.Slug, "", "0.6", "monthly")
	}

	categories, _ := h.categoryService.GetList(c.Request.Context())
	for _, cat := range categories.Items {
		xml += h.buildURL(baseURL+"/categories/"+cat.Slug, "", "0.6", "weekly")
	}

	tags, _ := h.tagService.GetList(c.Request.Context())
	for _, tag := range tags.Items {
		xml += h.buildURL(baseURL+"/tags/"+tag.Slug, "", "0.5", "weekly")
	}

	articles, _ := h.articleService.GetArchive(c.Request.Context())
	for _, group := range articles.Groups {
		for _, post := range group.Posts {
			lastmod := ""
			if post.PublishedAt != nil {
				lastmod = post.PublishedAt.Format("2006-01-02")
			}
			xml += h.buildURL(baseURL+"/articles/"+post.Slug, lastmod, "0.7", "")
		}
	}

	xml += `</urlset>`

	c.Header("Content-Type", "application/xml")
	c.String(200, xml)
}

func (h *SitemapHandler) buildURL(loc, lastmod, priority, changefreq string) string {
	var url string
	url += "  <url>\n"
	url += fmt.Sprintf("    <loc>%s</loc>\n", loc)
	if lastmod != "" {
		url += fmt.Sprintf("    <lastmod>%s</lastmod>\n", lastmod)
	} else {
		url += fmt.Sprintf("    <lastmod>%s</lastmod>\n", time.Now().Format("2006-01-02"))
	}
	if changefreq != "" {
		url += fmt.Sprintf("    <changefreq>%s</changefreq>\n", changefreq)
	}
	if priority != "" {
		url += fmt.Sprintf("    <priority>%s</priority>\n", priority)
	}
	url += "  </url>\n"
	return url
}
