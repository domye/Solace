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
	CategoryID  *uint          `gorm:"index:idx_category_status,priority:1;index" json:"category_id,omitempty"`
	Status      string         `gorm:"type:varchar(20);default:draft;index:idx_status_published,priority:1;index:idx_category_status,priority:2;index:idx_status_deleted" json:"status"`
	IsTop       bool           `gorm:"default:false;index:idx_top_published" json:"is_top"`
	Version     int            `gorm:"default:1" json:"version"`
	PublishedAt *time.Time     `gorm:"index:idx_status_published,priority:2;index:idx_top_published,priority:2" json:"published_at,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

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
