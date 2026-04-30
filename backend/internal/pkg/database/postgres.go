package database

import (
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

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

func Close(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}