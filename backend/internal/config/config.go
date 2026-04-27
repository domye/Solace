package config

import (
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	"gin-quickstart/internal/pkg/hash"
	"github.com/BurntSushi/toml"
)

// Config 应用配置结构体
type Config struct {
	Server    ServerConfig    `toml:"server"`
	Database  DatabaseConfig  `toml:"database"`
	JWT       JWTConfig       `toml:"jwt"`
	Logging   LoggingConfig   `toml:"logging"`
	Migration MigrationConfig `toml:"migration"`
	Admin     AdminConfig     `toml:"admin"`
	GitHub    GitHubConfig    `toml:"github"`
	Site      SiteConfig      `toml:"site"`
	Upload    UploadConfig    `toml:"upload"`

	// 缓存的密码哈希
	adminPasswordHash string
	once              sync.Once
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port            string   `toml:"port"`
	Mode            string   `toml:"mode"`              // debug, release, test
	AllowedOrigins  []string `toml:"allowed_origins"`   // CORS 允许的域名列表
	RateLimit       int      `toml:"rate_limit"`        // 每分钟请求限制，0 表示不限制
	SearchRateLimit int      `toml:"search_rate_limit"` // 搜索接口每分钟限制
	EnableSwagger   bool     `toml:"enable_swagger"`    // 是否启用 Swagger 文档
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Host     string `toml:"host"`
	Port     string `toml:"port"`
	User     string `toml:"user"`
	Password string `toml:"password"`
	Name     string `toml:"name"`
	SSLMode  string `toml:"sslmode"`
}

// JWTConfig JWT 令牌配置
type JWTConfig struct {
	Secret          string `toml:"secret"`
	AccessDuration  int    `toml:"access_duration"`  // 分钟
	RefreshDuration int    `toml:"refresh_duration"` // 分钟
}

// LoggingConfig 日志配置
type LoggingConfig struct {
	Level      string `toml:"level"`       // trace, debug, info, warn, error, fatal, panic
	Env        string `toml:"env"`         // development, production
	OutputFile string `toml:"output_file"` // 日志文件路径，空则不输出到文件
	MaxSize    int    `toml:"max_size"`    // 单文件最大 MB
	MaxBackups int    `toml:"max_backups"` // 保留旧文件数
	MaxAge     int    `toml:"max_age"`     // 保留天数
	Compress   bool   `toml:"compress"`    // 压缩旧文件
}

// MigrationConfig 迁移配置
type MigrationConfig struct {
	Path string `toml:"path"`
}

// AdminConfig 管理员（站长）配置
type AdminConfig struct {
	Username  string `toml:"username"`
	Email     string `toml:"email"`
	Password  string `toml:"password"`
	Nickname  string `toml:"nickname"`
	AvatarURL string `toml:"avatar_url"`
	Bio       string `toml:"bio"`
	GitHub    string `toml:"github"`
	Bilibili  string `toml:"bilibili"`
	X         string `toml:"x"`
}

// GitHubConfig GitHub API 配置
type GitHubConfig struct {
	Token    string `toml:"token"`
	Username string `toml:"username"`
}

// SiteConfig 站点配置
type SiteConfig struct {
	BaseURL string `toml:"base_url"` // 站点基础 URL，如 https://example.com
}

type UploadConfig struct {
	Dir    string       `toml:"dir"`
	ImgBed ImgBedConfig `toml:"imgbed"`
}

type ImgBedConfig struct {
	Endpoint       string `toml:"endpoint"`
	Token          string `toml:"token"`
	Field          string `toml:"field"`
	UploadFolder   string `toml:"upload_folder"`
	DeleteEndpoint string `toml:"delete_endpoint"`
	DeleteToken    string `toml:"delete_token"`
}

// Load 从 TOML 文件加载配置
func Load() *Config {
	configPath := getConfigPath()

	var cfg Config
	if _, err := toml.DecodeFile(configPath, &cfg); err != nil {
		panic(fmt.Sprintf("无法加载配置文件 %s: %v", configPath, err))
	}

	return &cfg
}

// getConfigPath 获取配置文件路径
// 优先级：CONFIG_PATH 环境变量 > 默认 config.toml
func getConfigPath() string {
	if path := os.Getenv("CONFIG_PATH"); path != "" {
		return path
	}
	return "config.toml"
}

// GetDSN 返回数据库连接字符串
func (c *Config) GetDSN() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.Database.Host,
		c.Database.Port,
		c.Database.User,
		c.Database.Password,
		c.Database.Name,
		c.Database.SSLMode,
	)
}

// GetJWTAccessDuration 返回 Access Token 有效期
func (c *Config) GetJWTAccessDuration() time.Duration {
	return time.Duration(c.JWT.AccessDuration) * time.Minute
}

// GetJWTRefreshDuration 返回 Refresh Token 有效期
func (c *Config) GetJWTRefreshDuration() time.Duration {
	return time.Duration(c.JWT.RefreshDuration) * time.Minute
}

