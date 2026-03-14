package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type MaintenanceRequestRepository interface {
	Create(ctx context.Context, mr *models.MaintenanceRequest) error
	GetOneWithPopulate(ctx context.Context, query GetMaintenanceRequestQuery) (*models.MaintenanceRequest, error)
	List(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters ListMaintenanceRequestsFilter,
	) (*[]models.MaintenanceRequest, error)
	Count(ctx context.Context, filterQuery lib.FilterQuery, filters ListMaintenanceRequestsFilter) (int64, error)
	Update(ctx context.Context, mr *models.MaintenanceRequest) error
	Delete(ctx context.Context, id string) error
	CreateActivityLog(ctx context.Context, log *models.MaintenanceRequestActivityLog) error
	ListActivityLogs(ctx context.Context, maintenanceRequestID string) (*[]models.MaintenanceRequestActivityLog, error)
	CreateExpense(ctx context.Context, expense *models.Expense) error
	ListExpenses(ctx context.Context, maintenanceRequestID string) (*[]models.Expense, error)
	DeleteExpense(ctx context.Context, expenseID string) error
	UpdateExpense(ctx context.Context, expense *models.Expense) error
	GetUnbilledExpenses(ctx context.Context, maintenanceRequestID string) (*[]models.Expense, error)
}

type maintenanceRequestRepository struct {
	DB *gorm.DB
}

func NewMaintenanceRequestRepository(DB *gorm.DB) MaintenanceRequestRepository {
	return &maintenanceRequestRepository{DB}
}

type GetMaintenanceRequestQuery struct {
	ID       string
	Populate *[]string
}

type ListMaintenanceRequestsFilter struct {
	ClientID         *string
	PropertyID       *string
	UnitID           *string
	LeaseID          *string
	Status           *string
	Priority         *string
	Category         *string
	AssignedWorkerID *string
	TenantID         *string // when set, enforces visibility = TENANT_VISIBLE
}

func (r *maintenanceRequestRepository) Create(ctx context.Context, mr *models.MaintenanceRequest) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Create(mr).Error
}

func (r *maintenanceRequestRepository) GetOneWithPopulate(
	ctx context.Context,
	query GetMaintenanceRequestQuery,
) (*models.MaintenanceRequest, error) {
	var mr models.MaintenanceRequest
	db := lib.ResolveDB(ctx, r.DB).WithContext(ctx).Where("maintenance_requests.id = ?", query.ID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&mr)
	if result.Error != nil {
		return nil, result.Error
	}
	return &mr, nil
}

func (r *maintenanceRequestRepository) List(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListMaintenanceRequestsFilter,
) (*[]models.MaintenanceRequest, error) {
	var mrs []models.MaintenanceRequest

	db := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Scopes(
			DateRangeScope("maintenance_requests", filterQuery.DateRange),
			SearchScope("maintenance_requests", filterQuery.Search),
			mrClientIDScope(filters.ClientID),
			mrPropertyIDScope(filters.PropertyID),
			mrUnitIDScope(filters.UnitID),
			mrLeaseIDScope(filters.LeaseID),
			mrStatusScope(filters.Status),
			mrPriorityScope(filters.Priority),
			mrCategoryScope(filters.Category),
			mrAssignedWorkerScope(filters.AssignedWorkerID),
			mrTenantScope(filters.TenantID),
			PaginationScope(filterQuery.Page, filterQuery.PageSize),
			OrderScope("maintenance_requests", filterQuery.OrderBy, filterQuery.Order),
		)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	result := db.Find(&mrs)
	if result.Error != nil {
		return nil, result.Error
	}
	return &mrs, nil
}

func (r *maintenanceRequestRepository) Count(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListMaintenanceRequestsFilter,
) (int64, error) {
	var count int64

	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Model(&models.MaintenanceRequest{}).
		Scopes(
			DateRangeScope("maintenance_requests", filterQuery.DateRange),
			SearchScope("maintenance_requests", filterQuery.Search),
			mrClientIDScope(filters.ClientID),
			mrPropertyIDScope(filters.PropertyID),
			mrUnitIDScope(filters.UnitID),
			mrLeaseIDScope(filters.LeaseID),
			mrStatusScope(filters.Status),
			mrPriorityScope(filters.Priority),
			mrCategoryScope(filters.Category),
			mrAssignedWorkerScope(filters.AssignedWorkerID),
			mrTenantScope(filters.TenantID),
		).
		Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}
	return count, nil
}

func (r *maintenanceRequestRepository) Update(ctx context.Context, mr *models.MaintenanceRequest) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Save(mr).Error
}

