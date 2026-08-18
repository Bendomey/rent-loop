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
	// GetCurrentForAccount returns the account's Active lease, or its most
	// recent by move-in date when none is active. The fallback for invoice
	// attribution when the charges themselves cannot say which term they
	// belong to.
	GetCurrentForAccount(context context.Context, financialAccountID string) (*models.Lease, error)
	// SetFinancialAccount writes the lease half of the lease <-> account link.
	//
	// A targeted UPDATE through lib.ResolveDB rather than a read-modify-save:
	// approval calls this inside its transaction, immediately after creating
	// the lease, and GetOneWithPopulate reads the base connection rather than
	// the transaction — so a re-read would not find the row yet.
	SetFinancialAccount(context context.Context, leaseID, financialAccountID string) error
	// HasMoveOutEvidenceForAccount reports whether any lease on the account has
	// a completed termination or a check-out checklist. Advisory only — it
	// warns at closure, it never blocks, because a lease that simply runs to
	// Completed produces neither.
	HasMoveOutEvidenceForAccount(context context.Context, financialAccountID string) (bool, error)
	Update(context context.Context, lease *models.Lease) error
	List(context context.Context, filterQuery ListLeasesFilter) (*[]models.Lease, error)
	Count(context context.Context, filterQuery ListLeasesFilter) (int64, error)
	CountActiveByUnitID(context context.Context, unitID string) (int64, error)
	CountActiveByPropertyID(context context.Context, propertyID string) (int64, error)
	CountByPropertyIDAndStatus(context context.Context, propertyID string, status string) (int64, error)
	CountNonBlockingByPropertyID(context context.Context, propertyID string) (int64, error)
	DeleteNonBlockingByPropertyID(context context.Context, propertyID string) error
	ListForMoveOutReminders(ctx context.Context) (*[]models.Lease, error)
	ListDueForCompletion(ctx context.Context) (*[]models.Lease, error)
	ListDueForActivation(ctx context.Context) (*[]models.Lease, error)
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

func (r *leaseRepository) SetFinancialAccount(ctx context.Context, leaseID, financialAccountID string) error {
	return lib.ResolveDB(ctx, r.DB).
		Model(&models.Lease{}).
		Where("id = ?", leaseID).
		Update("financial_account_id", financialAccountID).Error
}

func (r *leaseRepository) GetCurrentForAccount(
	ctx context.Context,
	financialAccountID string,
) (*models.Lease, error) {
	var lease models.Lease
	result := r.DB.WithContext(ctx).
		Where("financial_account_id = ?", financialAccountID).
		Order("CASE WHEN status = 'Lease.Status.Active' THEN 0 ELSE 1 END, move_in_date DESC").
		First(&lease)

	if result.Error != nil {
		return nil, result.Error
	}

	return &lease, nil
}

func (r *leaseRepository) HasMoveOutEvidenceForAccount(
	ctx context.Context,
	financialAccountID string,
) (bool, error) {
	var count int64

	err := r.DB.WithContext(ctx).
		Model(&models.Lease{}).
		Where("leases.financial_account_id = ?", financialAccountID).
		Where("leases.deleted_at IS NULL").
		Where(`(
			EXISTS (
				SELECT 1 FROM lease_terminations lt
				WHERE lt.lease_id = leases.id
				  AND lt.deleted_at IS NULL
				  AND lt.completed_at IS NOT NULL
			)
			OR EXISTS (
				SELECT 1 FROM lease_checklists lc
				WHERE lc.lease_id = leases.id
				  AND lc.deleted_at IS NULL
				  AND lc.type = 'CHECK_OUT'
			)
		)`).
		Count(&count).Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
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
	ClientUserID               *string
	Status                     *string
	ParentLeaseID              *string
	FinancialAccountID         *string
	PaymentFrequency           *string
	StayDurationFrequency      *string
	LeaseAgreementDocumentMode *string
	UnitIds                    *[]string
	MoveOutDateFrom            *time.Time
	MoveOutDateTo              *time.Time
}

