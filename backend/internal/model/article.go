package model

import (
	"time"

	"gorm.io/gorm"
)

// Article 文章实体
type Article struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	Title       string         `gorm:"type:varchar(200);not null" json:"title"`
	Slug        string         `gorm:"type:varchar(200);uniqueIndex;not null" json:"slug"`
	Content     string         `gorm:"type:text;not null" json:"content"`
	Summary     string         `gorm:"type:varchar(500)" json:"summary,omitempty"`
	CoverImage  string         `gorm:"type:varchar(500)" json:"cover_image,omitempty"`
	AuthorID    uint           `gorm:"not null;index" json:"author_id"`
	CategoryID  *uint          `gorm:"index" json:"category_id,omitempty"`
	Status      string         `gorm:"type:varchar(20);default:draft;index" json:"status"`
	IsTop       bool           `gorm:"default:false" json:"is_top"`
	Version     int            `gorm:"default:1" json:"version"` // 乐观锁版本号
	PublishedAt *time.Time     `json:"published_at,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations 关联关系
	Category *Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Tags     []Tag     `gorm:"many2many:article_tags;" json:"tags,omitempty"`
}

// TableName 返回文章表名
func (Article) TableName() string {
	return "articles"
}

// 文章状态常量
const (
	StatusDraft     = "draft"
	StatusPublished = "published"
)

// IsPublished 返回文章是否已发布
func (a *Article) IsPublished() bool {
	return a.Status == StatusPublished
}

// Publish 将文章设置为已发布状态
func (a *Article) Publish() {
	a.Status = StatusPublished
	now := time.Now()
	a.PublishedAt = &now
}

// IncrementVersion 递增版本号（用于乐观锁）
func (a *Article) IncrementVersion() {
	a.Version++
}
