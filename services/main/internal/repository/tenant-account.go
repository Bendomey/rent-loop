package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type TenantAccountRepository interface {
	Create(context context.Context, tenantAccount *models.TenantAccount) error
	FindOne(context context.Context, query map[string]any) (*models.TenantAccount, error)
}

type tenantAccountRepository struct {
	DB *gorm.DB
}

func NewTenantAccountRepository(db *gorm.DB) TenantAccountRepository {
	return &tenantAccountRepository{DB: db}
}

func (r *tenantAccountRepository) Create(ctx context.Context, tenantAccount *models.TenantAccount) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Create(tenantAccount).Error
}

func (r *tenantAccountRepository) FindOne(ctx context.Context, query map[string]any) (*models.TenantAccount, error) {
	var tenantAccount models.TenantAccount
	result := r.DB.WithContext(ctx).Where(query).First(&tenantAccount)

	if result.Error != nil {
		return nil, result.Error
	}

	return &tenantAccount, nil
}
