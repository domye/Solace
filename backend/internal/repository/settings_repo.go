package repository

import (
	"context"
	"errors"
	"fmt"

	"gin-quickstart/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var ErrSettingNotFound = errors.New("setting not found")

type settingsRepo struct {
	db *gorm.DB
}

func NewSettingsRepository(db *gorm.DB) SettingsRepository {
	return &settingsRepo{db: db}
}

func (r *settingsRepo) EnsureTable(ctx context.Context) error {
	if err := r.db.WithContext(ctx).AutoMigrate(&model.Setting{}); err != nil {
		return fmt.Errorf("ensure settings table: %w", err)
	}
	return nil
}

func (r *settingsRepo) FindByKey(ctx context.Context, key string) (*model.Setting, error) {
	var setting model.Setting
	if err := r.db.WithContext(ctx).First(&setting, "key = ?", key).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSettingNotFound
		}
		return nil, fmt.Errorf("find setting by key %q: %w", key, err)
	}
	return &setting, nil
}

func (r *settingsRepo) Upsert(ctx context.Context, setting *model.Setting) error {
	if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "key"}},
		DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
	}).Create(setting).Error; err != nil {
		return fmt.Errorf("upsert setting key %q: %w", setting.Key, err)
	}
	return nil
}
