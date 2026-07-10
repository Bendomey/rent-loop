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
	CountActiveByPropertyID(context context.Context, propertyID string) (int64, error)
	ListDueForBilling(ctx context.Context) (*[]models.Lease, error)
	ListForMoveOutReminders(ctx context.Context) (*[]models.Lease, error)
	ListDueForCompletion(ctx context.Context) (*[]models.Lease, error)
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
	PropertyIDs                *[]string
	ClientID                   *string
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
		propertyLeasesScope(filterQuery.PropertyIDs, filterQuery.ClientID),
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
		propertyLeasesScope(filterQuery.PropertyIDs, filterQuery.ClientID),
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

// propertyLeasesScope resolves the property/client filter for leases. propertyIDs is an
// IN-list (a one-element slice for an exact match — the nested /properties/{property_id}
// route — or many for the cross-property route) and takes precedence when set; clientID is
// the unrestricted-for-client case (join through units -> properties, without enumerating
// every property). nil/nil means no filter at all.
func propertyLeasesScope(propertyIDs *[]string, clientID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyIDs != nil {
			return db.Joins("INNER JOIN units ON leases.unit_id = units.id").
				Where("units.property_id IN (?)", *propertyIDs)
		}
		if clientID != nil {
			return db.Joins("INNER JOIN units ON leases.unit_id = units.id").
				Joins("INNER JOIN properties ON units.property_id = properties.id").
				Where("properties.client_id = ?", *clientID)
		}
		return db
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

func (r *leaseRepository) CountActiveByPropertyID(ctx context.Context, propertyID string) (int64, error) {
	var count int64
	err := r.DB.WithContext(ctx).
		Model(&models.Lease{}).
		Joins("INNER JOIN units ON leases.unit_id = units.id").
		Where("units.property_id = ?", propertyID).
		Where("leases.status IN ?", []string{
			"Lease.Status.Pending",
			"Lease.Status.Active",
		}).
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
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

// ListForMoveOutReminders returns pending or active leases whose MoveOutDate
// falls within the next 30 days, so the reminder cron can evaluate which
// threshold (if any) applies without recomputing lease duration math.
// Pending leases are included because some managers never explicitly
// activate a lease before move-out.
func (r *leaseRepository) ListForMoveOutReminders(ctx context.Context) (*[]models.Lease, error) {
	var leases []models.Lease
	now := time.Now()
	result := r.DB.WithContext(ctx).
		Where(
			"status IN (?, ?) AND move_out_date IS NOT NULL AND move_out_date BETWEEN ? AND ?",
			"Lease.Status.Pending", "Lease.Status.Active", now, now.AddDate(0, 0, 30),
		).
		Preload("Unit.Property").
		Preload("Tenant.TenantAccount").
		Preload("ActivatedBy.User").
		Find(&leases)
	if result.Error != nil {
		return nil, result.Error
	}

	return &leases, nil
}

// ListDueForCompletion returns pending or active leases whose MoveOutDate has
// fully passed (the day after move-out, calendar-day normalized in UTC), i.e.
// ready to transition to Lease.Status.Completed. Pending leases are included
// because some managers never explicitly activate a lease before move-out.
func (r *leaseRepository) ListDueForCompletion(ctx context.Context) (*[]models.Lease, error) {
	var leases []models.Lease
	now := time.Now().UTC()
	startOfToday := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	result := r.DB.WithContext(ctx).
		Where(
			"status IN (?, ?) AND move_out_date IS NOT NULL AND move_out_date < ?",
			"Lease.Status.Pending", "Lease.Status.Active", startOfToday,
		).
		Preload("Unit.Property").
		Preload("Tenant.TenantAccount").
		Preload("ActivatedBy.User").
		Find(&leases)
	if result.Error != nil {
		return nil, result.Error
	}
	return &leases, nil
}
