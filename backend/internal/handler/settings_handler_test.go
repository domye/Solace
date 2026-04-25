package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"gin-quickstart/internal/service"
	"github.com/gin-gonic/gin"
)

type fakeSettingsService struct {
	settings service.ImageSettings
	err      error
}

func (s *fakeSettingsService) GetImageSettings(ctx context.Context) (*service.ImageSettings, error) {
	if s.err != nil {
		return nil, s.err
	}
	return &s.settings, nil
}

func (s *fakeSettingsService) UpdateImageSettings(ctx context.Context, settings service.ImageSettings) (*service.ImageSettings, error) {
	if s.err != nil {
		return nil, s.err
	}
	s.settings = settings
	return &s.settings, nil
}

func TestSettingsHandlerGetImageSettings(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewSettingsHandler(&fakeSettingsService{settings: service.ImageSettings{
		DefaultWidth:              480,
		MaxWidth:                  900,
		AppendWidthToPastedImages: false,
	}})
	router := gin.New()
	router.GET("/settings/images", handler.GetImageSettings)
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/settings/images", nil)

	router.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("response status = %d, want %d", response.Code, http.StatusOK)
	}
	var payload Response
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("json.Unmarshal() error = %v", err)
	}
	data, ok := payload.Data.(map[string]interface{})
	if !ok {
		t.Fatalf("payload data = %#v, want object", payload.Data)
	}
	if data["defaultWidth"] != float64(480) || data["maxWidth"] != float64(900) || data["appendWidthToPastedImages"] != false {
		t.Fatalf("payload data = %#v", data)
	}
}

func TestSettingsHandlerUpdateImageSettings(t *testing.T) {
	gin.SetMode(gin.TestMode)
	settingsService := &fakeSettingsService{}
	handler := NewSettingsHandler(settingsService)
	router := gin.New()
	router.PUT("/settings/images", handler.UpdateImageSettings)
	body := bytes.NewBufferString(`{"defaultWidth":640,"maxWidth":1200,"appendWidthToPastedImages":true}`)
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPut, "/settings/images", body)
	request.Header.Set("Content-Type", "application/json")

	router.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("response status = %d, want %d; body = %q", response.Code, http.StatusOK, response.Body.String())
	}
	if settingsService.settings.DefaultWidth != 640 || settingsService.settings.MaxWidth != 1200 || !settingsService.settings.AppendWidthToPastedImages {
		t.Fatalf("saved settings = %+v", settingsService.settings)
	}
}

func TestSettingsHandlerRejectsInvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewSettingsHandler(&fakeSettingsService{})
	router := gin.New()
	router.PUT("/settings/images", handler.UpdateImageSettings)
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPut, "/settings/images", bytes.NewBufferString(`{"defaultWidth":`))
	request.Header.Set("Content-Type", "application/json")

	router.ServeHTTP(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("response status = %d, want %d", response.Code, http.StatusBadRequest)
	}
}

func TestSettingsHandlerRejectsUnknownFields(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewSettingsHandler(&fakeSettingsService{})
	router := gin.New()
	router.PUT("/settings/images", handler.UpdateImageSettings)
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPut, "/settings/images", bytes.NewBufferString(`{"defaultWidth":640,"maxWidth":1200,"appendWidthToPastedImages":true,"unknown":1}`))
	request.Header.Set("Content-Type", "application/json")

	router.ServeHTTP(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("response status = %d, want %d", response.Code, http.StatusBadRequest)
	}
}
