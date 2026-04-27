package service

import (
	"context"
	"testing"
	"time"

	"gin-quickstart/internal/model"
)

type fakeMediaAssetRepository struct {
	upsertCalled bool
}

func (r *fakeMediaAssetRepository) EnsureTables(context.Context) error {
	return nil
}

func (r *fakeMediaAssetRepository) UpsertAsset(_ context.Context, asset *model.MediaAsset) (*model.MediaAsset, error) {
	r.upsertCalled = true
	copy := *asset
	return &copy, nil
}

func (r *fakeMediaAssetRepository) FindByURLs(context.Context, []string) ([]*model.MediaAsset, error) {
	return nil, nil
}

func (r *fakeMediaAssetRepository) ReplaceResourceRefs(context.Context, string, uint, []uint) error {
	return nil
}

func (r *fakeMediaAssetRepository) DeleteResourceRefs(context.Context, string, uint) error {
	return nil
}

func (r *fakeMediaAssetRepository) ListOrphanedAssets(context.Context, time.Time, int) ([]*model.MediaAsset, error) {
	return nil, nil
}

func (r *fakeMediaAssetRepository) DeleteAssetByID(context.Context, uint) error {
	return nil
}

func TestBuildImgBedDeleteURLRejectsPathTraversalFileID(t *testing.T) {
	_, err := buildImgBedDeleteURL("https://img.example/base/upload?returnFormat=full", "../escape")
	if err == nil {
		t.Fatal("buildImgBedDeleteURL() error = nil, want error")
	}
}

func TestBuildImgBedDeleteURLRejectsBackslashInFileID(t *testing.T) {
	_, err := buildImgBedDeleteURL("https://img.example/base/upload?returnFormat=full", `nested\file.png`)
	if err == nil {
		t.Fatal("buildImgBedDeleteURL() error = nil, want error")
	}
}

func TestBuildImgBedDeleteURLRejectsEncodedPathTraversalFileID(t *testing.T) {
	_, err := buildImgBedDeleteURL("https://img.example/base/upload?returnFormat=full", "%2e%2e/escape")
	if err == nil {
		t.Fatal("buildImgBedDeleteURL() error = nil, want error")
	}
}

func TestBuildImgBedDeleteURLRejectsDoubleEncodedPathTraversalFileID(t *testing.T) {
	_, err := buildImgBedDeleteURL("https://img.example/base/upload?returnFormat=full", "%252e%252e/escape")
	if err == nil {
		t.Fatal("buildImgBedDeleteURL() error = nil, want error")
	}
}

func TestMediaServiceRegisterUploadRejectsEncodedTraversalFileID(t *testing.T) {
	repo := &fakeMediaAssetRepository{}
	service := &mediaService{repo: repo}

	_, err := service.RegisterUpload(context.Background(), RegisterMediaAssetInput{
		URL:    "https://img.example/file/example.png",
		FileID: "%252e%252e/escape",
	})
	if err == nil {
		t.Fatal("RegisterUpload() error = nil, want error")
	}
	if repo.upsertCalled {
		t.Fatal("UpsertAsset() called, want request rejected before persistence")
	}
}
