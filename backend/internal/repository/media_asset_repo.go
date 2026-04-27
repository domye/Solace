package repository

import (
	"context"
	"fmt"
	"time"

	"gin-quickstart/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type mediaAssetRepo struct {
	db *gorm.DB
}

func NewMediaAssetRepository(db *gorm.DB) MediaAssetRepository {
	return &mediaAssetRepo{db: db}
}

func (r *mediaAssetRepo) EnsureTables(ctx context.Context) error {
	if err := r.db.WithContext(ctx).AutoMigrate(&model.MediaAsset{}, &model.MediaAssetRef{}); err != nil {
		return fmt.Errorf("ensure media asset tables: %w", err)
	}
	return nil
}

func (r *mediaAssetRepo) UpsertAsset(ctx context.Context, asset *model.MediaAsset) (*model.MediaAsset, error) {
	db := r.db.WithContext(ctx)
	if err := db.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "url"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"provider",
			"file_id",
			"original_name",
			"content_type",
			"size",
			"updated_at",
		}),
	}).Create(asset).Error; err != nil {
		return nil, fmt.Errorf("upsert media asset %q: %w", asset.URL, err)
	}

	var stored model.MediaAsset
	if err := db.Where("url = ?", asset.URL).First(&stored).Error; err != nil {
		return nil, fmt.Errorf("reload media asset %q: %w", asset.URL, err)
	}
	return &stored, nil
}

func (r *mediaAssetRepo) FindByURLs(ctx context.Context, urls []string) ([]*model.MediaAsset, error) {
	if len(urls) == 0 {
		return nil, nil
	}

	var assets []*model.MediaAsset
	if err := r.db.WithContext(ctx).Where("url IN ?", urls).Find(&assets).Error; err != nil {
		return nil, fmt.Errorf("find media assets by urls: %w", err)
	}
	return assets, nil
}

func (r *mediaAssetRepo) ReplaceResourceRefs(ctx context.Context, resourceType string, resourceID uint, assetIDs []uint) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("resource_type = ? AND resource_id = ?", resourceType, resourceID).Delete(&model.MediaAssetRef{}).Error; err != nil {
			return fmt.Errorf("delete old media refs: %w", err)
		}

		if len(assetIDs) == 0 {
			return nil
		}

		refs := make([]model.MediaAssetRef, 0, len(assetIDs))
		for _, assetID := range assetIDs {
			refs = append(refs, model.MediaAssetRef{
				AssetID:      assetID,
				ResourceType: resourceType,
				ResourceID:   resourceID,
			})
		}

		if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&refs).Error; err != nil {
			return fmt.Errorf("insert media refs: %w", err)
		}
		return nil
	})
}

func (r *mediaAssetRepo) DeleteResourceRefs(ctx context.Context, resourceType string, resourceID uint) error {
	if err := r.db.WithContext(ctx).
		Where("resource_type = ? AND resource_id = ?", resourceType, resourceID).
		Delete(&model.MediaAssetRef{}).Error; err != nil {
		return fmt.Errorf("delete media refs for %s:%d: %w", resourceType, resourceID, err)
	}
	return nil
}

func (r *mediaAssetRepo) ListOrphanedAssets(ctx context.Context, olderThan time.Time, limit int) ([]*model.MediaAsset, error) {
	if limit <= 0 {
		limit = 20
	}

	var assets []*model.MediaAsset
	if err := r.db.WithContext(ctx).
		Table("media_assets AS a").
		Select("a.*").
		Joins("LEFT JOIN media_asset_refs AS r ON r.asset_id = a.id").
		Where("a.created_at <= ?", olderThan).
		Group("a.id").
		Having("COUNT(r.id) = 0").
		Order("a.created_at ASC").
		Limit(limit).
		Scan(&assets).Error; err != nil {
		return nil, fmt.Errorf("list orphaned media assets: %w", err)
	}
	return assets, nil
}

func (r *mediaAssetRepo) DeleteAssetByID(ctx context.Context, assetID uint) error {
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("asset_id = ?", assetID).Delete(&model.MediaAssetRef{}).Error; err != nil {
			return fmt.Errorf("delete media asset refs before asset delete: %w", err)
		}
		if err := tx.Delete(&model.MediaAsset{}, assetID).Error; err != nil {
			return fmt.Errorf("delete media asset: %w", err)
		}
		return nil
	}); err != nil {
		return err
	}
	return nil
}
