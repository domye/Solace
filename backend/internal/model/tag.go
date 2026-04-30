package model

import (
	"time"

	"gorm.io/gorm"
)

// Tag 标签实体
type Tag struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	Name      string         `gorm:"type:varchar(50);not null" json:"name"`
	Slug      string         `gorm:"type:varchar(50);uniqueIndex;not null" json:"slug"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations 关联关系
	Articles []Article `gorm:"many2many:article_tags;" json:"articles,omitempty"`
}

// TableName 返回标签表名
func (Tag) TableName() string {
	return "tags"
}

// TagWithCount 标签带文章数统计
type TagWithCount struct {
	ID           uint   `json:"id"`
	Name         string `json:"name"`
	Slug         string `json:"slug"`
	ArticleCount int    `json:"article_count"`
}

// ArticleTag 文章-标签关联表
type ArticleTag struct {
	ArticleID uint `gorm:"primaryKey;autoIncrement:false;index:idx_article_id;index:idx_tag_id" json:"article_id"`
	TagID     uint `gorm:"primaryKey;autoIncrement:false;index:idx_tag_id;index:idx_article_id" json:"tag_id"`
}

// TableName 返回关联表名
func (ArticleTag) TableName() string {
	return "article_tags"
}
