package handler

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gin-quickstart/internal/config"
	apperrors "gin-quickstart/internal/pkg/errors"
	"github.com/gin-gonic/gin"
)

const (
	maxImageUploadBytes        = 50 << 20
	maxMultipartImageBodyBytes = maxImageUploadBytes + 2<<20
)

var allowedImageTypes = map[string]string{
	"image/gif":  ".gif",
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

type UploadHandler struct {
	imageDir       string
	imgBedEndpoint string
	imgBedToken    string
	imgBedField    string
	imgBedHost     string
	httpClient     *http.Client
}

type uploadResponse struct {
	URL string `json:"url"`
}

func NewUploadHandler(cfg *config.Config) (*UploadHandler, error) {
	imgBedEndpoint, err := imgBedEndpointWithFolder(cfg.ImgBedEndpoint(), cfg.ImgBedUploadFolder())
	if err != nil {
		return nil, fmt.Errorf("invalid ImgBed upload folder config: %w", err)
	}
	imgBedHost, err := validateImgBedEndpoint(imgBedEndpoint)
	if err != nil {
		return nil, err
	}

	return &UploadHandler{
		imageDir:       filepath.Join(cfg.UploadDir(), "images"),
		imgBedEndpoint: imgBedEndpoint,
		imgBedToken:    cfg.ImgBedToken(),
		imgBedField:    cfg.ImgBedField(),
		imgBedHost:     imgBedHost,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= 3 {
					return errors.New("too many ImgBed redirects")
				}
				if req.URL.Scheme != "https" || !sameHost(req.URL.Host, imgBedHost) {
					return http.ErrUseLastResponse
				}
				return nil
			},
		},
	}, nil
}

func (h *UploadHandler) ImageDir() string {
	return h.imageDir
}

func (h *UploadHandler) UploadImage(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxMultipartImageBodyBytes)

	file, header, err := c.Request.FormFile("image")
	if err != nil {
		if strings.Contains(err.Error(), "request body too large") {
			RespondWithError(c, apperrors.NewTooLarge("图片文件过大，请上传 50MB 以内的图片"))
			return
		}
		slog.Error("FormFile parse failed",
			"error", err,
			"content_type", c.GetHeader("Content-Type"),
			"content_length", c.GetHeader("Content-Length"),
		)
		RespondWithError(c, apperrors.NewBadRequest("image file is required", nil))
		return
	}
	defer file.Close()

	ext, err := imageExtension(file, header)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	if h.imgBedEndpoint != "" {
		remoteURL, err := h.uploadToImgBed(c.Request.Context(), file, header.Filename)
		if err != nil {
			RespondWithError(c, err)
			return
		}

		RespondWithCreated(c, uploadResponse{URL: remoteURL})
		return
	}

	if err := os.MkdirAll(h.imageDir, 0o755); err != nil {
		RespondWithError(c, err)
		return
	}

	filename, err := randomImageName(ext)
	if err != nil {
		RespondWithError(c, err)
		return
	}

	dstPath := filepath.Join(h.imageDir, filename)
	dst, err := os.OpenFile(dstPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		RespondWithError(c, err)
		return
	}
	defer dst.Close()

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		RespondWithError(c, err)
		return
	}

	if _, err := io.Copy(dst, file); err != nil {
		RespondWithError(c, err)
		return
	}

	RespondWithCreated(c, uploadResponse{
		URL: "/api/v1/uploads/images/" + filename,
	})
}

func imageExtension(file multipart.File, header *multipart.FileHeader) (string, error) {
	if header == nil || header.Size <= 0 {
		return "", apperrors.NewBadRequest("image file is empty", nil)
	}

	if header.Size > maxImageUploadBytes {
		return "", apperrors.NewBadRequest("image file must be 50MB or smaller", nil)
	}

	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && !errors.Is(err, io.EOF) {
		return "", err
	}

	contentType := http.DetectContentType(buffer[:n])
	ext, ok := allowedImageTypes[contentType]
	if !ok {
		return "", apperrors.NewBadRequest("only PNG, JPEG, GIF, and WebP images are supported", nil)
	}

	if originalExt := strings.ToLower(filepath.Ext(header.Filename)); originalExt != "" {
		if originalExt == ".jpeg" {
			originalExt = ".jpg"
		}
		if originalExt == ext {
			return ext, nil
		}
	}

	return ext, nil
}

