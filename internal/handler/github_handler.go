package handler

import (
	"time"

	"gin-quickstart/internal/config"
	apperrors "gin-quickstart/internal/pkg/errors"
	"gin-quickstart/internal/service"
	"github.com/gin-gonic/gin"
)

// GitHubHandler GitHub 处理器
type GitHubHandler struct {
	githubService service.GitHubService
	cfg           *config.Config
}

// NewGitHubHandler 创建 GitHub 处理器
func NewGitHubHandler(githubService service.GitHubService, cfg *config.Config) *GitHubHandler {
	return &GitHubHandler{
		githubService: githubService,
		cfg:           cfg,
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
	// 直接从配置获取 GitHub 用户名
	username := h.cfg.GitHubUsername()
	if username == "" {
		RespondWithError(c, apperrors.NewBadRequest("GitHub username not configured", nil))
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
