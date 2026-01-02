package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type TenantApplicationRepository interface {
	Create(context.Context, *models.TenantApplication) error
}

type tenantApplicationRepository struct {
	DB *gorm.DB
}

func NewTenantApplicationRepository(db *gorm.DB) TenantApplicationRepository {
	return &tenantApplicationRepository{DB: db}
}

func (r *tenantApplicationRepository) Create(ctx context.Context, tenantApplication *models.TenantApplication) error {
	db := lib.ResolveDB(ctx, r.DB)
	return db.WithContext(ctx).Create(tenantApplication).Error
}
