package handler

import (
	"encoding/json"

	apperrors "gin-quickstart/internal/pkg/errors"
	"gin-quickstart/internal/service"
	"github.com/gin-gonic/gin"
)

type SettingsHandler struct {
	settingsService service.SettingsService
}

func NewSettingsHandler(settingsService service.SettingsService) *SettingsHandler {
	return &SettingsHandler{settingsService: settingsService}
}

func (h *SettingsHandler) GetImageSettings(c *gin.Context) {
	settings, err := h.settingsService.GetImageSettings(c.Request.Context())
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, settings)
}

func (h *SettingsHandler) UpdateImageSettings(c *gin.Context) {
	var req service.ImageSettings
	decoder := json.NewDecoder(c.Request.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		RespondWithError(c, apperrors.NewBadRequest("无效的请求体", nil))
		return
	}

	settings, err := h.settingsService.UpdateImageSettings(c.Request.Context(), req)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithSuccess(c, settings)
}
