package handler

import (
	"net/url"
	"strings"

	apperrors "gin-quickstart/internal/pkg/errors"
	"gin-quickstart/internal/service"
	"github.com/gin-gonic/gin"
)

type MediaHandler struct {
	mediaService service.MediaService
}

func NewMediaHandler(mediaService service.MediaService) *MediaHandler {
	return &MediaHandler{mediaService: mediaService}
}

type registerMediaAssetRequest struct {
	Provider     string `json:"provider"`
	FileID       string `json:"file_id"`
	URL          string `json:"url"`
	OriginalName string `json:"original_name"`
	ContentType  string `json:"content_type"`
	Size         int64  `json:"size"`
}

func validateRegisterMediaAssetRequest(req registerMediaAssetRequest) error {
	if strings.TrimSpace(req.URL) == "" || strings.TrimSpace(req.FileID) == "" {
		return apperrors.NewBadRequest("media asset url and file_id are required", nil)
	}
	if req.Size < 0 {
		return apperrors.NewBadRequest("media asset size must be non-negative", nil)
	}

	parsed, err := url.Parse(strings.TrimSpace(req.URL))
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return apperrors.NewBadRequest("media asset url is invalid", nil)
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return apperrors.NewBadRequest("media asset url is invalid", nil)
	}

	return nil
}

func (h *MediaHandler) RegisterAsset(c *gin.Context) {
	var req registerMediaAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, apperrors.NewBadRequest("invalid media asset payload", nil))
		return
	}

	if err := validateRegisterMediaAssetRequest(req); err != nil {
		RespondWithError(c, err)
		return
	}

	asset, err := h.mediaService.RegisterUpload(c.Request.Context(), service.RegisterMediaAssetInput{
		Provider:     req.Provider,
		FileID:       req.FileID,
		URL:          req.URL,
		OriginalName: req.OriginalName,
		ContentType:  req.ContentType,
		Size:         req.Size,
	})
	if err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithCreated(c, asset)
}
