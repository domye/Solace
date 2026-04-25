package repository

import (
	"context"
	"testing"

	"gin-quickstart/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func openSettingsTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	dsn := "host=127.0.0.1 port=15432 user=solace password=change-this-database-password dbname=solace sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("gorm.Open() error = %v", err)
	}

	if err := db.Exec(`DROP TABLE IF EXISTS settings`).Error; err != nil {
		t.Fatalf("drop settings table error = %v", err)
	}

	return db
}

func TestSettingsRepositoryEnsureTableCreatesMissingTable(t *testing.T) {
	db := openSettingsTestDB(t)
	repo := NewSettingsRepository(db)

	if err := repo.EnsureTable(context.Background()); err != nil {
		t.Fatalf("EnsureTable() error = %v", err)
	}

	if !db.Migrator().HasTable(&model.Setting{}) {
		t.Fatal("settings table was not created")
	}
}

func TestSettingsRepositoryUpsertWorksAfterEnsureTable(t *testing.T) {
	db := openSettingsTestDB(t)
	repo := NewSettingsRepository(db)

	if err := repo.EnsureTable(context.Background()); err != nil {
		t.Fatalf("EnsureTable() error = %v", err)
	}

	err := repo.Upsert(context.Background(), &model.Setting{
		Key:   "image_settings",
		Value: []byte(`{"defaultWidth":720,"maxWidth":1000,"appendWidthToPastedImages":true}`),
	})
	if err != nil {
		t.Fatalf("Upsert() error = %v", err)
	}
}