// GetAdminPasswordHash 返回管理员密码哈希（缓存）
func (c *Config) GetAdminPasswordHash() string {
	c.once.Do(func() {
		hashed, err := hash.HashPassword(c.Admin.Password)
		if err != nil {
			panic(fmt.Sprintf("无法哈希管理员密码: %v", err))
		}
		c.adminPasswordHash = hashed
	})
	return c.adminPasswordHash
}

// Server 配置访问器
func (c *Config) ServerPort() string       { return c.Server.Port }
func (c *Config) ServerMode() string       { return c.Server.Mode }
func (c *Config) AllowedOrigins() []string { return c.Server.AllowedOrigins }
func (c *Config) RateLimit() int           { return c.Server.RateLimit }
func (c *Config) SearchRateLimit() int     { return c.Server.SearchRateLimit }
func (c *Config) EnableSwagger() bool      { return c.Server.EnableSwagger }

// Logging 配置访问器
func (c *Config) LogLevel() string      { return c.Logging.Level }
func (c *Config) LogEnv() string        { return c.Logging.Env }
func (c *Config) LogOutputFile() string { return c.Logging.OutputFile }
func (c *Config) LogMaxSize() int       { return c.Logging.MaxSize }
func (c *Config) LogMaxBackups() int    { return c.Logging.MaxBackups }
func (c *Config) LogMaxAge() int        { return c.Logging.MaxAge }
func (c *Config) LogCompress() bool     { return c.Logging.Compress }

// JWT 配置访问器
func (c *Config) JWTSecret() string                 { return c.JWT.Secret }
func (c *Config) JWTAccessDuration() time.Duration  { return c.GetJWTAccessDuration() }
func (c *Config) JWTRefreshDuration() time.Duration { return c.GetJWTRefreshDuration() }

// Migration 配置访问器
func (c *Config) MigrationPath() string { return c.Migration.Path }

// Admin 配置访问器
func (c *Config) AdminUsername() string     { return c.Admin.Username }
func (c *Config) AdminEmail() string        { return c.Admin.Email }
func (c *Config) AdminPassword() string     { return c.Admin.Password }
func (c *Config) AdminNickname() string     { return c.Admin.Nickname }
func (c *Config) AdminAvatarURL() string    { return c.Admin.AvatarURL }
func (c *Config) AdminBio() string          { return c.Admin.Bio }
func (c *Config) AdminGitHub() string       { return c.Admin.GitHub }
func (c *Config) AdminBilibili() string     { return c.Admin.Bilibili }
func (c *Config) AdminX() string            { return c.Admin.X }
func (c *Config) AdminPasswordHash() string { return c.GetAdminPasswordHash() }

// GitHub 配置访问器
func (c *Config) GitHubToken() string    { return c.GitHub.Token }
func (c *Config) GitHubUsername() string { return c.GitHub.Username }

// Site 配置访问器
func (c *Config) SiteBaseURL() string { return c.Site.BaseURL }

func (c *Config) UploadDir() string {
	if value := strings.TrimSpace(os.Getenv("UPLOAD_DIR")); value != "" {
		return value
	}
	if value := strings.TrimSpace(c.Upload.Dir); value != "" {
		return value
	}
	return "uploads"
}

func (c *Config) ImgBedEndpoint() string {
	if value := strings.TrimSpace(os.Getenv("IMGBED_ENDPOINT")); value != "" {
		return value
	}
	return strings.TrimSpace(c.Upload.ImgBed.Endpoint)
}

func (c *Config) ImgBedToken() string {
	if value := strings.TrimSpace(os.Getenv("IMGBED_TOKEN")); value != "" {
		return value
	}
	return strings.TrimSpace(c.Upload.ImgBed.Token)
}

func (c *Config) ImgBedField() string {
	if value := strings.TrimSpace(os.Getenv("IMGBED_FIELD")); value != "" {
		return value
	}
	if value := strings.TrimSpace(c.Upload.ImgBed.Field); value != "" {
		return value
	}
	return "file"
}

func (c *Config) ImgBedUploadFolder() string {
	if value := strings.TrimSpace(os.Getenv("IMGBED_UPLOAD_FOLDER")); value != "" {
		return value
	}
	return strings.TrimSpace(c.Upload.ImgBed.UploadFolder)
}

func (c *Config) ImgBedDeleteEndpoint() string {
	if value := strings.TrimSpace(os.Getenv("IMGBED_DELETE_ENDPOINT")); value != "" {
		return value
	}
	if value := strings.TrimSpace(c.Upload.ImgBed.DeleteEndpoint); value != "" {
		return value
	}
	return strings.TrimSpace(c.Upload.ImgBed.Endpoint)
}

func (c *Config) ImgBedDeleteToken() string {
	if value := strings.TrimSpace(os.Getenv("IMGBED_DELETE_TOKEN")); value != "" {
		return value
	}
	if value := strings.TrimSpace(c.Upload.ImgBed.DeleteToken); value != "" {
		return value
	}
	return strings.TrimSpace(c.Upload.ImgBed.Token)
}
