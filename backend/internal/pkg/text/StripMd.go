package text

import (
	"regexp"
	"strings"
)

// StripMarkdown 去除 Markdown 格式标记，返回纯文本
func StripMarkdown(markdown string) string {
	if markdown == "" {
		return ""
	}

	text := markdown

	// 移除标题标记 (# ## ### 等)
	text = regexp.MustCompile(`^#{1,6}\s+`).ReplaceAllString(text, "")
	text = regexp.MustCompile(`\n#{1,6}\s+`).ReplaceAllStringFunc(text, func(s string) string {
		return "\n"
	})

	// 移除粗体和斜体标记 (**bold** *italic*)
	text = regexp.MustCompile(`\*\*(.+?)\*\*`).ReplaceAllString(text, "$1")
	text = regexp.MustCompile(`\*(.+?)\*`).ReplaceAllString(text, "$1")
	text = regexp.MustCompile(`__(.+?)__`).ReplaceAllString(text, "$1")
	text = regexp.MustCompile(`_(.+?)_`).ReplaceAllString(text, "$1")

	// 移除图片标记 ![alt](url)
	text = regexp.MustCompile(`!\[[^\]]*\]\([^)]+\)`).ReplaceAllString(text, "")

	// 移除链接标记 [text](url)
	text = regexp.MustCompile(`\[([^\]]+)\]\([^)]+\)`).ReplaceAllString(text, "$1")

	// 移除行内代码标记 `code`
	text = regexp.MustCompile("`([^`]+)`").ReplaceAllString(text, "$1")

	// 移除代码块标记
	text = regexp.MustCompile("[\\s\\S]*?").ReplaceAllString(text, "")

	// 移除引用标记 >
	text = regexp.MustCompile(`^\s*>\s*`).ReplaceAllString(text, "")
	text = regexp.MustCompile(`\n\s*>\s*`).ReplaceAllStringFunc(text, func(s string) string {
		return "\n"
	})

	// 移除无序列表标记 - * +
	text = regexp.MustCompile(`^\s*[-*+]\s+`).ReplaceAllString(text, "")
	text = regexp.MustCompile(`\n\s*[-*+]\s+`).ReplaceAllStringFunc(text, func(s string) string {
		return "\n"
	})

	// 移除有序列表标记 1. 2. 等
	text = regexp.MustCompile(`^\s*\d+\.\s+`).ReplaceAllString(text, "")
	text = regexp.MustCompile(`\n\s*\d+\.\s+`).ReplaceAllStringFunc(text, func(s string) string {
		return "\n"
	})

	// 移除水平线 --- *** ___
	text = regexp.MustCompile(`^\s*[-*_]{3,}\s*$`).ReplaceAllString(text, "")

	// 移除 HTML 标签
	text = regexp.MustCompile(`<[^>]+>`).ReplaceAllString(text, "")

	// 清理多余空白
	text = strings.TrimSpace(text)

	// 将多个连续空白字符替换为单个空格
	text = regexp.MustCompile(`\s+`).ReplaceAllString(text, " ")

	return text
}

// TruncateText 截取文本到指定长度，超出部分添加省略号
func TruncateText(text string, maxLength int) string {
	if maxLength < 0 {
		return ""
	}

	if len(text) <= maxLength {
		return text
	}

	// 按字符截取（支持中文）
	runes := []rune(text)
	if len(runes) <= maxLength {
		return text
	}

	return string(runes[:maxLength])
}

// GenerateSummary 从内容生成摘要：去除 Markdown 格式并截取前 N 个字符
func GenerateSummary(content string, maxLength int) string {
	if content == "" {
		return ""
	}

	// 去除 Markdown 格式
	plainText := StripMarkdown(content)

	// 截取指定长度
	return TruncateText(plainText, maxLength)
}
