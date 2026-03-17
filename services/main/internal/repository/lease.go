package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type LeaseRepository interface {
	Create(context context.Context, lease *models.Lease) error
	GetOneWithPopulate(context context.Context, query GetLeaseQuery) (*models.Lease, error)
	GetActiveLeaseByUnitID(context context.Context, unitID string) (*models.Lease, error)
	Update(context context.Context, lease *models.Lease) error
	List(context context.Context, filterQuery ListLeasesFilter) (*[]models.Lease, error)
	Count(context context.Context, filterQuery ListLeasesFilter) (int64, error)
	CountActiveByUnitID(context context.Context, unitID string) (int64, error)
	ListDueForBilling(ctx context.Context) (*[]models.Lease, error)
}

type leaseRepository struct {
	DB *gorm.DB
}

func NewLeaseRepository(db *gorm.DB) LeaseRepository {
	return &leaseRepository{DB: db}
}

func (r *leaseRepository) Create(ctx context.Context, lease *models.Lease) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Create(lease).Error
}

type GetLeaseQuery struct {
	ID       string
	Populate *[]string
}

func (r *leaseRepository) GetOneWithPopulate(ctx context.Context, query GetLeaseQuery) (*models.Lease, error) {
	var lease models.Lease
	db := r.DB.WithContext(ctx).Where("id = ?", query.ID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&lease)
	if result.Error != nil {
		return nil, result.Error
	}

	return &lease, nil
}

func (r *leaseRepository) GetActiveLeaseByUnitID(ctx context.Context, unitID string) (*models.Lease, error) {
	var lease models.Lease
	result := r.DB.WithContext(ctx).
		Where("unit_id = ?", unitID).
		Where("status IN ?", []string{
			"Lease.Status.Pending",
			"Lease.Status.Active",
		}).
		First(&lease)

	if result.Error != nil {
		return nil, result.Error
	}

	return &lease, nil
}

func (r *leaseRepository) Update(ctx context.Context, lease *models.Lease) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Save(lease).Error
}

type ListLeasesFilter struct {
	lib.FilterQuery
	TenantID                   *string
	TenantAccountID            *string
	PropertyID                 *string
	Status                     *string
	ParentLeaseID              *string
	PaymentFrequency           *string
	StayDurationFrequency      *string
	LeaseAgreementDocumentMode *string
	UnitIds                    *[]string
}

func (r *leaseRepository) List(ctx context.Context, filterQuery ListLeasesFilter) (*[]models.Lease, error) {
	var leases []models.Lease

	db := r.DB.WithContext(ctx).Scopes(
		leaseFilterScope("tenant_id", filterQuery.TenantID),
		tenantAccountLeasesScope(filterQuery.TenantAccountID),
		propertyLeasesScope(filterQuery.PropertyID),
		leaseFilterScope("status", filterQuery.Status),
		leaseFilterScope("parent_lease_id", filterQuery.ParentLeaseID),
		leaseFilterScope("payment_frequency", filterQuery.PaymentFrequency),
		leaseFilterScope("stay_duration_frequency", filterQuery.StayDurationFrequency),
		leaseFilterScope("lease_agreement_document_mode", filterQuery.LeaseAgreementDocumentMode),
		leaseArrayFilterScope("unit_id", filterQuery.UnitIds),
		IDsFilterScope("leases", filterQuery.IDs),
		DateRangeScope("leases", filterQuery.DateRange),
		SearchScope("leases", filterQuery.Search),

		PaginationScope(filterQuery.Page, filterQuery.PageSize),
		OrderScope("leases", filterQuery.OrderBy, filterQuery.Order),
	)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}
	results := db.Find(&leases)
	if results.Error != nil {
		return nil, results.Error
	}

	return &leases, nil
}

func (r *leaseRepository) Count(ctx context.Context, filterQuery ListLeasesFilter) (int64, error) {
	var count int64

	result := r.DB.WithContext(ctx).Model(&models.Lease{}).Scopes(
		leaseFilterScope("tenant_id", filterQuery.TenantID),
		tenantAccountLeasesScope(filterQuery.TenantAccountID),
		propertyLeasesScope(filterQuery.PropertyID),
		leaseFilterScope("status", filterQuery.Status),
		leaseFilterScope("parent_lease_id", filterQuery.ParentLeaseID),
		leaseFilterScope("payment_frequency", filterQuery.PaymentFrequency),
		leaseFilterScope("stay_duration_frequency", filterQuery.StayDurationFrequency),
		leaseFilterScope("lease_agreement_document_mode", filterQuery.LeaseAgreementDocumentMode),
		leaseArrayFilterScope("unit_id", filterQuery.UnitIds),
		IDsFilterScope("leases", filterQuery.IDs),
		DateRangeScope("leases", filterQuery.DateRange),
		SearchScope("leases", filterQuery.Search),
	).Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func (r *leaseRepository) CountActiveByUnitID(ctx context.Context, unitID string) (int64, error) {
	db := lib.ResolveDB(ctx, r.DB)

	var count int64
	err := db.Model(&models.Lease{}).
		Where("unit_id = ?", unitID).
		Where("status IN ?", []string{
			"Lease.Status.Pending",
			"Lease.Status.Active",
		}).
		Count(&count).Error
	if err != nil {
		return 0, err
	}

	return count, nil
}

func propertyLeasesScope(propertyID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyID == nil {
			return db
		}

		return db.Joins("INNER JOIN units ON leases.unit_id = units.id").Where("units.property_id = ?", propertyID)
	}
}

func leaseFilterScope(field string, value *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if value == nil {
			return db
		}

		query := fmt.Sprintf("leases.%s = ?", field)
		return db.Where(query, value)
	}
}

func leaseArrayFilterScope(field string, value *[]string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if value == nil {
			return db
		}

		query := fmt.Sprintf("leases.%s IN (?)", field)
		return db.Where(query, *value)
	}
}

func tenantAccountLeasesScope(tenantAccountID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if tenantAccountID == nil {
			return db
		}

		return db.Where(
			"leases.tenant_id IN (SELECT tenant_id FROM tenant_accounts WHERE id = ? AND deleted_at IS NULL)",
			*tenantAccountID,
		)
	}
}

func (r *leaseRepository) ListDueForBilling(ctx context.Context) (*[]models.Lease, error) {
	var leases []models.Lease
	result := r.DB.WithContext(ctx).
		Where("status = ? AND next_billing_date IS NOT NULL AND next_billing_date <= ?", "Lease.Status.Active", time.Now()).
		Preload("Unit.Property").
		Preload("Tenant.TenantAccount").
		Find(&leases)
	if result.Error != nil {
		return nil, result.Error
	}
	return &leases, nil
}
