package handler

import (
	"strings"
	"time"

	apperrors "gin-quickstart/internal/pkg/errors"
	"gin-quickstart/internal/service"
	"github.com/gin-gonic/gin"
)

// GitHubHandler GitHub 处理器
type GitHubHandler struct {
	githubService service.GitHubService
	ownerService  service.OwnerService
}

// NewGitHubHandler 创建 GitHub 处理器
func NewGitHubHandler(githubService service.GitHubService, ownerService service.OwnerService) *GitHubHandler {
	return &GitHubHandler{
		githubService: githubService,
		ownerService:  ownerService,
	}
}

// GetContributions 获取贡献日历数据
// @Summary 获取 GitHub 贡献日历
// @Tags github
// @Produce json
// @Success 200 {object} service.ContributionsResponse
// @Failure 400 {object} Response
// @Failure 500 {object} Response
// @Router /github/contributions [get]
func (h *GitHubHandler) GetContributions(c *gin.Context) {
	// 获取站长信息以提取 GitHub 用户名
	owner, err := h.ownerService.GetOwner(c.Request.Context())
	if err != nil {
		RespondWithError(c, err)
		return
	}

	// 从 GitHub URL 提取用户名
	username := extractGitHubUsername(owner.GitHubURL)
	if username == "" {
		RespondWithError(c, apperrors.NewBadRequest("GitHub username not found", nil))
		return
	}

	// 计算日期范围：最近12个月
	to := time.Now()
	from := to.AddDate(-1, 0, 0)

	// 获取贡献数据
	contributions, err := h.githubService.GetContributions(c.Request.Context(), username, from, to)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, contributions)
}

// extractGitHubUsername 从 GitHub URL 中提取用户名
// 支持格式: https://github.com/username, github.com/username, http://github.com/username
func extractGitHubUsername(url string) string {
	if url == "" {
		return ""
	}

	// 移除协议前缀
	url = strings.TrimPrefix(url, "https://")
	url = strings.TrimPrefix(url, "http://")

	// 检查是否为 github.com 域名
	if !strings.HasPrefix(url, "github.com/") {
		return ""
	}

	// 提取 github.com/ 后面的部分
	path := url[len("github.com/"):]

	// 找到第一个分隔符（/、?、#）的位置
	for i, char := range path {
		if char == '/' || char == '?' || char == '#' {
			if i == 0 {
				return "" // 用户名为空
			}
			return path[:i]
		}
	}

	// 没有分隔符，返回整个路径作为用户名
	if path == "" {
		return ""
	}
	return path
}
