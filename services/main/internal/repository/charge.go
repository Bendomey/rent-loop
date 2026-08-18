package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ListChargeInstancesFilter struct {
	FinancialAccountID *string
	// LeaseID scopes to one contractual term. Omit it for the whole tenancy —
	// balance and allocation always run unscoped.
	LeaseID       *string
	Category      *string
	IncludeVoided bool
}

type ListChargeDefinitionsFilter struct {
	FinancialAccountID *string
	LeaseID            *string
	Status             *string
}

type ChargeRepository interface {
	CreateDefinition(ctx context.Context, definition *models.ChargeDefinition) error
	UpdateDefinition(ctx context.Context, definition *models.ChargeDefinition) error
	ListDefinitions(
		ctx context.Context,
		filters ListChargeDefinitionsFilter,
	) (*[]models.ChargeDefinition, error)

	CreateInstances(ctx context.Context, instances []models.ChargeInstance) error
	UpdateInstance(ctx context.Context, instance *models.ChargeInstance) error
	GetInstance(ctx context.Context, id string) (*models.ChargeInstance, error)
	ListInstances(
		ctx context.Context,
		filters ListChargeInstancesFilter,
	) (*[]models.ChargeInstance, error)

	// ScopeUnassignedToLease stamps an account's charges with the lease term
	// they belong to. Charges are prepared against an APPLICATION, before any
	// lease exists, so at approval they have no contractual context yet — this
	// is what gives it to them. Only unscoped rows are touched, so it can
	// never move a charge from one term to another.
	ScopeUnassignedToLease(ctx context.Context, financialAccountID, leaseID string) error

	// LockInstances re-reads the given instances with SELECT ... FOR UPDATE.
	// Composition and allocation both mutate InvoicedAmount/SettledAmount
	// read-modify-write, so without the lock two concurrent callers can both
	// observe the same available amount and over-claim the same charge.
	// MUST be called inside a transaction.
	LockInstances(ctx context.Context, ids []string) ([]models.ChargeInstance, error)
}

type chargeRepository struct {
	DB *gorm.DB
}

func NewChargeRepository(db *gorm.DB) ChargeRepository {
	return &chargeRepository{DB: db}
}

func (r *chargeRepository) CreateDefinition(ctx context.Context, definition *models.ChargeDefinition) error {
	return lib.ResolveDB(ctx, r.DB).Create(definition).Error
}

func (r *chargeRepository) UpdateDefinition(ctx context.Context, definition *models.ChargeDefinition) error {
	return lib.ResolveDB(ctx, r.DB).Save(definition).Error
}

func (r *chargeRepository) ListDefinitions(
	ctx context.Context,
	filters ListChargeDefinitionsFilter,
) (*[]models.ChargeDefinition, error) {
	var definitions []models.ChargeDefinition

	db := lib.ResolveDB(ctx, r.DB).Model(&models.ChargeDefinition{})
	if filters.FinancialAccountID != nil {
		db = db.Where("charge_definitions.financial_account_id = ?", *filters.FinancialAccountID)
	}
	if filters.LeaseID != nil {
		db = db.Where("charge_definitions.lease_id = ?", *filters.LeaseID)
	}
	if filters.Status != nil {
		db = db.Where("charge_definitions.status = ?", *filters.Status)
	}

	if err := db.Find(&definitions).Error; err != nil {
		return nil, err
	}

	return &definitions, nil
}

func (r *chargeRepository) CreateInstances(ctx context.Context, instances []models.ChargeInstance) error {
	if len(instances) == 0 {
		return nil
	}

	return lib.ResolveDB(ctx, r.DB).Create(&instances).Error
}

func (r *chargeRepository) UpdateInstance(ctx context.Context, instance *models.ChargeInstance) error {
	return lib.ResolveDB(ctx, r.DB).Save(instance).Error
}

func (r *chargeRepository) GetInstance(ctx context.Context, id string) (*models.ChargeInstance, error) {
	var instance models.ChargeInstance
	if err := lib.ResolveDB(ctx, r.DB).
		Where("charge_instances.id = ?", id).
		First(&instance).Error; err != nil {
		return nil, err
	}

	return &instance, nil
}

// applyChargeInstanceFilters is extracted so ListInstances and its tests render
// the same predicates.
func applyChargeInstanceFilters(db *gorm.DB, filters ListChargeInstancesFilter) *gorm.DB {
	if filters.FinancialAccountID != nil {
		db = db.Where("charge_instances.financial_account_id = ?", *filters.FinancialAccountID)
	}
	if filters.LeaseID != nil {
		db = db.Where("charge_instances.lease_id = ?", *filters.LeaseID)
	}
	if filters.Category != nil {
		db = db.Where("charge_instances.category = ?", *filters.Category)
	}
	if !filters.IncludeVoided {
		db = db.Where("charge_instances.voided_at IS NULL")
	}

	return db
}

func (r *chargeRepository) ListInstances(
	ctx context.Context,
	filters ListChargeInstancesFilter,
) (*[]models.ChargeInstance, error) {
	var instances []models.ChargeInstance

	db := applyChargeInstanceFilters(lib.ResolveDB(ctx, r.DB).Model(&models.ChargeInstance{}), filters)

	if err := db.Order("charge_instances.due_date ASC").Find(&instances).Error; err != nil {
		return nil, err
	}

	return &instances, nil
}

func (r *chargeRepository) ScopeUnassignedToLease(ctx context.Context, financialAccountID, leaseID string) error {
	db := lib.ResolveDB(ctx, r.DB)

	if err := db.Model(&models.ChargeDefinition{}).
		Where("financial_account_id = ? AND lease_id IS NULL", financialAccountID).
		Update("lease_id", leaseID).Error; err != nil {
		return err
	}

	return db.Model(&models.ChargeInstance{}).
		Where("financial_account_id = ? AND lease_id IS NULL", financialAccountID).
		Update("lease_id", leaseID).Error
}

func (r *chargeRepository) LockInstances(
	ctx context.Context,
	ids []string,
) ([]models.ChargeInstance, error) {
	if len(ids) == 0 {
		return []models.ChargeInstance{}, nil
	}

	var instances []models.ChargeInstance
	err := lib.ResolveDB(ctx, r.DB).
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("charge_instances.id IN ?", ids).
		// A stable order avoids deadlocks between concurrent callers locking
		// overlapping sets of charges.
		Order("charge_instances.id ASC").
		Find(&instances).Error
	if err != nil {
		return nil, err
	}

	return instances, nil
}
