package service

import (
	"context"
	"encoding/json"
	stderrors "errors"
	"fmt"
	"time"

	"gin-quickstart/internal/model"
	apperrors "gin-quickstart/internal/pkg/errors"
	"gin-quickstart/internal/repository"
)

const ImageSettingsKey = "image_settings"

type ImageSettings struct {
	DefaultWidth              int  `json:"defaultWidth"`
	MaxWidth                  int  `json:"maxWidth"`
	AppendWidthToPastedImages bool `json:"appendWidthToPastedImages"`
}

type SettingsService interface {
	GetImageSettings(ctx context.Context) (*ImageSettings, error)
	UpdateImageSettings(ctx context.Context, settings ImageSettings) (*ImageSettings, error)
}

type settingsService struct {
	settingsRepo repository.SettingsRepository
}

func NewSettingsService(settingsRepo repository.SettingsRepository) SettingsService {
	return &settingsService{settingsRepo: settingsRepo}
}

func (s *settingsService) GetImageSettings(ctx context.Context) (*ImageSettings, error) {
	setting, err := s.settingsRepo.FindByKey(ctx, ImageSettingsKey)
	if err != nil {
		if stderrors.Is(err, repository.ErrSettingNotFound) {
			settings := defaultImageSettings()
			return &settings, nil
		}
		return nil, fmt.Errorf("get image settings: %w", err)
	}

	settings := defaultImageSettings()
	if err := json.Unmarshal(setting.Value, &settings); err != nil {
		return nil, fmt.Errorf("decode image settings: %w", err)
	}
	if err := validateImageSettings(settings); err != nil {
		return nil, fmt.Errorf("validate stored image settings: %w", err)
	}
	return &settings, nil
}

func (s *settingsService) UpdateImageSettings(ctx context.Context, settings ImageSettings) (*ImageSettings, error) {
	if err := validateImageSettings(settings); err != nil {
		return nil, err
	}

	value, err := json.Marshal(settings)
	if err != nil {
		return nil, fmt.Errorf("encode image settings: %w", err)
	}

	if err := s.settingsRepo.Upsert(ctx, &model.Setting{
		Key:       ImageSettingsKey,
		Value:     value,
		UpdatedAt: time.Now(),
	}); err != nil {
		return nil, fmt.Errorf("save image settings: %w", err)
	}

	return &settings, nil
}

func defaultImageSettings() ImageSettings {
	return ImageSettings{
		DefaultWidth:              720,
		MaxWidth:                  1000,
		AppendWidthToPastedImages: true,
	}
}

func validateImageSettings(settings ImageSettings) error {
	if settings.DefaultWidth < 100 || settings.DefaultWidth > 2000 {
		return apperrors.NewBadRequest("默认图片宽度必须在 100 到 2000 之间", nil)
	}
	if settings.MaxWidth < 100 || settings.MaxWidth > 2000 {
		return apperrors.NewBadRequest("最大图片宽度必须在 100 到 2000 之间", nil)
	}
	if settings.DefaultWidth > settings.MaxWidth {
		return apperrors.NewBadRequest("默认图片宽度不能大于最大图片宽度", nil)
	}
	return nil
}
