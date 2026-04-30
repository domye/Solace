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

	var sb strings.Builder
	sb.Grow(4096)

	sb.WriteString(`<?xml version="1.0" encoding="UTF-8"?>`)
	sb.WriteByte('\n')
	sb.WriteString(`<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`)
	sb.WriteByte('\n')
	sb.WriteString(`<channel>`)
	sb.WriteByte('\n')

	siteTitle := owner.Nickname + "'s Blog"
	if siteTitle == "'s Blog" {
		siteTitle = "Solace Blog"
	}
	fmt.Fprintf(&sb, "  <title>%s</title>\n", escapeXML(siteTitle))
	fmt.Fprintf(&sb, "  <link>%s</link>\n", baseURL)
	fmt.Fprintf(&sb, "  <description>%s</description>\n", escapeXML(owner.Bio))
	sb.WriteString("  <language>zh-CN</language>\n")
	fmt.Fprintf(&sb, "  <lastBuildDate>%s</lastBuildDate>\n", now)
	fmt.Fprintf(&sb, "  <atom:link href=\"%s/rss.xml\" rel=\"self\" type=\"application/rss+xml\"/>\n", baseURL)

	for _, article := range articles {
		if article.PublishedAt == nil {
			continue
		}

		sb.WriteString("  <item>\n")
		fmt.Fprintf(&sb, "    <title>%s</title>\n", escapeXML(article.Title))
		fmt.Fprintf(&sb, "    <link>%s/articles/%s</link>\n", baseURL, article.Slug)
		fmt.Fprintf(&sb, "    <guid>%s/articles/%s</guid>\n", baseURL, article.Slug)
		fmt.Fprintf(&sb, "    <pubDate>%s</pubDate>\n", article.PublishedAt.Format(time.RFC1123Z))
		if article.Summary != "" {
			fmt.Fprintf(&sb, "    <description>%s</description>\n", escapeXML(article.Summary))
		}
		sb.WriteString("  </item>\n")
	}

	sb.WriteString("</channel>\n")
	sb.WriteString("</rss>")

	c.Header("Content-Type", "application/xml; charset=utf-8")
	c.String(200, sb.String())
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
