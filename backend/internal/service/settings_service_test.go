package service

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"gin-quickstart/internal/model"
	"gin-quickstart/internal/repository"
)

type fakeSettingsRepository struct {
	setting *model.Setting
	err     error
}

func (r *fakeSettingsRepository) EnsureTable(ctx context.Context) error {
	return nil
}

func (r *fakeSettingsRepository) FindByKey(ctx context.Context, key string) (*model.Setting, error) {
	if r.err != nil {
		return nil, r.err
	}
	if r.setting == nil {
		return nil, repository.ErrSettingNotFound
	}
	return r.setting, nil
}

func (r *fakeSettingsRepository) Upsert(ctx context.Context, setting *model.Setting) error {
	if r.err != nil {
		return r.err
	}
	copy := *setting
	r.setting = &copy
	return nil
}

func TestImageSettingsDefaultsWhenMissing(t *testing.T) {
	service := NewSettingsService(&fakeSettingsRepository{})

	settings, err := service.GetImageSettings(context.Background())
	if err != nil {
		t.Fatalf("GetImageSettings() error = %v", err)
	}

	if settings.DefaultWidth != 720 {
		t.Fatalf("DefaultWidth = %d, want %d", settings.DefaultWidth, 720)
	}
	if settings.MaxWidth != 1000 {
		t.Fatalf("MaxWidth = %d, want %d", settings.MaxWidth, 1000)
	}
	if !settings.AppendWidthToPastedImages {
		t.Fatal("AppendWidthToPastedImages = false, want true")
	}
}

func TestImageSettingsLoadsPersistedValue(t *testing.T) {
	value, err := json.Marshal(ImageSettings{
		DefaultWidth:              480,
		MaxWidth:                  900,
		AppendWidthToPastedImages: false,
	})
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}
	service := NewSettingsService(&fakeSettingsRepository{
		setting: &model.Setting{Key: ImageSettingsKey, Value: value},
	})

	settings, err := service.GetImageSettings(context.Background())
	if err != nil {
		t.Fatalf("GetImageSettings() error = %v", err)
	}

	if settings.DefaultWidth != 480 || settings.MaxWidth != 900 || settings.AppendWidthToPastedImages {
		t.Fatalf("settings = %+v, want default 480 max 900 append false", settings)
	}
}

func TestUpdateImageSettingsPersistsValidValue(t *testing.T) {
	repo := &fakeSettingsRepository{}
	service := NewSettingsService(repo)

	settings, err := service.UpdateImageSettings(context.Background(), ImageSettings{
		DefaultWidth:              640,
		MaxWidth:                  1200,
		AppendWidthToPastedImages: true,
	})
	if err != nil {
		t.Fatalf("UpdateImageSettings() error = %v", err)
	}

	if settings.DefaultWidth != 640 || settings.MaxWidth != 1200 || !settings.AppendWidthToPastedImages {
		t.Fatalf("settings = %+v, want default 640 max 1200 append true", settings)
	}
	if repo.setting == nil || repo.setting.Key != ImageSettingsKey {
		t.Fatalf("saved setting = %+v, want key %q", repo.setting, ImageSettingsKey)
	}
}

func TestUpdateImageSettingsRejectsInvalidWidths(t *testing.T) {
	tests := []struct {
		name     string
		settings ImageSettings
	}{
		{
			name:     "default too small",
			settings: ImageSettings{DefaultWidth: 99, MaxWidth: 1000, AppendWidthToPastedImages: true},
		},
		{
			name:     "max too large",
			settings: ImageSettings{DefaultWidth: 720, MaxWidth: 2001, AppendWidthToPastedImages: true},
		},
		{
			name:     "default greater than max",
			settings: ImageSettings{DefaultWidth: 1000, MaxWidth: 720, AppendWidthToPastedImages: true},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := NewSettingsService(&fakeSettingsRepository{})

			if _, err := service.UpdateImageSettings(context.Background(), tt.settings); err == nil {
				t.Fatal("UpdateImageSettings() error = nil, want error")
			}
		})
	}
}

func TestImageSettingsRepositoryErrorsPropagate(t *testing.T) {
	wantErr := errors.New("database unavailable")
	service := NewSettingsService(&fakeSettingsRepository{err: wantErr})

	if _, err := service.GetImageSettings(context.Background()); !errors.Is(err, wantErr) {
		t.Fatalf("GetImageSettings() error = %v, want %v", err, wantErr)
	}
}