func (r *maintenanceRequestRepository) Delete(ctx context.Context, id string) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Where("id = ?", id).Delete(&models.MaintenanceRequest{}).Error
}

func (r *maintenanceRequestRepository) CreateActivityLog(
	ctx context.Context,
	log *models.MaintenanceRequestActivityLog,
) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Create(log).Error
}

func (r *maintenanceRequestRepository) ListActivityLogs(
	ctx context.Context,
	maintenanceRequestID string,
) (*[]models.MaintenanceRequestActivityLog, error) {
	var logs []models.MaintenanceRequestActivityLog
	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Where("maintenance_request_id = ?", maintenanceRequestID).
		Order("created_at asc").
		Find(&logs)
	if result.Error != nil {
		return nil, result.Error
	}
	return &logs, nil
}

func (r *maintenanceRequestRepository) CreateExpense(ctx context.Context, expense *models.Expense) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Create(expense).Error
}

func (r *maintenanceRequestRepository) ListExpenses(
	ctx context.Context,
	maintenanceRequestID string,
) (*[]models.Expense, error) {
	var expenses []models.Expense
	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Where("context_type = ? AND context_maintenance_request_id = ?", "MAINTENANCE", maintenanceRequestID).
		Order("created_at asc").
		Find(&expenses)
	if result.Error != nil {
		return nil, result.Error
	}
	return &expenses, nil
}

func (r *maintenanceRequestRepository) DeleteExpense(ctx context.Context, expenseID string) error {
	return r.DB.WithContext(ctx).Where("id = ?", expenseID).Delete(&models.Expense{}).Error
}

func (r *maintenanceRequestRepository) UpdateExpense(ctx context.Context, expense *models.Expense) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Save(expense).Error
}

func (r *maintenanceRequestRepository) GetUnbilledExpenses(
	ctx context.Context,
	maintenanceRequestID string,
) (*[]models.Expense, error) {
	var expenses []models.Expense
	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Where(
			"context_type = ? AND context_maintenance_request_id = ? AND billable_to_tenant = true AND invoice_id IS NULL",
			"MAINTENANCE",
			maintenanceRequestID,
		).
		Find(&expenses)
	if result.Error != nil {
		return nil, result.Error
	}
	return &expenses, nil
}

// Scopes
//
// All cross-table filters use subqueries on fresh DB sessions to avoid
// polluting the main query with joins that could conflict with GORM preloads,
// produce duplicate rows, or bleed accumulated conditions into sub-selects.
// Soft-deleted units and properties are explicitly excluded in every subquery.

func mrClientIDScope(clientID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if clientID == nil {
			return db
		}
		subQuery := db.Session(&gorm.Session{NewDB: true}).
			Table("units").
			Select("units.id").
			Joins("JOIN properties ON properties.id = units.property_id").
			Where("properties.client_id = ? AND units.deleted_at IS NULL AND properties.deleted_at IS NULL", *clientID)
		return db.Where("maintenance_requests.unit_id IN (?)", subQuery)
	}
}

func mrPropertyIDScope(propertyID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyID == nil {
			return db
		}
		subQuery := db.Session(&gorm.Session{NewDB: true}).
			Table("units").
			Select("id").
			Where("property_id = ? AND deleted_at IS NULL", *propertyID)
		return db.Where("maintenance_requests.unit_id IN (?)", subQuery)
	}
}

func mrUnitIDScope(unitID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if unitID == nil {
			return db
		}
		return db.Where("maintenance_requests.unit_id = ?", *unitID)
	}
}

func mrLeaseIDScope(leaseID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if leaseID == nil {
			return db
		}
		return db.Where("maintenance_requests.lease_id = ?", *leaseID)
	}
}

func mrStatusScope(status *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if status == nil {
			return db
		}
		return db.Where("maintenance_requests.status = ?", *status)
	}
}

func mrPriorityScope(priority *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if priority == nil {
			return db
		}
		return db.Where("maintenance_requests.priority = ?", *priority)
	}
}

func mrCategoryScope(category *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if category == nil {
			return db
		}
		return db.Where("maintenance_requests.category = ?", *category)
	}
}

func mrAssignedWorkerScope(workerID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if workerID == nil {
			return db
		}
		return db.Where("maintenance_requests.assigned_worker_id = ?", *workerID)
	}
}

// mrTenantScope filters by tenant and enforces TENANT_VISIBLE visibility.
func mrTenantScope(tenantID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if tenantID == nil {
			return db
		}
		return db.Where(
			"maintenance_requests.created_by_tenant_id = ? AND maintenance_requests.visibility = ?",
			*tenantID,
			"TENANT_VISIBLE",
		)
	}
}
