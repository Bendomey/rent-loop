package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ListMaintenanceRequestFinancialsFilter struct {
	MaintenanceRequestID *string
	SettlementType       *string
	// TenantID restricts the list to lines charged to one tenant, by walking
	// the charge instance to the account that holds it. It is what the tenant
	// route filters on, in the query rather than in the serialiser: a filter
	// that lives in the transformation layer is one refactor away from being
	// bypassed.
	TenantID *string
}

type GetMaintenanceRequestFinancialQuery struct {
	ID       string
	Populate *[]string
}

type MaintenanceRequestFinancialRepository interface {
	Create(ctx context.Context, financial *models.MaintenanceRequestFinancial) error
	GetOne(
		ctx context.Context,
		query GetMaintenanceRequestFinancialQuery,
	) (*models.MaintenanceRequestFinancial, error)
	List(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters ListMaintenanceRequestFinancialsFilter,
	) (*[]models.MaintenanceRequestFinancial, error)
	Count(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters ListMaintenanceRequestFinancialsFilter,
	) (int64, error)
	Update(ctx context.Context, financial *models.MaintenanceRequestFinancial) error
	Delete(ctx context.Context, id string) error
}

type maintenanceRequestFinancialRepository struct {
	DB *gorm.DB
}

func NewMaintenanceRequestFinancialRepository(db *gorm.DB) MaintenanceRequestFinancialRepository {
	return &maintenanceRequestFinancialRepository{DB: db}
}

func mrfRequestScope(requestID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if requestID == nil {
			return db
		}
		return db.Where("maintenance_request_financials.maintenance_request_id = ?", *requestID)
	}
}

func mrfSettlementTypeScope(settlementType *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if settlementType == nil {
			return db
		}
		return db.Where("maintenance_request_financials.settlement_type = ?", *settlementType)
	}
}

func mrfTenantScope(tenantID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if tenantID == nil {
			return db
		}
		return db.Where(
			"maintenance_request_financials.charge_instance_id IN (?)",
			db.Session(&gorm.Session{NewDB: true}).
				Model(&models.ChargeInstance{}).
				Select("charge_instances.id").
				Joins("JOIN financial_accounts ON financial_accounts.id = charge_instances.financial_account_id").
				Where("financial_accounts.tenant_id = ?", *tenantID),
		)
	}
}

func (r *maintenanceRequestFinancialRepository) Create(
	ctx context.Context,
	financial *models.MaintenanceRequestFinancial,
) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Create(financial).Error
}

func (r *maintenanceRequestFinancialRepository) GetOne(
	ctx context.Context,
	query GetMaintenanceRequestFinancialQuery,
) (*models.MaintenanceRequestFinancial, error) {
	var financial models.MaintenanceRequestFinancial
	db := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Where("maintenance_request_financials.id = ?", query.ID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	if err := db.First(&financial).Error; err != nil {
		return nil, err
	}
	return &financial, nil
}

func (r *maintenanceRequestFinancialRepository) List(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListMaintenanceRequestFinancialsFilter,
) (*[]models.MaintenanceRequestFinancial, error) {
	var financials []models.MaintenanceRequestFinancial
	db := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Scopes(
			DateRangeScope("maintenance_request_financials", filterQuery.DateRange),
			SearchScope("maintenance_request_financials", filterQuery.Search),
			mrfRequestScope(filters.MaintenanceRequestID),
			mrfSettlementTypeScope(filters.SettlementType),
			mrfTenantScope(filters.TenantID),
			PaginationScope(filterQuery.Page, filterQuery.PageSize),
			OrderScope("maintenance_request_financials", filterQuery.OrderBy, filterQuery.Order),
		)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	if err := db.Find(&financials).Error; err != nil {
		return nil, err
	}
	return &financials, nil
}

func (r *maintenanceRequestFinancialRepository) Count(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListMaintenanceRequestFinancialsFilter,
) (int64, error) {
	var count int64
	err := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Model(&models.MaintenanceRequestFinancial{}).
		Scopes(
			DateRangeScope("maintenance_request_financials", filterQuery.DateRange),
			SearchScope("maintenance_request_financials", filterQuery.Search),
			mrfRequestScope(filters.MaintenanceRequestID),
			mrfSettlementTypeScope(filters.SettlementType),
			mrfTenantScope(filters.TenantID),
		).
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}

// Update writes the row's own columns and nothing else.
//
// Associations are omitted deliberately: every read preloads ChargeInstance
// and Expense, and a plain Save would upsert them and re-derive the foreign
// keys from the loaded objects — quietly restoring a link that a conversion
// had just cleared.
func (r *maintenanceRequestFinancialRepository) Update(
	ctx context.Context,
	financial *models.MaintenanceRequestFinancial,
) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Omit(clause.Associations).
		Save(financial).Error
}

func (r *maintenanceRequestFinancialRepository) Delete(ctx context.Context, id string) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Where("id = ?", id).
		Delete(&models.MaintenanceRequestFinancial{}).Error
}
