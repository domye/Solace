package handler

import (
	"time"

	apperrors "gin-quickstart/internal/pkg/errors"
	"gin-quickstart/internal/s
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
// @Success 200 {object} Response
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
func extractGitHubUsername(url string) string {
	if url == "" {
		return ""
	}
	// 匹配 https://github.com/username 或 github.com/username
	for i := 0; i < len(url); i++ {
		if url[i] == '/' {
			if i+1 < len(url) && url[i+1] == '/' {
				// 找到 //
				rest := url[i+2:]
				// 跳过域名部分
				for j := 0; j < len(rest); j++ {
					if rest[j] == '/' {
						username := rest[j+1:]
						// 移除尾部斜杠或其他路径
						for k := 0; k < len(username); k++ {
							if username[k] == '/' || username[k] == '?' || username[k] == '#' {
								return username[:k]
							}
						}
						return username
					}
				}
			}
		}
	}
	return ""
}
