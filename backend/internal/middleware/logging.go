package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"strings"
	"time"

	"gin-quickstart/internal/pkg/logger"
	"github.com/gin-gonic/gin"
)

// bodyLogWriter 响应体捕获写入器
type bodyLogWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *bodyLogWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func (w *bodyLogWriter) WriteString(s string) (int, error) {
	w.body.WriteString(s)
	return w.ResponseWriter.WriteString(s)
}

// LoggingConfig 日志中间件配置
type LoggingConfig struct {
	SlowThreshold   time.Duration // 慢请求阈值
	LogRequestBody  bool          // 是否记录请求体
	LogResponseBody bool          // 是否记录响应体
	SkipPaths       []string      // 跳过日志的路径
	MaxBodySize     int           // 最大记录体大小
	SensitiveFields []string      // 敏感字段列表（自动脱敏）
}

// 默认日志配置
var defaultLoggingConfig = LoggingConfig{
	SlowThreshold:   time.Second,
	LogRequestBody:  true,
	LogResponseBody: false,
	SkipPaths:       []string{"/health", "/metrics", "/swagger"},
	MaxBodySize:     4096,
	SensitiveFields: []string{"password", "token", "secret", "authorization", "refresh_token"},
}

// Logging 使用默认配置的日志中间件
func Logging() gin.HandlerFunc {
	return LoggingWithConfig(defaultLoggingConfig)
}

// LoggingWithConfig 使用自定义配置的日志中间件
func LoggingWithConfig(cfg LoggingConfig) gin.HandlerFunc {
	// 构建跳过路径的 map 便于快速查找
	skipMap := make(map[string]bool)
	for _, path := range cfg.SkipPaths {
		skipMap[path] = true
	}

	return func(c *gin.Context) {
		path := c.Request.URL.Path

		// 跳过不需要日志的路径
		if skipMap[path] || strings.HasPrefix(path, "/swagger/") {
			c.Next()
			return
		}

		start := time.Now()
		method := c.Request.Method

		var requestBody []byte
		if shouldLogRequestBody(c, cfg) {
			requestBody, _ = io.ReadAll(io.LimitReader(c.Request.Body, int64(cfg.MaxBodySize)))
			c.Request.Body = io.NopCloser(io.MultiReader(bytes.NewReader(requestBody), c.Request.Body))
		}

		var responseBody *bytes.Buffer
		if cfg.LogResponseBody {
			responseBody = bytes.NewBufferString("")
			c.Writer = &bodyLogWriter{body: responseBody, ResponseWriter: c.Writer}
		}

		log := logger.FromGinContext(c)

		// 记录请求开始
		log.Info().
			Str("method", method).
			Str("path", path).
			Str("client_ip", c.ClientIP()).
			Str("query", c.Request.URL.RawQuery).
			Interface("body", sanitizeBody(requestBody, cfg.SensitiveFields)).
			Msg("请求开始")

		c.Next()

		// 计算请求耗时
		duration := time.Since(start)
		status := c.Writer.Status()

		// 根据状态码选择日志级别
		event := log.Info()
		if status >= 400 {
			event = log.Warn()
		}
		if status >= 500 {
			event = log.Error()
		}

		event = event.
			Str("method", method).
			Str("path", path).
			Int("status", status).
			Dur("duration_ms", duration).
			Int("response_size", c.Writer.Size())

		if responseBody != nil && responseBody.Len() > 0 && responseBody.Len() < cfg.MaxBodySize {
			event = event.Interface("response", sanitizeResponseBody(responseBody.Bytes()))
		}

		event.Msg("请求完成")

		// 慢请求告警
		if duration > cfg.SlowThreshold {
			log.Warn().
				Str("method", method).
				Str("path", path).
				Dur("duration_ms", duration).
				Dur("threshold", cfg.SlowThreshold).
				Int("status", status).
				Msg("慢请求告警")
		}
	}
}

// sanitizeBody 处理请求体，脱敏敏感字段
func shouldLogRequestBody(c *gin.Context, cfg LoggingConfig) bool {
	if !cfg.LogRequestBody || c.Request.Body == nil || cfg.MaxBodySize <= 0 {
		return false
	}
	return !strings.HasPrefix(strings.ToLower(c.GetHeader("Content-Type")), "multipart/form-data")
}

func sanitizeBody(body []byte, sensitiveFields []string) interface{} {
	if len(body) == 0 {
		return nil
	}

	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		// 非 JSON 格式，直接返回字符串
		if len(body) > 200 {
			return string(body[:200]) + "..."
		}
		return string(body)
	}

	return maskSensitiveFields(data, sensitiveFields)
}

// sanitizeResponseBody 处理响应体
func sanitizeResponseBody(body []byte) interface{} {
	if len(body) == 0 {
		return nil
	}

	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		if len(body) > 200 {
			return string(body[:200]) + "..."
		}
		return string(body)
	}

	return data
}

// maskSensitiveFields 脱敏敏感字段
func maskSensitiveFields(data map[string]interface{}, sensitiveFields []string) map[string]interface{} {
	result := make(map[string]interface{})
	for k, v := range data {
		if isSensitiveField(k, sensitiveFields) {
			result[k] = "***"
		} else {
			result[k] = v
		}
	}
	return result
}

// isSensitiveField 判断是否为敏感字段
func isSensitiveField(field string, sensitiveFields []string) bool {
	fieldLower := strings.ToLower(field)
	for _, sf := range sensitiveFields {
		if strings.Contains(fieldLower, strings.ToLower(sf)) {
			return true
		}
	}
	return false
}
