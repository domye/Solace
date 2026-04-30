package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"gin-quickstart/internal/config"
	apperrors "gin-quickstart/internal/pkg/errors"
)

type GitHubService interface {
	GetContributions(ctx context.Context, username string, from, to time.Time) (*ContributionsResponse, error)
}

type ContributionsGroup struct {
	Year          int            `json:"year"`
	Contributions map[string]int `json:"contributions"`
}

type ContributionsResponse struct {
	Total  int                   `json:"total"`
	Groups []*ContributionsGroup `json:"groups"`
}

type githubService struct {
	token string
}

type cachedContributions struct {
	data      *ContributionsResponse
	expiresAt time.Time
}

var (
	globalHTTPClient sync.Once
	httpClient       *http.Client
	contributionsMu  sync.RWMutex
	contributionsCache = make(map[string]*cachedContributions)
)

const contributionsCacheTTL = 1 * time.Hour

func getHTTPClient() *http.Client {
	globalHTTPClient.Do(func() {
		httpClient = &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 10,
				IdleConnTimeout:     90 * time.Second,
			},
		}
	})
	return httpClient
}

func NewGitHubService(cfg *config.Config) GitHubService {
	return &githubService{
		token: cfg.GitHubToken(),
	}
}

type graphqlResponse struct {
	Data struct {
		User struct {
			ContributionsCollection struct {
				ContributionCalendar struct {
					TotalContributions int `json:"totalContributions"`
					Weeks              []struct {
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

func (s *githubService) GetContributions(ctx context.Context, username string, from, to time.Time) (*ContributionsResponse, error) {
	if s.token == "" {
		return nil, apperrors.NewBadRequest("GitHub token not configured", nil)
	}

	cacheKey := fmt.Sprintf("%s|%s|%s", username, from.Format("2006-01-02"), to.Format("2006-01-02"))

	contributionsMu.RLock()
	if cached, ok := contributionsCache[cacheKey]; ok {
		if time.Now().Before(cached.expiresAt) {
			contributionsMu.RUnlock()
			return cached.data, nil
		}
	}
	contributionsMu.RUnlock()

	result, err := s.fetchContributions(ctx, username, from, to)
	if err != nil {
		return nil, err
	}

	contributionsMu.Lock()
	contributionsCache[cacheKey] = &cachedContributions{
		data:      result,
		expiresAt: time.Now().Add(contributionsCacheTTL),
	}
	contributionsMu.Unlock()

	return result, nil
}

func (s *githubService) fetchContributions(ctx context.Context, username string, from, to time.Time) (*ContributionsResponse, error) {
	query := `
		query($username: String!, $from: DateTime!, $to: DateTime!) {
			user(login: $username) {
				contributionsCollection(from: $from, to: $to) {
					contributionCalendar {
						totalContributions
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

	resp, err := getHTTPClient().Do(req)
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

	total := result.Data.User.ContributionsCollection.ContributionCalendar.TotalContributions

	yearGroups := make(map[int]*ContributionsGroup, 3)

	for _, week := range result.Data.User.ContributionsCollection.ContributionCalendar.Weeks {
		for _, day := range week.ContributionDays {
			if day.ContributionCount == 0 {
				continue
			}

			if len(day.Date) < 4 {
				continue
			}

			year := int(day.Date[0]-'0')*1000 + int(day.Date[1]-'0')*100 +
				int(day.Date[2]-'0')*10 + int(day.Date[3]-'0')

			group := yearGroups[year]
			if group == nil {
				group = &ContributionsGroup{
					Year:          year,
					Contributions: make(map[string]int, 64),
				}
				yearGroups[year] = group
			}

			group.Contributions[day.Date[5:10]] = day.ContributionCount
		}
	}

	groups := make([]*ContributionsGroup, 0, len(yearGroups))
	for _, g := range yearGroups {
		groups = append(groups, g)
	}

	return &ContributionsResponse{Total: total, Groups: groups}, nil
}
