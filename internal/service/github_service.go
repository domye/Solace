package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"gin-quickstart/internal/config"
	apperrors "gin-quickstart/internal/pkg/errors"
)

// GitHubService GitHub 服务接口
type GitHubService interface {
	GetContributions(ctx context.Context, username string, from, to time.Time) (*ContributionsResponse, error)
}

// ContributionsResponse 贡献数据响应（稀疏格式）
type ContributionsResponse struct {
	Year          int            `json:"year"`          // 数据年份
	Total         int            `json:"total"`         // 总贡献数
	Contributions map[string]int `json:"contributions"` // 有贡献的日期，key: MM-DD, value: count
}

// githubService GitHub 服务实现
type githubService struct {
	token string
}

// NewGitHubService 创建 GitHub 服务
func NewGitHubService(cfg *config.Config) GitHubService {
	return &githubService{
		token: cfg.GitHubToken(),
	}
}

// graphqlResponse GitHub GraphQL API 响应结构
type graphqlResponse struct {
	Data struct {
		User struct {
			ContributionsCollection struct {
				ContributionCalendar struct {
					Weeks []struct {
						ContributionDays []struct {
							Date              string `json:"date"`
							ContributionCount int    `json:"contributionCount"`
						} `json:"contributionDays"`
					} `json:"weeks"`
				} `json:"contributionCalendar"`
			} `json:"contributionsCollection"`
		} `json:"user"`
	} `json:"data"`
	Errors []struct {
		Message string `json:"message"`
	} `json:"errors"`
}

// GetContributions 获取用户贡献日历数据
func (s *githubService) GetContributions(ctx context.Context, username string, from, to time.Time) (*ContributionsResponse, error) {
	if s.token == "" {
		return nil, apperrors.NewBadRequest("GitHub token not configured", nil)
	}

	// 构建 GraphQL 查询
	query := `
		query($username: String!, $from: DateTime!, $to: DateTime!) {
			user(login: $username) {
				contributionsCollection(from: $from, to: $to) {
					contributionCalendar {
						weeks {
							contributionDays {
								date
								contributionCount
							}
						}
					}
				}
			}
		}
	`

	variables := map[string]interface{}{
		"username": username,
		"from":     from.Format(time.RFC3339),
		"to":       to.Format(time.RFC3339),
	}

	requestBody := map[string]interface{}{
		"query":     query,
		"variables": variables,
	}

	bodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.github.com/graphql", bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, apperrors.NewBadRequest(fmt.Sprintf("GitHub API error: %d - %s", resp.StatusCode, string(body)), nil)
	}

	var result graphqlResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(result.Errors) > 0 {
		return nil, apperrors.NewBadRequest(result.Errors[0].Message, nil)
	}

	// 转换数据格式（稀疏格式：只返回有贡献的日期）
	contributions := make(map[string]int)
	total := 0
	for _, week := range result.Data.User.ContributionsCollection.ContributionCalendar.Weeks {
		for _, day := range week.ContributionDays {
			if day.ContributionCount > 0 {
				// 只取 MM-DD 部分
				dateParts := strings.Split(day.Date, "-")
				if len(dateParts) == 3 {
					key := dateParts[1] + "-" + dateParts[2] // MM-DD
					contributions[key] = day.ContributionCount
				}
				total += day.ContributionCount
			}
		}
	}

	// 提取年份
	year := to.Year()

	return &ContributionsResponse{
		Year:          year,
		Total:         total,
		Contributions: contributions,
	}, nil
}
