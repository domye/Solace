package router

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"gin-quickstart/internal/handler"
	"gin-quickstart/internal/middleware"
	"gin-quickstart/internal/service"
)

// Router 路由器，持有所有处理器和服务
type Router struct {
	authHandler     *handler.AuthHandler
	articleHandler  *handler.ArticleHandler
	categoryHandler *handler.CategoryHandler
	tagHandler      *handler.TagHandler
	ownerHandler    *handler.OwnerHandler
	githubHandler   *handler.GitHubHandler
	sitemapHandler  *handler.SitemapHandler
	pageHandler     *handler.PageHandler
	authService     service.AuthService
}

// NewRouter 创建路由器并注入所有依赖
func NewRouter(
	authHandler *handler.AuthHandler,
	articleHandler *handler.ArticleHandler,
	categoryHandler *handler.CategoryHandler,
	tagHandler *handler.TagHandler,
	ownerHandler *handler.OwnerHandler,
	githubHandler *handler.GitHubHandler,
	authService service.AuthService,
	sitemapHandler *handler.SitemapHandler,
	pageHandler *handler.PageHandler,
) *Router {
	return &Router{
		authHandler:     authHandler,
		articleHandler:  articleHandler,
		categoryHandler: categoryHandler,
		tagHandler:      tagHandler,
		ownerHandler:    ownerHandler,
		githubHandler:   githubHandler,
		authService:     authService,
		sitemapHandler:  sitemapHandler,
		pageHandler:     pageHandler,
	}
}

// Setup 初始化路由并注册所有路由
func (r *Router) Setup(mode string) *gin.Engine {
	// 设置 Gin 模式
	gin.SetMode(mode)

	engine := gin.New()

	// 全局中间件
	engine.Use(middleware.CORS())
	engine.Use(middleware.RequestID())
	engine.Use(middleware.Logging())
	engine.Use(middleware.Recovery())

	// Swagger 文档路由
	engine.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 站点地图
	engine.GET("/sitemap.xml", r.sitemapHandler.GetSitemap)

	// API v1 路由
	v1 := engine.Group("/api/v1")
	{
		// 健康检查
		v1.GET("/health", handler.HealthCheck)

		// 站长信息（公开）
		v1.GET("/owner", r.ownerHandler.GetOwner)

		// GitHub 贡献数据（公开）
		v1.GET("/github/contributions", r.githubHandler.GetContributions)

		// 分类路由（公开）
		v1.GET("/categories", r.categoryHandler.GetList)

		// 标签路由（公开）
		v1.GET("/tags", r.tagHandler.GetList)

		// 公开页面路由（导航列表）
		v1.GET("/pages/nav", r.pageHandler.GetNavPages)

		// 公开页面路由（按 slug 访问）
		v1.GET("/pages/slug/:slug", r.pageHandler.GetBySlug)
		// 认证路由（公开）
		auth := v1.Group("/auth")
		{
			auth.POST("/login", r.authHandler.Login)
			auth.POST("/refresh", r.authHandler.Refresh)
			auth.POST("/logout", r.authHandler.Logout)
		}

		// 公开文章路由
		articles := v1.Group("/articles")
		{
			articles.GET("", r.articleHandler.GetList)
			articles.GET("/archive", r.articleHandler.GetArchive)
			articles.GET("/search", r.articleHandler.Search)
			articles.GET("/random", r.articleHandler.GetRandom)
			articles.GET("/recent", r.articleHandler.GetRecent)
			articles.GET("/slug/:slug", r.articleHandler.GetBySlug)
		}

		// 受保护路由
		protected := v1.Group("")
		protected.Use(middleware.Auth(r.authService))
		{
			// 受保护的文章路由
			protectedArticles := protected.Group("/articles")
			{
				articles.GET("/:id", r.articleHandler.GetByID)
				protectedArticles.POST("", r.articleHandler.Create)
				protectedArticles.PUT("/:id", r.articleHandler.Update)
				protectedArticles.DELETE("/:id", r.articleHandler.Delete)
			}

			// 受保护的分类路由
			protectedCategories := protected.Group("/categories")
			{
				protectedCategories.POST("", r.categoryHandler.Create)
				protectedCategories.PUT("/:id", r.categoryHandler.Update)
				protectedCategories.DELETE("/:id", r.categoryHandler.Delete)
			}

			// 受保护的标签路由
			protectedTags := protected.Group("/tags")
			{
				protectedTags.POST("", r.tagHandler.Create)
				protectedTags.PUT("/:id", r.tagHandler.Update)
				protectedTags.DELETE("/:id", r.tagHandler.Delete)
			}

			// 受保护的页面路由
			protectedPages := protected.Group("/pages")
			{
				protectedPages.GET("", r.pageHandler.GetList)
				protectedPages.GET("/:id", r.pageHandler.GetByID)
				protectedPages.POST("", r.pageHandler.Create)
				protectedPages.PUT("/:id", r.pageHandler.Update)
				protectedPages.DELETE("/:id", r.pageHandler.Delete)
			}
		}
	}

	return engine
}
