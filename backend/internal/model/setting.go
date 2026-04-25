package model

import (
	"encoding/json"
	"time"
)

type Setting struct {
	Key       string          `gorm:"primaryKey;type:text" json:"key"`
	Value     json.RawMessage `gorm:"type:jsonb;not null" json:"value"`
	UpdatedAt time.Time       `json:"updated_at"`
}

func (Setting) TableName() string {
	return "settings"
}
