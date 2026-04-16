package model

import (
	"time"

	"gorm.io/gorm"
)

// Page 页面实体（独立于文章，支持多种模板类型）
type Page struct {
	ID         uint           `gorm:"primarykey" json:"id"`
	Title      string         `gorm:"type:varchar(200);not null" json:"title"`
	Slug       string         `gorm:"type:varchar(200);uniqueIndex;not null" json:"slug"`
	Template   string         `gorm:"type:varchar(50);default:'default';index" json:"template"` // default, about, projects, footprints
	Content    string         `gorm:"type:text" json:"content"`                                 // Markdown + YAML frontmatter
	Summary    string         `gorm:"type:varchar(500)" json:"summary,omitempty"`
	CoverImage string         `gorm:"type:varchar(500)" json:"cover_image,omitempty"`
	Status     string         `gorm:"type:varchar(20);default:'draft';index" json:"status"` // draft, published
	Order      int            `gorm:"column:page_order;default:0;index" json:"order"`       // 导航排序（使用 page_order 避免 PostgreSQL 保留字）
	ShowInNav  bool           `gorm:"default:true" json:"show_in_nav"`                      // 是否显示在导航
	Version    int            `gorm:"default:1" json:"version"`                             // 乐观锁版本号
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName 返回页面表名
func (Page) TableName() string {
	return "pages"
}

// 模板类型常量
const (
	TemplateDefault    = "default"    // 普通 Markdown 页面
	TemplateAbout      = "about"      // 关于我（时间线）
	TemplateProjects   = "projects"   // 项目展示
	TemplateFootprints = "footprints" // 我的足迹
)

// 页面状态常量
const (
	PageStatusDraft     = "draft"
	PageStatusPublished = "published"
)

// IsPublished 返回页面是否已发布
func (p *Page) IsPublished() bool {
	return p.Status == PageStatusPublished
}

// Publish 将页面设置为已发布状态
func (p *Page) Publish() {
	p.Status = PageStatusPublished
}
