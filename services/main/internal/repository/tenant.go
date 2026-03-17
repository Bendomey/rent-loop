package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type TenantRepository interface {
	Create(context context.Context, tenant *models.Tenant) error
	FindOne(context context.Context, query map[string]any) (*models.Tenant, error)
	GetOneWithPopulate(context context.Context, query GetTenantQuery) (*models.Tenant, error)
	List(context context.Context, filterQuery ListTenantsFilter) (*[]models.Tenant, error)
	Count(context context.Context, filterQuery ListTenantsFilter) (int64, error)
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

func (r *tenantRepository) FindOne(ctx context.Context, query map[string]any) (*models.Tenant, error) {
	var tenant models.Tenant
	result := r.DB.WithContext(ctx).Where(query).First(&tenant)
	if result.Error != nil {
		return nil, result.Error
	}
	return &tenant, nil
}

type GetTenantQuery struct {
	ID       string
	Populate *[]string
}

func (r *tenantRepository) GetOneWithPopulate(ctx context.Context, query GetTenantQuery) (*models.Tenant, error) {
	var tenant models.Tenant
	db := r.DB.WithContext(ctx).Where("id = ?", query.ID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&tenant)
	if result.Error != nil {
		return nil, result.Error
	}
	return &tenant, nil
}

type ListTenantsFilter struct {
	lib.FilterQuery
	PropertyID *string
	Status     *string // "ACTIVE" | "EXPIRED"
}

func (r *tenantRepository) List(ctx context.Context, filterQuery ListTenantsFilter) (*[]models.Tenant, error) {
	var tenants []models.Tenant

	db := r.DB.WithContext(ctx).Scopes(
		propertyTenantsWithStatusScope(filterQuery.PropertyID, filterQuery.Status),
		IDsFilterScope("tenants", filterQuery.IDs),
		DateRangeScope("tenants", filterQuery.DateRange),
		SearchScope("tenants", filterQuery.Search),
		PaginationScope(filterQuery.Page, filterQuery.PageSize),
		OrderScope("tenants", filterQuery.OrderBy, filterQuery.Order),
	)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	results := db.Find(&tenants)
	if results.Error != nil {
		return nil, results.Error
	}

	return &tenants, nil
}

func (r *tenantRepository) Count(ctx context.Context, filterQuery ListTenantsFilter) (int64, error) {
	var count int64

	result := r.DB.WithContext(ctx).Model(&models.Tenant{}).Scopes(
		propertyTenantsWithStatusScope(filterQuery.PropertyID, filterQuery.Status),
		DateRangeScope("tenants", filterQuery.DateRange),
		SearchScope("tenants", filterQuery.Search),
	).Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func propertyTenantsWithStatusScope(propertyID *string, status *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyID == nil {
			return db
		}

		if status != nil && *status == "ACTIVE" {
			return db.Where(
				"tenants.id IN (SELECT DISTINCT leases.tenant_id FROM leases JOIN units ON leases.unit_id = units.id WHERE units.property_id = ? AND leases.status = 'Lease.Status.Active' AND leases.deleted_at IS NULL)",
				*propertyID,
			)
		}

		if status != nil && *status == "EXPIRED" {
			return db.Where(
				"tenants.id IN (SELECT DISTINCT leases.tenant_id FROM leases JOIN units ON leases.unit_id = units.id WHERE units.property_id = ? AND leases.status IN ('Lease.Status.Terminated', 'Lease.Status.Completed', 'Lease.Status.Cancelled') AND leases.deleted_at IS NULL)",
				*propertyID,
			).
				Where(
					"tenants.id NOT IN (SELECT DISTINCT leases.tenant_id FROM leases JOIN units ON leases.unit_id = units.id WHERE units.property_id = ? AND leases.status = 'Lease.Status.Active' AND leases.deleted_at IS NULL)",
					*propertyID,
				)
		}

		// No status filter: all tenants with any lease in the property
		return db.Where(
			"tenants.id IN (SELECT DISTINCT leases.tenant_id FROM leases JOIN units ON leases.unit_id = units.id WHERE units.property_id = ? AND leases.deleted_at IS NULL)",
			*propertyID,
		)
	}
}