func (r *leaseRepository) List(ctx context.Context, filterQuery ListLeasesFilter) (*[]models.Lease, error) {
	var leases []models.Lease

	db := r.DB.WithContext(ctx).Scopes(
		leaseFilterScope("tenant_id", filterQuery.TenantID),
		tenantAccountLeasesScope(filterQuery.TenantAccountID),
		propertyLeasesScope(filterQuery.PropertyIDs, filterQuery.ClientUserID),
		leaseFilterScope("status", filterQuery.Status),
		leaseFilterScope("parent_lease_id", filterQuery.ParentLeaseID),
		leaseFilterScope("financial_account_id", filterQuery.FinancialAccountID),
		leaseFilterScope("payment_frequency", filterQuery.PaymentFrequency),
		leaseFilterScope("stay_duration_frequency", filterQuery.StayDurationFrequency),
		leaseFilterScope("lease_agreement_document_mode", filterQuery.LeaseAgreementDocumentMode),
		leaseArrayFilterScope("unit_id", filterQuery.UnitIds),
		leaseMoveOutDateRangeScope(filterQuery.MoveOutDateFrom, filterQuery.MoveOutDateTo),
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
		propertyLeasesScope(filterQuery.PropertyIDs, filterQuery.ClientUserID),
		leaseFilterScope("status", filterQuery.Status),
		leaseFilterScope("parent_lease_id", filterQuery.ParentLeaseID),
		leaseFilterScope("financial_account_id", filterQuery.FinancialAccountID),
		leaseFilterScope("payment_frequency", filterQuery.PaymentFrequency),
		leaseFilterScope("stay_duration_frequency", filterQuery.StayDurationFrequency),
		leaseFilterScope("lease_agreement_document_mode", filterQuery.LeaseAgreementDocumentMode),
		leaseArrayFilterScope("unit_id", filterQuery.UnitIds),
		leaseMoveOutDateRangeScope(filterQuery.MoveOutDateFrom, filterQuery.MoveOutDateTo),
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
func propertyLeasesScope(propertyIDs *[]string, clientUserID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyIDs != nil {
			return db.Joins("INNER JOIN units ON leases.unit_id = units.id").
				Where("units.property_id IN (?)", *propertyIDs)
		}
		if clientUserID != nil {
			return db.Joins("INNER JOIN units ON leases.unit_id = units.id").
				Where(
					"units.property_id IN (SELECT property_id FROM client_user_properties WHERE client_user_id = ? AND deleted_at IS NULL)",
					*clientUserID,
				)
		}
		return db
	}
}

// leaseMoveOutDateRangeScope narrows to leases whose move-out falls inside the
// given window — the query behind the Insights "leases expiring" drill-down.
// Each bound applies independently so callers may supply either or both. The
// column is table-qualified because propertyLeasesScope joins units.
func leaseMoveOutDateRangeScope(from, to *time.Time) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if from != nil {
			db = db.Where("leases.move_out_date >= ?", *from)
		}
		if to != nil {
			db = db.Where("leases.move_out_date <= ?", *to)
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

func (r *leaseRepository) CountByPropertyIDAndStatus(
	ctx context.Context,
	propertyID string,
	status string,
) (int64, error) {
	var count int64
	err := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Model(&models.Lease{}).
		Joins("INNER JOIN units ON leases.unit_id = units.id").
		Where("units.property_id = ?", propertyID).
		Where("leases.status = ?", status).
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *leaseRepository) CountNonBlockingByPropertyID(ctx context.Context, propertyID string) (int64, error) {
	var count int64
	err := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Model(&models.Lease{}).
		Joins("INNER JOIN units ON leases.unit_id = units.id").
		Where("units.property_id = ?", propertyID).
		Where("leases.status NOT IN ?", []string{
			"Lease.Status.Pending",
			"Lease.Status.Active",
		}).
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *leaseRepository) DeleteNonBlockingByPropertyID(ctx context.Context, propertyID string) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Where(
			"unit_id IN (SELECT id FROM units WHERE property_id = ?) AND status NOT IN ?",
			propertyID,
			[]string{"Lease.Status.Pending", "Lease.Status.Active"},
		).
		Delete(&models.Lease{}).Error
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

// dueForActivationScope selects Pending leases whose move-in date has arrived.
//
// The move-out guard is not redundant with it: a lease whose whole term has
// already elapsed — created late, or missed while the job was down — must fall
// through to ListDueForCompletion instead of being activated first, or the
// tenant receives an "activated" notice minutes before a "completed" one. It
// also keeps the two midnight jobs order-independent, which asynq does not
// otherwise guarantee.
func dueForActivationScope(now time.Time) func(db *gorm.DB) *gorm.DB {
	startOfToday := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	return func(db *gorm.DB) *gorm.DB {
		return db.
			Where("status = ?", "Lease.Status.Pending").
			Where("move_in_date <= ?", now).
			Where("move_out_date IS NULL OR move_out_date >= ?", startOfToday)
	}
}

// ListDueForActivation returns Pending leases that have reached their move-in
// date and are still inside their term, i.e. ready to become Active without a
// manager having to say so.
func (r *leaseRepository) ListDueForActivation(ctx context.Context) (*[]models.Lease, error) {
	var leases []models.Lease
	result := r.DB.WithContext(ctx).
		Scopes(dueForActivationScope(time.Now().UTC())).
		Preload("Unit.Property").
		Preload("Tenant.TenantAccount").
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
