package media

import (
	"net/url"
	"regexp"
	"sort"
	"strings"
)

const markdownWidthParam = "md_width"

var (
	markdownImagePattern = regexp.MustCompile(`!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)`)
	htmlImagePattern     = regexp.MustCompile(`(?i)<img[^>]+src=["']([^"']+)["']`)
)

func CollectReferencedImageURLs(content string, extras ...string) []string {
	seen := make(map[string]struct{})

	for _, raw := range extras {
		if normalized := NormalizeImageURL(raw); normalized != "" {
			seen[normalized] = struct{}{}
		}
	}

	for _, match := range markdownImagePattern.FindAllStringSubmatch(content, -1) {
		if len(match) < 2 {
			continue
		}
		if normalized := NormalizeImageURL(match[1]); normalized != "" {
			seen[normalized] = struct{}{}
		}
	}

	for _, match := range htmlImagePattern.FindAllStringSubmatch(content, -1) {
		if len(match) < 2 {
			continue
		}
		if normalized := NormalizeImageURL(match[1]); normalized != "" {
			seen[normalized] = struct{}{}
		}
	}

	urls := make([]string, 0, len(seen))
	for value := range seen {
		urls = append(urls, value)
	}
	sort.Strings(urls)
	return urls
}

func NormalizeImageURL(raw string) string {
	value := strings.TrimSpace(raw)
	if value == "" {
		return ""
	}

	parsed, err := url.Parse(value)
	if err != nil {
		return value
	}

	query := parsed.Query()
	query.Del(markdownWidthParam)
	parsed.RawQuery = query.Encode()

	normalized := parsed.String()
	normalized = strings.TrimSuffix(normalized, "?")
	return normalized
}
