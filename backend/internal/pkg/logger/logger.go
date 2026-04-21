package logger

import (
	"context"
	"io"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"gopkg.in/natefinch/lumberjack.v2"
)

var Log zerolog.Logger

// Config 日志配置
type Config struct {
	Level      string // 日志级别: debug, info, warn, error, fatal
	Env        string // 运行环境: development, production
	OutputFile string // 日志文件路径，空则不输出到文件
	MaxSize    int    // 单文件最大 MB
	MaxBackups int    // 保留旧文件数
	MaxAge     int    // 保留天数
	Compress   bool   // 是否压缩旧文件
}

// Init 初始化全局日志器
func Init(cfg Config) {
	var writers []io.Writer

	// 始终输出到控制台
	writers = append(writers, os.Stdout)

	// 配置文件输出
	if cfg.OutputFile != "" {
		fileWriter := &lumberjack.Logger{
			Filename:   cfg.OutputFile,
			MaxSize:    cfg.MaxSize,
			MaxBackups: cfg.MaxBackups,
			MaxAge:     cfg.MaxAge,
			Compress:   cfg.Compress,
		}
		writers = append(writers, fileWriter)
	}

	var output io.Writer = io.MultiWriter(writers...)

	// 开发环境使用美化输出
	if cfg.Env == "development" {
		consoleWriter := zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339,
		}
		if cfg.OutputFile != "" {
			output = io.MultiWriter(consoleWriter, &lumberjack.Logger{
				Filename:   cfg.OutputFile,
				MaxSize:    cfg.MaxSize,
				MaxBackups: cfg.MaxBackups,
				MaxAge:     cfg.MaxAge,
				Compress:   cfg.Compress,
			})
		} else {
			output = consoleWriter
		}
	}

	l := parseLevel(cfg.Level)

	Log = zerolog.New(output).
		With().
		Timestamp().
		Caller().
		Logger().
		Level(l)
}

// parseLevel 解析日志级别字符串
func parseLevel(level string) zerolog.Level {
	switch strings.ToLower(level) {
	case "debug":
		return zerolog.DebugLevel
	case "info":
		return zerolog.InfoLevel
	case "warn":
		return zerolog.WarnLevel
	case "error":
		return zerolog.ErrorLevel
	case "fatal":
		return zerolog.FatalLevel
	default:
		return zerolog.InfoLevel
	}
}

// 辅助函数
func Info() *zerolog.Event  { return Log.Info() }
func Warn() *zerolog.Event  { return Log.Warn() }
func Error() *zerolog.Event { return Log.Error() }
func Debug() *zerolog.Event { return Log.Debug() }
func Fatal() *zerolog.Event { return Log.Fatal() }

type ctxKey struct{}

// WithContext 从上下文获取日志器
func WithContext(ctx context.Context) *zerolog.Logger {
	if l, ok := ctx.Value(ctxKey{}).(*zerolog.Logger); ok {
		return l
	}
	return &Log
}

// NewContext 创建带日志器的上下文
func NewContext(ctx context.Context, logger *zerolog.Logger) context.Context {
	return context.WithValue(ctx, ctxKey{}, logger)
}

// FromGinContext 从 gin.Context 获取带请求信息的日志器
func FromGinContext(c *gin.Context) *zerolog.Logger {
	requestID := c.GetString("request_id")
	userID, _ := c.Get("user_id")

	logger := Log.With().
		Str("request_id", requestID)

	// 如果有用户 ID 则添加
	if uid, ok := userID.(uint); ok && uid > 0 {
		logger = logger.Uint("user_id", uid)
	}

	l := logger.Logger()
	return &l
}

// WithRequestID 创建带请求 ID 的日志器
func WithRequestID(requestID string) *zerolog.Logger {
	l := Log.With().Str("request_id", requestID).Logger()
	return &l
}

// WithUserID 创建带用户 ID 的日志器
func WithUserID(userID uint) *zerolog.Logger {
	l := Log.With().Uint("user_id", userID).Logger()
	return &l
}

// WithFields 创建带自定义字段的日志器
func WithFields(fields map[string]interface{}) *zerolog.Logger {
	event := Log.With()
	for k, v := range fields {
		switch val := v.(type) {
		case string:
			event = event.Str(k, val)
		case int:
			event = event.Int(k, val)
		case int64:
			event = event.Int64(k, val)
		case uint:
			event = event.Uint(k, val)
		case float64:
			event = event.Float64(k, val)
		case bool:
			event = event.Bool(k, val)
		case time.Duration:
			event = event.Dur(k, val)
		default:
			event = event.Interface(k, val)
		}
	}
	l := event.Logger()
	return &l
}
