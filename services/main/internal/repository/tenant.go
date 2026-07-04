package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type TenantRepository interface {
	Create(context context.Context, tenant *models.Tenant) error
	Update(context context.Context, tenant *models.Tenant, updates map[string]any) error
	FindOne(context context.Context, query map[string]any) (*models.Tenant, error)
	GetOneWithPopulate(context context.Context, query GetTenantQuery) (*models.Tenant, error)
	// for general tenant listing and counting.
	List(context context.Context, filterQuery ListTenantsFilter) (*[]models.Tenant, error)
	Count(context context.Context, filterQuery ListTenantsFilter) (int64, error)

	// for property specifically.
	ListTenantsByProperty(context context.Context, filterQuery ListTenantsByPropertyFilter) (*[]models.Tenant, error)
	CountTenantsByProperty(context context.Context, filterQuery ListTenantsByPropertyFilter) (int64, error)
	GetOneByProperty(context context.Context, query GetTenantByPropertyQuery) (*models.Tenant, error)
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

func (r *tenantRepository) Update(ctx context.Context, tenant *models.Tenant, updates map[string]any) error {
	db := lib.ResolveDB(ctx, r.DB)
	return db.WithContext(ctx).Model(tenant).Updates(updates).Error
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

// GetTenantByPropertyQuery scopes a single-tenant lookup to a property,
// verifying the tenant actually has a lease in that property before
// returning it (rather than trusting the caller's property_id blindly).
type GetTenantByPropertyQuery struct {
	ID         string
	PropertyID string
	Populate   *[]string
}

func (r *tenantRepository) GetOneByProperty(
	ctx context.Context,
	query GetTenantByPropertyQuery,
) (*models.Tenant, error) {
	var tenant models.Tenant
	db := r.DB.WithContext(ctx).
		Scopes(propertyTenantsWithStatusScope(&query.PropertyID, nil)).
		Where("tenants.id = ?", query.ID).
		Preload("Leases", recentLeasePreloadScope(query.PropertyID)).
		Preload("Bookings", recentBookingPreloadScope(query.PropertyID))

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
}

func (r *tenantRepository) List(ctx context.Context, filterQuery ListTenantsFilter) (*[]models.Tenant, error) {
	var tenants []models.Tenant

	db := r.DB.WithContext(ctx).Scopes(
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
		DateRangeScope("tenants", filterQuery.DateRange),
		SearchScope("tenants", filterQuery.Search),
	).Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

type ListTenantsByPropertyFilter struct {
	lib.FilterQuery
	PropertyID *string
	Status     *string // "ACTIVE" | "EXPIRED"
}

func (r *tenantRepository) ListTenantsByProperty(
	ctx context.Context,
	filterQuery ListTenantsByPropertyFilter,
) (*[]models.Tenant, error) {
	var tenants []models.Tenant

	db := r.DB.WithContext(ctx).Scopes(
		propertyTenantsWithStatusScope(filterQuery.PropertyID, filterQuery.Status),
		IDsFilterScope("tenants", filterQuery.IDs),
		DateRangeScope("tenants", filterQuery.DateRange),
		SearchScope("tenants", filterQuery.Search),
		PaginationScope(filterQuery.Page, filterQuery.PageSize),
		OrderScope("tenants", filterQuery.OrderBy, filterQuery.Order),
	)

	if filterQuery.PropertyID != nil {
		db = db.
			Preload("Leases", recentLeasePreloadScope(*filterQuery.PropertyID)).
			Preload("Bookings", recentBookingPreloadScope(*filterQuery.PropertyID))
	}

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

func (r *tenantRepository) CountTenantsByProperty(
	ctx context.Context,
	filterQuery ListTenantsByPropertyFilter,
) (int64, error) {
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

// propertyTenantsWithStatusScope scopes tenants to those that have a lease or
// booking in the given property. ACTIVE means an pending/active lease or a
// CONFIRMED/CHECKED_IN booking currently exists; EXPIRED means the tenant has
// some past lease or booking in the property but nothing currently active; no
// status filter means the tenant has any lease or booking in the property,
// past or present.
func propertyTenantsWithStatusScope(propertyID *string, status *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyID == nil {
			return db
		}

		if status != nil && *status == "ACTIVE" {
			return db.Where(
				"(tenants.id IN (SELECT DISTINCT leases.tenant_id FROM leases JOIN units ON leases.unit_id = units.id WHERE units.property_id = ? AND leases.status IN ('Lease.Status.Pending', 'Lease.Status.Active') AND leases.deleted_at IS NULL)) OR (tenants.id IN (SELECT DISTINCT bookings.tenant_id FROM bookings WHERE bookings.property_id = ? AND bookings.status IN ('CONFIRMED', 'CHECKED_IN') AND bookings.deleted_at IS NULL))",
				*propertyID,
				*propertyID,
			)
		}

		if status != nil && *status == "EXPIRED" {
			return db.
				Where(
					"(tenants.id IN (SELECT DISTINCT leases.tenant_id FROM leases JOIN units ON leases.unit_id = units.id WHERE units.property_id = ? AND leases.status IN ('Lease.Status.Terminated', 'Lease.Status.Completed', 'Lease.Status.Cancelled') AND leases.deleted_at IS NULL)) OR (tenants.id IN (SELECT DISTINCT bookings.tenant_id FROM bookings WHERE bookings.property_id = ? AND bookings.status IN ('COMPLETED', 'CANCELLED') AND bookings.deleted_at IS NULL))",
					*propertyID, *propertyID,
				).
				Where(
					"tenants.id NOT IN (SELECT DISTINCT leases.tenant_id FROM leases JOIN units ON leases.unit_id = units.id WHERE units.property_id = ? AND leases.status = 'Lease.Status.Active' AND leases.deleted_at IS NULL)",
					*propertyID,
				).
				Where(
					"tenants.id NOT IN (SELECT DISTINCT bookings.tenant_id FROM bookings WHERE bookings.property_id = ? AND bookings.status IN ('CONFIRMED', 'CHECKED_IN') AND bookings.deleted_at IS NULL)",
					*propertyID,
				)
		}

		// No status filter: all tenants with any lease or booking in the property
		return db.Where(
			"(tenants.id IN (SELECT DISTINCT leases.tenant_id FROM leases JOIN units ON leases.unit_id = units.id WHERE units.property_id = ? AND leases.deleted_at IS NULL)) OR (tenants.id IN (SELECT DISTINCT bookings.tenant_id FROM bookings WHERE bookings.property_id = ? AND bookings.deleted_at IS NULL))",
			*propertyID,
			*propertyID,
		)
	}
}

// recentLeasePreloadScope preloads at most one lease per tenant for a given
// property: the tenant's Active lease if one exists, otherwise their most
// recently moved-in lease. GORM's Preload doesn't support a per-parent LIMIT
// natively (a plain .Limit(1) caps the whole batch, not each tenant), so this
// uses a ROW_NUMBER() window function over a derived table, filtered to the
// first row per tenant, wrapped so GORM's own tenant_id-matching still works.
func recentLeasePreloadScope(propertyID string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		sub := db.Session(&gorm.Session{NewDB: true}).
			Table("leases").
			Select(
				"leases.*, ROW_NUMBER() OVER (PARTITION BY leases.tenant_id ORDER BY (leases.status IN ('Lease.Status.Active', 'Lease.Status.Pending')) DESC, leases.move_in_date DESC) AS rn",
			).
			Joins("JOIN units ON units.id = leases.unit_id").
			Where("units.property_id = ? AND leases.deleted_at IS NULL", propertyID)

		return db.Table("(?) AS leases", sub).Where("leases.rn = 1")
	}
}

// recentBookingPreloadScope preloads at most one booking per tenant for a
// given property: a CONFIRMED/CHECKED_IN booking if one exists, otherwise the
// booking with the most recent check-in date. See recentLeasePreloadScope for
// why the ROW_NUMBER derived-table technique is needed.
func recentBookingPreloadScope(propertyID string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		sub := db.Session(&gorm.Session{NewDB: true}).
			Table("bookings").
			Select(
				"bookings.*, ROW_NUMBER() OVER (PARTITION BY bookings.tenant_id ORDER BY (bookings.status IN ('CONFIRMED', 'CHECKED_IN')) DESC, bookings.check_in_date DESC) AS rn",
			).
			Where("bookings.property_id = ? AND bookings.deleted_at IS NULL", propertyID)

		return db.Table("(?) AS bookings", sub).Where("bookings.rn = 1")
	}
}