func (h *UploadHandler) uploadToImgBed(ctx context.Context, file multipart.File, filename string) (string, error) {
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", fmt.Errorf("rewind image file before ImgBed upload: %w", err)
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile(h.imgBedField, filename)
	if err != nil {
		return "", fmt.Errorf("create ImgBed multipart file: %w", err)
	}
	if _, err := io.Copy(part, file); err != nil {
		return "", fmt.Errorf("copy image into ImgBed request: %w", err)
	}
	if err := writer.Close(); err != nil {
		return "", fmt.Errorf("finalize ImgBed multipart request: %w", err)
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, h.imgBedEndpoint, &body)
	if err != nil {
		return "", fmt.Errorf("create ImgBed request: %w", err)
	}
	request.Header.Set("Content-Type", writer.FormDataContentType())
	if h.imgBedToken != "" {
		request.Header.Set("Authorization", "Bearer "+h.imgBedToken)
	}

	response, err := h.httpClient.Do(request)
	if err != nil {
		return "", fmt.Errorf("failed to upload image to ImgBed: %w", err)
	}
	defer response.Body.Close()

	responseBody, err := io.ReadAll(io.LimitReader(response.Body, 1<<20))
	if err != nil {
		return "", fmt.Errorf("read ImgBed response: %w", err)
	}
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return "", apperrors.NewBadRequest("image upload service rejected the file", nil)
	}

	return extractImgBedURL(responseBody, h.imgBedEndpoint)
}

func extractImgBedURL(body []byte, baseURL string) (string, error) {
	candidates := make([]string, 0, 3)

	var arrayResponse []struct {
		Src string `json:"src"`
	}
	if err := json.Unmarshal(body, &arrayResponse); err == nil {
		for _, item := range arrayResponse {
			candidates = append(candidates, item.Src)
		}
	}

	var objectResponse struct {
		URL  string `json:"url"`
		Data struct {
			URL string `json:"url"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &objectResponse); err == nil {
		candidates = append(candidates, objectResponse.URL, objectResponse.Data.URL)
	}

	for _, candidate := range candidates {
		if candidate == "" {
			continue
		}
		imageURL, err := absoluteHTTPSURL(candidate, baseURL)
		if err == nil {
			return imageURL, nil
		}
	}

	return "", apperrors.NewBadRequest("image upload service returned an invalid URL", nil)
}

func imgBedEndpointWithFolder(endpoint string, uploadFolder string) (string, error) {
	if endpoint == "" || uploadFolder == "" {
		return endpoint, nil
	}

	parsed, err := url.Parse(endpoint)
	if err != nil {
		return "", err
	}
	query := parsed.Query()
	query.Set("uploadFolder", uploadFolder)
	parsed.RawQuery = query.Encode()
	return parsed.String(), nil
}

func validateImgBedEndpoint(endpoint string) (string, error) {
	if endpoint == "" {
		return "", nil
	}

	parsed, err := url.Parse(endpoint)
	if err != nil {
		return "", fmt.Errorf("invalid ImgBed endpoint: %w", err)
	}
	if parsed.Scheme != "https" || parsed.Host == "" || parsed.User != nil {
		return "", errors.New("ImgBed endpoint must be an HTTPS URL without user info")
	}

	return parsed.Host, nil
}

func absoluteHTTPSURL(value string, baseURL string) (string, error) {
	base, err := url.Parse(baseURL)
	if err != nil {
		return "", err
	}
	if base.Host == "" {
		return "", errors.New("base URL host is required")
	}

	parsed, err := url.Parse(strings.TrimSpace(value))
	if err != nil {
		return "", err
	}

	if !parsed.IsAbs() {
		parsed = base.ResolveReference(parsed)
	}

	if parsed.Scheme != "https" || !sameHost(parsed.Host, base.Host) {
		return "", errors.New("image URL must be HTTPS and match ImgBed host")
	}

	return parsed.String(), nil
}

func sameHost(host string, expected string) bool {
	return strings.EqualFold(host, expected)
}

func randomImageName(ext string) (string, error) {
	bytes := make([]byte, 12)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return time.Now().UTC().Format("20060102-150405-") + hex.EncodeToString(bytes) + ext, nil
}
