package database

import (
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"gin-quickstart/internal/model"
	"gin-quickstart/internal/pkg/logger"
)

func Connect(dsn string, logLevel string) (*gorm.DB, error) {
	gormLogLevel := parseGormLogLevel(logLevel)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormLogLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("数据库连接失败: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("获取 sql.DB 失败: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	if err := autoMigrate(db); err != nil {
		return nil, fmt.Errorf("数据库迁移失败: %w", err)
	}

	logger.Info().Msg("数据库连接成功")

	dbStats, err := db.DB()
	if err == nil {
		stats := dbStats.Stats()
		logger.Info().
			Int("open_connections", stats.OpenConnections).
			Int("in_use", stats.InUse).
			Int("idle", stats.Idle).
			Msg("连接池状态")
	}

	return db, nil
}

func autoMigrate(db *gorm.DB) error {
	if err := db.AutoMigrate(&model.ArticleTag{}); err != nil {
		return err
	}

	indexes := []struct {
		name  string
		sql   string
		table string
	}{
		{
			name:  "idx_article_tags_tag_id",
			sql:   "CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags(tag_id)",
			table: "article_tags",
		},
		{
			name:  "idx_article_tags_article_id",
			sql:   "CREATE INDEX IF NOT EXISTS idx_article_tags_article_id ON article_tags(article_id)",
			table: "article_tags",
		},
		{
			name:  "idx_articles_status_published",
			sql:   "CREATE INDEX IF NOT EXISTS idx_articles_status_published ON articles(status, published_at DESC) WHERE deleted_at IS NULL",
			table: "articles",
		},
		{
			name:  "idx_articles_status_top",
			sql:   "CREATE INDEX IF NOT EXISTS idx_articles_status_top ON articles(status, is_top DESC, published_at DESC) WHERE deleted_at IS NULL",
			table: "articles",
		},
		{
			name:  "idx_articles_status_top_v2",
			sql:   "CREATE INDEX IF NOT EXISTS idx_articles_status_top_v2 ON articles(deleted_at, status, is_top DESC, published_at DESC)",
			table: "articles",
		},
		{
			name:  "idx_articles_category_published",
			sql:   "CREATE INDEX IF NOT EXISTS idx_articles_category_published ON articles(category_id) WHERE deleted_at IS NULL AND status = 'published'",
			table: "articles",
		},
		{
			name:  "idx_categories_sort",
			sql:   "CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order, name) WHERE deleted_at IS NULL",
			table: "categories",
		},
	}

	for _, idx := range indexes {
		var exists int
		err := db.Raw(`
			SELECT 1 FROM pg_indexes 
			WHERE indexname = ? AND tablename = ?
		`, idx.name, idx.table).Scan(&exists).Error

		if err != nil {
			return err
		}

		if exists == 0 {
			if err := db.Exec(idx.sql).Error; err != nil {
				logger.Warn().Err(err).Str("index", idx.name).Msg("创建索引失败")
			} else {
				logger.Info().Str("index", idx.name).Msg("索引创建成功")
			}
		}
	}

	if err := db.Exec("VACUUM ANALYZE articles, article_tags, tags, categories").Error; err != nil {
		logger.Warn().Err(err).Msg("VACUUM ANALYZE 失败")
	}

	return nil
}

func parseGormLogLevel(level string) gormlogger.LogLevel {
	switch level {
	case "debug":
		return gormlogger.Info
	case "info":
		return gormlogger.Warn
	case "warn", "error":
		return gormlogger.Error
	default:
		return gormlogger.Warn
	}
}

// Close 关闭数据库连接
func Close(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}