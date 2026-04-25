package main

import (
	"context"
	"testing"

	"gin-quickstart/internal/model"
)

type fakeSettingsRepository struct {
	ensureTableCalled bool
	ensureTableErr    error
}

func (r *fakeSettingsRepository) EnsureTable(ctx context.Context) error {
	r.ensureTableCalled = true
	return r.ensureTableErr
}

func (r *fakeSettingsRepository) FindByKey(ctx context.Context, key string) (*model.Setting, error) {
	return nil, nil
}

func (r *fakeSettingsRepository) Upsert(ctx context.Context, setting *model.Setting) error {
	return nil
}

func TestEnsureSettingsSchemaCallsRepositoryEnsureTable(t *testing.T) {
	repo := &fakeSettingsRepository{}

	if err := ensureSettingsSchema(context.Background(), repo); err != nil {
		t.Fatalf("ensureSettingsSchema() error = %v", err)
	}

	if !repo.ensureTableCalled {
		t.Fatal("EnsureTable was not called")
	}
}
