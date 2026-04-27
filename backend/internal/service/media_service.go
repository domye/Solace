package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"

	"gin-quickstart/internal/config"
	"gin-quickstart/internal/model"
	"gin-quickstart/internal/pkg/media"
	"gin-quickstart/internal/repository"
)

const (
	resourceTypeArticle = "article"
	resourceTypePage    = "page"
	orphanCleanupAfter  = 24 * time.Hour
)

type RegisterMediaAssetInput struct {
	Provider     string `json:"provider"`
	FileID       string `json:"file_id"`
	URL          string `json:"url"`
	OriginalName string `json:"original_name"`
	ContentType  string `json:"content_type"`
	Size         int64  `json:"size"`
}

type MediaService interface {
	RegisterUpload(ctx context.Context, input RegisterMediaAssetInput) (*model.MediaAsset, error)
	SyncArticleRefs(ctx context.Context, articleID uint, content string, coverImage string) error
	SyncPageRefs(ctx context.Context, pageID uint, content string, coverImage string) error
	ReleaseArticleRefs(ctx context.Context, articleID uint) error
	ReleasePageRefs(ctx context.Context, pageID uint) error
}

type mediaService struct {
	repo           repository.MediaAssetRepository
	deleteEndpoint string
	deleteToken    string
	httpClient     *http.Client
}

