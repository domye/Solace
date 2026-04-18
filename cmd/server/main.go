package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gin-quickstart/internal/config"
	_ "gin-quickstart/internal/docs" // swagger docs
	"gin-quickstart/internal/handler"
	"gin-quickstart/internal/pkg/database"
	"gin-quickstart/internal/pkg/jwt"
	"gin-quickstart/internal/pkg/logger"
	"gin-quickstart/internal/repository"
	"gin-quickstart/internal/router"
	"gin-quickstart/internal/service"
)

// @title 博客系统 API
// @version 1.0
// @description 博客后端 API 服务，支持文章管理、配置文件认证等功能
// @termsOfService http://swagger.io/terms/

// @contact.name API 支持
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description JWT 认证令牌，格式: Bearer {token}

func main() {
	// 加载配置
	cfg := config.Load()

	// 初始化日志
	logger.Init(cfg.LogLevel(), cfg.LogEnv())

	logger.Info().
		Str("port", cfg.ServerPort()).
		Str("mode", cfg.ServerMode()).
		Msg("正在启动服务器")

	// 连接数据库
	db, err := database.Connect(cfg.GetDSN(), cfg.LogLevel())
	if err != nil {
		logger.Fatal().Err(err).Msg("数据库连接失败")
	}

	// 初始化仓储
	articleRepo := repository.NewArticleRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	tagRepo := repository.NewTagRepository(db)
	pageRepo := repository.NewPageRepository(db)

	// 初始化 JWT 管理器
	jwtManager := jwt.NewJWTManager(
		cfg.JWTSecret(),
		cfg.JWTAccessDuration(),
		cfg.JWTRefreshDuration(),
	)

	// 初始化服务
	authService := service.NewAuthService(
		cfg,
		jwtManager,
		cfg.JWTAccessDuration(),
	)
	ownerService := service.NewOwnerService(cfg)
	githubService := service.NewGitHubService(cfg)
	articleService := service.NewArticleService(articleRepo, categoryRepo, tagRepo)
	categoryService := service.NewCategoryService(categoryRepo)
	tagService := service.NewTagService(tagRepo)
	pageService := service.NewPageService(pageRepo)

	// 初始化处理器
	authHandler := handler.NewAuthHandler(authService)
	ownerHandler := handler.NewOwnerHandler(ownerService)
	githubHandler := handler.NewGitHubHandler(githubService, cfg)
	articleHandler := handler.NewArticleHandler(articleService)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	tagHandler := handler.NewTagHandler(tagService)
	sitemapHandler := handler.NewSitemapHandler(articleService, categoryService, tagService, pageService, cfg)
	pageHandler := handler.NewPageHandler(pageService)

	// 设置路由
	appRouter := router.NewRouter(
		authHandler,
		articleHandler,
		categoryHandler,
		tagHandler,
		ownerHandler,
		githubHandler,
		authService,
		sitemapHandler,
		pageHandler,
	)
	r := appRouter.Setup(cfg.ServerMode())

	// 创建 HTTP 服务器
	srv := &http.Server{
		Addr:    ":" + cfg.ServerPort(),
		Handler: r,
	}

	// 优雅关闭设置
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// 在 goroutine 中启动服务器
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal().Err(err).Msg("服务器启动失败")
		}
	}()

	logger.Info().Msg("服务器启动成功")

	// 等待中断信号
	sig := <-quit
	logger.Info().Str("signal", sig.String()).Msg("正在关闭服务器")

	// 给未完成的请求 30 秒时间完成
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// 关闭服务器
	if err := srv.Shutdown(ctx); err != nil {
		logger.Error().Err(err).Msg("服务器关闭错误")
	}

	// 关闭数据库连接
	if err := database.Close(db); err != nil {
		logger.Error().Err(err).Msg("数据库关闭错误")
	}

	logger.Info().Msg("服务器已停止")
}
