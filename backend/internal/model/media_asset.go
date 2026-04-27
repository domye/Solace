package model

import "time"

type MediaAsset struct {
	ID           uint      `gorm:"primarykey" json:"id"`
	Provider     string    `gorm:"type:varchar(32);not null;index" json:"provider"`
	FileID       string    `gorm:"type:varchar(500);not null;uniqueIndex" json:"file_id"`
	URL          string    `gorm:"type:varchar(1000);not null;uniqueIndex" json:"url"`
	OriginalName string    `gorm:"type:varchar(255)" json:"original_name,omitempty"`
	ContentType  string    `gorm:"type:varchar(255)" json:"content_type,omitempty"`
	Size         int64     `gorm:"default:0" json:"size"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (MediaAsset) TableName() string {
	return "media_assets"
}

type MediaAssetRef struct {
	ID           uint      `gorm:"primarykey" json:"id"`
	AssetID      uint      `gorm:"not null;index;uniqueIndex:uniq_media_asset_ref" json:"asset_id"`
	ResourceType string    `gorm:"type:varchar(32);not null;index;uniqueIndex:uniq_media_asset_ref" json:"resource_type"`
	ResourceID   uint      `gorm:"not null;index;uniqueIndex:uniq_media_asset_ref" json:"resource_id"`
	CreatedAt    time.Time `json:"created_at"`
}

func (MediaAssetRef) TableName() string {
	return "media_asset_refs"
}
