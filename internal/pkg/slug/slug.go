package slug

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/mozillazg/go-pinyin"
)

var (
	// 匹配非字母数字字符（连字符除外）
	nonAlphanumericRegex = regexp.MustCompile(`[^a-zA-Z0-9\-]`)
	// 匹配多个连续连字符
	multipleHyphensRegex = regexp.MustCompile(`-+`)
	// pinyin 转换器（使用带声调的默认参数）
	pinyinArgs = pinyin.NewArgs()
)

// Generate 从字符串生成 slug（支持中文转拼音）
func Generate(s string) string {
	// 转换为小写
	s = strings.ToLower(s)

	// 将中文转换为拼音
	s = convertChineseToPinyin(s)

	// 将空格替换为连字符
	s = strings.ReplaceAll(s, " ", "-")

	// 移除非字母数字字符（连字符除外）
	s = nonAlphanumericRegex.ReplaceAllString(s, "")

	// 将多个连字符合并为单个
	s = multipleHyphensRegex.ReplaceAllString(s, "-")

	// 去除首尾的连字符
	s = strings.Trim(s, "-")

	// 限制长度
	if len(s) > 200 {
		s = s[:200]
	}

	return s
}

// GenerateWithTimestamp 生成带时间戳后缀的 slug 以确保唯一性
func GenerateWithTimestamp(s string) string {
	generatedSlug := Generate(s)
	timestamp := time.Now().Unix()
	return fmt.Sprintf("%s-%d", generatedSlug, timestamp)
}

// convertChineseToPinyin 将字符串中的中文字符转换为拼音
func convertChineseToPinyin(s string) string {
	var result strings.Builder

	// 遍历字符串中的每个 rune（支持 Unicode）
	for _, r := range s {
		// 尝试转换为拼音
		pinyinStrs := pinyin.Pinyin(string(r), pinyinArgs)

		if len(pinyinStrs) > 0 && len(pinyinStrs[0]) > 0 {
			// 是中文字符，转换为拼音
			if result.Len() > 0 {
				// 检查前一个字符是否需要连字符分隔
				lastChar := result.String()[result.Len()-1]
				if lastChar != '-' && lastChar != ' ' {
					result.WriteString("-")
				}
			}
			result.WriteString(pinyinStrs[0][0])
		} else {
			// 非中文字符，直接写入
			result.WriteRune(r)
		}
	}

	return result.String()
}
