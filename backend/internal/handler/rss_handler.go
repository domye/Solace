package handler

import (
	"fmt"
	"strings"
	"time"

	"gin-quickstart/internal/config"
	"gin-quickstart/internal/service"

	"github.com/gin-gonic/gin"
)

type RSSHandler struct {
	articleService service.ArticleService
	ownerService   service.OwnerService
	cfg            *config.Config
}

func NewRSSHandler(
	articleService service.ArticleService,
	ownerService service.OwnerService,
	cfg *config.Config,
) *RSSHandler {
	return &RSSHandler{
		articleService: articleService,
		ownerService:   ownerService,
		cfg:            cfg,
	}
}

func (h *RSSHandler) GetRSS(c *gin.Context) {
	baseURL := h.cfg.SiteBaseURL()
	if baseURL == "" {
		c.String(500, "site base_url not configured")
		return
	}

	owner, _ := h.ownerService.GetOwner(c.Request.Context())

	articles, err := h.articleService.GetRecent(c.Request.Context(), 20)
	if err != nil {
		c.String(500, "failed to get articles")
		return
	}

	now := time.Now().Format(time.RFC1123Z)

	var xml string
	xml = `<?xml version="1.0" encoding="UTF-8"?>` + "\n"
	xml += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">` + "\n"
	xml += `<channel>` + "\n"

	siteTitle := owner.Nickname + "'s Blog"
	if siteTitle == "'s Blog" {
		siteTitle = "Solace Blog"
	}
	xml += fmt.Sprintf("  <title>%s</title>\n", escapeXML(siteTitle))
	xml += fmt.Sprintf("  <link>%s</link>\n", baseURL)
	xml += fmt.Sprintf("  <description>%s</description>\n", escapeXML(owner.Bio))
	xml += fmt.Sprintf("  <language>zh-CN</language>\n")
	xml += fmt.Sprintf("  <lastBuildDate>%s</lastBuildDate>\n", now)
	xml += fmt.Sprintf("  <atom:link href=\"%s/rss.xml\" rel=\"self\" type=\"application/rss+xml\"/>\n", baseURL)

	for _, article := range articles {
		if article.PublishedAt == nil {
			continue
		}

		xml += "  <item>\n"
		xml += fmt.Sprintf("    <title>%s</title>\n", escapeXML(article.Title))
		xml += fmt.Sprintf("    <link>%s/articles/%s</link>\n", baseURL, article.Slug)
		xml += fmt.Sprintf("    <guid>%s/articles/%s</guid>\n", baseURL, article.Slug)
		xml += fmt.Sprintf("    <pubDate>%s</pubDate>\n", article.PublishedAt.Format(time.RFC1123Z))
		if article.Summary != "" {
			xml += fmt.Sprintf("    <description>%s</description>\n", escapeXML(article.Summary))
		}
		xml += "  </item>\n"
	}

	xml += `</channel>` + "\n"
	xml += `</rss>`

	c.Header("Content-Type", "application/xml; charset=utf-8")
	c.String(200, xml)
}

func escapeXML(s string) string {
	replacer := strings.NewReplacer(
		"&", "&amp;",
		"<", "&lt;",
		">", "&gt;",
		"\"", "&quot;",
		"'", "&apos;",
	)
	return replacer.Replace(s)
}
