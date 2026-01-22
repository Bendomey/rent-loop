package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type TenantRepository interface {
	Create(context context.Context, tenant *models.Tenant) error
}

type tenantRepository struct {
	DB *gorm.DB
}

func NewTenantRepository(db *gorm.DB) TenantRepository {
	return &tenantRepository{DB: db}
}

func (r *tenantRepository) Create(ctx context.Context, tenant *models.Tenant) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Create(tenant).Error
}
