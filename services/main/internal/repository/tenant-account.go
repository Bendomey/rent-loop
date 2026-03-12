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
	GetOneWithPopulate(context context.Context, query GetTenantAccountQuery) (*models.TenantAccount, error)
	Update(context context.Context, tenantAccount *models.TenantAccount, updates map[string]any) error
	GetByPropertyID(ctx context.Context, propertyID string) (*[]models.TenantAccount, error)
	GetByBlockID(ctx context.Context, blockID string) (*[]models.TenantAccount, error)
	GetByUnitIDs(ctx context.Context, unitIDs []string) (*[]models.TenantAccount, error)
	GetByClientID(ctx context.Context, clientID string) (*[]models.TenantAccount, error)
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

func (r *tenantAccountRepository) Update(
	ctx context.Context,
	tenantAccount *models.TenantAccount,
	updates map[string]any,
) error {
	return r.DB.WithContext(ctx).Model(tenantAccount).Updates(updates).Error
}

func (r *tenantAccountRepository) FindOne(ctx context.Context, query map[string]any) (*models.TenantAccount, error) {
	var tenantAccount models.TenantAccount
	result := r.DB.WithContext(ctx).Where(query).First(&tenantAccount)

	if result.Error != nil {
		return nil, result.Error
	}

	return &tenantAccount, nil
}

type GetTenantAccountQuery struct {
	ID          string
	PhoneNumber string
	Populate    *[]string
}

// activeLeasesStatuses are the lease statuses considered "current" for targeting.
var activeLeasesStatuses = []string{"Lease.Status.Pending", "Lease.Status.Active"}

func (r *tenantAccountRepository) GetByPropertyID(
	ctx context.Context,
	propertyID string,
) (*[]models.TenantAccount, error) {
	var accounts []models.TenantAccount
	result := r.DB.WithContext(ctx).
		Joins("JOIN tenants ON tenant_accounts.tenant_id = tenants.id").
		Joins("JOIN leases ON leases.tenant_id = tenants.id").
		Joins("JOIN units ON leases.unit_id = units.id").
		Where("units.property_id = ? AND leases.status IN ? AND leases.deleted_at IS NULL AND units.deleted_at IS NULL", propertyID, activeLeasesStatuses).
		Distinct("tenant_accounts.*").
		Find(&accounts)
	if result.Error != nil {
		return nil, result.Error
	}
	return &accounts, nil
}

func (r *tenantAccountRepository) GetByBlockID(
	ctx context.Context,
	blockID string,
) (*[]models.TenantAccount, error) {
	var accounts []models.TenantAccount
	result := r.DB.WithContext(ctx).
		Joins("JOIN tenants ON tenant_accounts.tenant_id = tenants.id").
		Joins("JOIN leases ON leases.tenant_id = tenants.id").
		Joins("JOIN units ON leases.unit_id = units.id").
		Where("units.property_block_id = ? AND leases.status IN ? AND leases.deleted_at IS NULL AND units.deleted_at IS NULL", blockID, activeLeasesStatuses).
		Distinct("tenant_accounts.*").
		Find(&accounts)
	if result.Error != nil {
		return nil, result.Error
	}
	return &accounts, nil
}

func (r *tenantAccountRepository) GetByUnitIDs(
	ctx context.Context,
	unitIDs []string,
) (*[]models.TenantAccount, error) {
	var accounts []models.TenantAccount
	result := r.DB.WithContext(ctx).
		Joins("JOIN tenants ON tenant_accounts.tenant_id = tenants.id").
		Joins("JOIN leases ON leases.tenant_id = tenants.id").
		Where("leases.unit_id IN ? AND leases.status IN ? AND leases.deleted_at IS NULL", unitIDs, activeLeasesStatuses).
		Distinct("tenant_accounts.*").
		Find(&accounts)
	if result.Error != nil {
		return nil, result.Error
	}
	return &accounts, nil
}

func (r *tenantAccountRepository) GetByClientID(
	ctx context.Context,
	clientID string,
) (*[]models.TenantAccount, error) {
	var accounts []models.TenantAccount
	result := r.DB.WithContext(ctx).
		Joins("JOIN tenants ON tenant_accounts.tenant_id = tenants.id").
		Joins("JOIN leases ON leases.tenant_id = tenants.id").
		Joins("JOIN units ON leases.unit_id = units.id").
		Joins("JOIN properties ON units.property_id = properties.id").
		Where("properties.client_id = ? AND leases.status IN ? AND leases.deleted_at IS NULL AND units.deleted_at IS NULL AND properties.deleted_at IS NULL", clientID, activeLeasesStatuses).
		Distinct("tenant_accounts.*").
		Find(&accounts)
	if result.Error != nil {
		return nil, result.Error
	}
	return &accounts, nil
}

func (r *tenantAccountRepository) GetOneWithPopulate(
	ctx context.Context,
	query GetTenantAccountQuery,
) (*models.TenantAccount, error) {
	var tenantAccount models.TenantAccount
	db := r.DB.WithContext(ctx)

	if query.ID != "" {
		db = db.Where("id = ?", query.ID)
	} else {
		db = db.Where("phone_number = ?", query.PhoneNumber)
	}

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&tenantAccount)
	if result.Error != nil {
		return nil, result.Error
	}

	return &tenantAccount, nil
}