func NewMediaService(repo repository.MediaAssetRepository, cfg *config.Config) MediaService {
	return &mediaService{
		repo:           repo,
		deleteEndpoint: strings.TrimSpace(cfg.ImgBedDeleteEndpoint()),
		deleteToken:    strings.TrimSpace(cfg.ImgBedDeleteToken()),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (s *mediaService) RegisterUpload(ctx context.Context, input RegisterMediaAssetInput) (*model.MediaAsset, error) {
	normalizedFileID, err := normalizeMediaAssetFileID(input.FileID)
	if err != nil {
		return nil, err
	}

	asset := &model.MediaAsset{
		Provider:     strings.TrimSpace(input.Provider),
		FileID:       normalizedFileID,
		URL:          media.NormalizeImageURL(input.URL),
		OriginalName: strings.TrimSpace(input.OriginalName),
		ContentType:  strings.TrimSpace(input.ContentType),
		Size:         input.Size,
	}

	if asset.Provider == "" {
		asset.Provider = "imgbed"
	}
	if asset.URL == "" {
		return nil, fmt.Errorf("media asset url is required")
	}

	return s.repo.UpsertAsset(ctx, asset)
}

func (s *mediaService) SyncArticleRefs(ctx context.Context, articleID uint, content string, coverImage string) error {
	return s.syncResourceRefs(ctx, resourceTypeArticle, articleID, content, coverImage)
}

func (s *mediaService) SyncPageRefs(ctx context.Context, pageID uint, content string, coverImage string) error {
	return s.syncResourceRefs(ctx, resourceTypePage, pageID, content, coverImage)
}

func (s *mediaService) ReleaseArticleRefs(ctx context.Context, articleID uint) error {
	return s.releaseResourceRefs(ctx, resourceTypeArticle, articleID)
}

func (s *mediaService) ReleasePageRefs(ctx context.Context, pageID uint) error {
	return s.releaseResourceRefs(ctx, resourceTypePage, pageID)
}

func (s *mediaService) syncResourceRefs(ctx context.Context, resourceType string, resourceID uint, content string, coverImage string) error {
	urls := media.CollectReferencedImageURLs(content, coverImage)
	assets, err := s.repo.FindByURLs(ctx, urls)
	if err != nil {
		return err
	}

	assetIDs := make([]uint, 0, len(assets))
	for _, asset := range assets {
		assetIDs = append(assetIDs, asset.ID)
	}

	if err := s.repo.ReplaceResourceRefs(ctx, resourceType, resourceID, assetIDs); err != nil {
		return err
	}
	s.cleanupOrphans(ctx)
	return nil
}

func (s *mediaService) releaseResourceRefs(ctx context.Context, resourceType string, resourceID uint) error {
	if err := s.repo.DeleteResourceRefs(ctx, resourceType, resourceID); err != nil {
		return err
	}
	s.cleanupOrphans(ctx)
	return nil
}

func (s *mediaService) cleanupOrphans(ctx context.Context) {
	orphaned, err := s.repo.ListOrphanedAssets(ctx, time.Now().Add(-orphanCleanupAfter), 20)
	if err != nil {
		slog.Warn("cleanup orphaned media assets failed", "error", err)
		return
	}

	for _, asset := range orphaned {
		if err := s.deleteRemoteAsset(ctx, asset); err != nil {
			slog.Warn("delete remote media asset failed", "asset_id", asset.ID, "file_id", asset.FileID, "error", err)
			continue
		}
		if err := s.repo.DeleteAssetByID(ctx, asset.ID); err != nil {
			slog.Warn("delete local media asset record failed", "asset_id", asset.ID, "error", err)
		}
	}
}

func (s *mediaService) deleteRemoteAsset(ctx context.Context, asset *model.MediaAsset) error {
	if asset == nil {
		return nil
	}
	if asset.Provider != "imgbed" {
		return nil
	}
	if s.deleteEndpoint == "" || s.deleteToken == "" {
		return fmt.Errorf("imgbed delete endpoint/token not configured")
	}

	deleteURL, err := buildImgBedDeleteURL(s.deleteEndpoint, asset.FileID)
	if err != nil {
		return err
	}

	methods := []string{http.MethodDelete, http.MethodGet}
	for _, method := range methods {
		request, reqErr := http.NewRequestWithContext(ctx, method, deleteURL, nil)
		if reqErr != nil {
			return reqErr
		}
		request.Header.Set("Authorization", "Bearer "+s.deleteToken)

		response, doErr := s.httpClient.Do(request)
		if doErr != nil {
			err = doErr
			continue
		}

		body, _ := io.ReadAll(io.LimitReader(response.Body, 1<<20))
		response.Body.Close()

		if response.StatusCode >= http.StatusOK && response.StatusCode < http.StatusMultipleChoices {
			var payload struct {
				Success bool `json:"success"`
			}
			if len(body) == 0 || json.Unmarshal(body, &payload) != nil || payload.Success {
				return nil
			}
		}

		err = fmt.Errorf("imgbed delete %s failed with status %d: %s", method, response.StatusCode, strings.TrimSpace(string(body)))
	}

	return err
}

func buildImgBedDeleteURL(endpoint string, fileID string) (string, error) {
	parsed, err := url.Parse(strings.TrimSpace(endpoint))
	if err != nil {
		return "", fmt.Errorf("parse imgbed delete endpoint: %w", err)
	}

	cleanFileID, err := normalizeMediaAssetFileID(fileID)
	if err != nil {
		return "", err
	}

	cleanPath := strings.TrimSuffix(parsed.Path, "/")
	if strings.HasSuffix(cleanPath, "/upload") {
		cleanPath = strings.TrimSuffix(cleanPath, "/upload")
	}
	if !strings.HasSuffix(cleanPath, "/api/manage/delete") {
		cleanPath = path.Join(cleanPath, "api/manage/delete")
	}
	parsed.Path = path.Join(cleanPath, cleanFileID)
	parsed.RawQuery = ""
	return parsed.String(), nil
}

func normalizeMediaAssetFileID(fileID string) (string, error) {
	value := strings.Trim(strings.TrimSpace(fileID), "/")
	if value == "" {
		return "", fmt.Errorf("media asset file_id is required")
	}

	decodedValue := value
	for range 3 {
		nextValue, err := url.PathUnescape(decodedValue)
		if err != nil {
			return "", fmt.Errorf("media asset file_id is invalid")
		}
		if nextValue == decodedValue {
			break
		}
		decodedValue = nextValue
	}

	decodedValue = strings.Trim(decodedValue, "/")
	if decodedValue == "" {
		return "", fmt.Errorf("media asset file_id is invalid")
	}
	if strings.Contains(decodedValue, `%`) || strings.Contains(decodedValue, `\`) {
		return "", fmt.Errorf("media asset file_id is invalid")
	}

	segments := strings.Split(decodedValue, "/")
	for _, segment := range segments {
		if segment == "" || segment == "." || segment == ".." {
			return "", fmt.Errorf("media asset file_id is invalid")
		}
	}

	return decodedValue, nil
}
