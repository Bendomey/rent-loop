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
	ListActivityLogs(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters ListMaintenanceRequestActivityLogsFilter,
	) (*[]models.MaintenanceRequestActivityLog, error)
	CountActivityLogs(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters ListMaintenanceRequestActivityLogsFilter,
	) (int64, error)
	CreateExpense(ctx context.Context, expense *models.Expense) error
	ListExpenses(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters ListMaintenanceExpensesFilter,
	) (*[]models.Expense, error)
	CountExpenses(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters ListMaintenanceExpensesFilter,
	) (int64, error)
	DeleteExpense(ctx context.Context, expenseID string) error
	UpdateExpense(ctx context.Context, expense *models.Expense) error
	CreateComment(ctx context.Context, comment *models.MaintenanceRequestComment) error
	GetComment(ctx context.Context, id string) (*models.MaintenanceRequestComment, error)
	ListComments(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters ListMaintenanceRequestCommentsFilter,
	) (*[]models.MaintenanceRequestComment, error)
	CountComments(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters ListMaintenanceRequestCommentsFilter,
	) (int64, error)
	UpdateComment(ctx context.Context, comment *models.MaintenanceRequestComment) error
	DeleteComment(ctx context.Context, id string) error
	CountByStatus(ctx context.Context, filters ListMaintenanceRequestsFilter) (map[string]int64, error)
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
	ClientID          *string
	PropertyIDs       *[]string
	ClientUserID      *string
	UnitIDs           *[]string
	BlockIDs          *[]string
	LeaseID           *string
	Statuses          []string
	Priority          *string
	Category          *string
	AssignedWorkerID  *string
	AssignedManagerID *string
	TenantID          *string // when set, enforces visibility = TENANT_VISIBLE
}

type ListMaintenanceRequestActivityLogsFilter struct {
	MaintenanceRequestID    string
	Action                  *string
	PerformedByClientUserID *string
}

type ListMaintenanceExpensesFilter struct {
	MaintenanceRequestID string
}

type ListMaintenanceRequestCommentsFilter struct {
	MaintenanceRequestID  string
	CreatedByClientUserID *string
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

	db = ApplyPopulate(db, &models.MaintenanceRequest{}, query.Populate)

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
			IDsFilterScope("maintenance_requests", filterQuery.IDs),
			DateRangeScope("maintenance_requests", filterQuery.DateRange),
			SearchScope("maintenance_requests", filterQuery.Search),
			mrClientIDScope(filters.ClientID),
			mrPropertyIDsScope(filters.PropertyIDs),
			mrClientUserAccessScope(filters.ClientUserID),
			mrUnitIDsScope(filters.UnitIDs),
			mrBlockIDsScope(filters.BlockIDs),
			mrLeaseIDScope(filters.LeaseID),
			mrStatusScope(filters.Statuses),
			mrPriorityScope(filters.Priority),
			mrCategoryScope(filters.Category),
			mrAssignedWorkerScope(filters.AssignedWorkerID),
			mrAssignedManagerScope(filters.AssignedManagerID),
			mrTenantScope(filters.TenantID),
			PaginationScope(filterQuery.Page, filterQuery.PageSize),
			OrderScope("maintenance_requests", filterQuery.OrderBy, filterQuery.Order),
		)

	db = ApplyPopulate(db, &models.MaintenanceRequest{}, filterQuery.Populate)

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
			mrPropertyIDsScope(filters.PropertyIDs),
			mrClientUserAccessScope(filters.ClientUserID),
			mrUnitIDsScope(filters.UnitIDs),
			mrBlockIDsScope(filters.BlockIDs),
			mrLeaseIDScope(filters.LeaseID),
			mrStatusScope(filters.Statuses),
			mrPriorityScope(filters.Priority),
			mrCategoryScope(filters.Category),
			mrAssignedWorkerScope(filters.AssignedWorkerID),
			mrAssignedManagerScope(filters.AssignedManagerID),
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
	filterQuery lib.FilterQuery,
	filters ListMaintenanceRequestActivityLogsFilter,
) (*[]models.MaintenanceRequestActivityLog, error) {
	var logs []models.MaintenanceRequestActivityLog
	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Preload("PerformedByClientUser").
		Scopes(
			DateRangeScope("maintenance_request_activity_logs", filterQuery.DateRange),
			SearchScope("maintenance_request_activity_logs", filterQuery.Search),
			mrActivityLogRequestScope(filters.MaintenanceRequestID),
			mrActivityLogActionScope(filters.Action),
			mrActivityLogPerformedByScope(filters.PerformedByClientUserID),
			PaginationScope(filterQuery.Page, filterQuery.PageSize),
			OrderScope("maintenance_request_activity_logs", filterQuery.OrderBy, filterQuery.Order),
		).
		Find(&logs)
	if result.Error != nil {
		return nil, result.Error
	}
	return &logs, nil
}

func (r *maintenanceRequestRepository) CountActivityLogs(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListMaintenanceRequestActivityLogsFilter,
) (int64, error) {
	var count int64
	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Model(&models.MaintenanceRequestActivityLog{}).
		Scopes(
			DateRangeScope("maintenance_request_activity_logs", filterQuery.DateRange),
			SearchScope("maintenance_request_activity_logs", filterQuery.Search),
			mrActivityLogRequestScope(filters.MaintenanceRequestID),
			mrActivityLogActionScope(filters.Action),
			mrActivityLogPerformedByScope(filters.PerformedByClientUserID),
		).
		Count(&count)
	if result.Error != nil {
		return 0, result.Error
	}
	return count, nil
}

func (r *maintenanceRequestRepository) CreateExpense(ctx context.Context, expense *models.Expense) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Create(expense).Error
}

func (r *maintenanceRequestRepository) ListExpenses(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListMaintenanceExpensesFilter,
) (*[]models.Expense, error) {
	var expenses []models.Expense
	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Scopes(
			DateRangeScope("expenses", filterQuery.DateRange),
			SearchScope("expenses", filterQuery.Search),
			expenseRequestScope(filters.MaintenanceRequestID),
			PaginationScope(filterQuery.Page, filterQuery.PageSize),
			OrderScope("expenses", filterQuery.OrderBy, filterQuery.Order),
		).
		Preload("Invoices").
		Find(&expenses)
	if result.Error != nil {
		return nil, result.Error
	}
	return &expenses, nil
}

func (r *maintenanceRequestRepository) CountExpenses(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListMaintenanceExpensesFilter,
) (int64, error) {
	var count int64
	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Model(&models.Expense{}).
		Scopes(
			DateRangeScope("expenses", filterQuery.DateRange),
			SearchScope("expenses", filterQuery.Search),
			expenseRequestScope(filters.MaintenanceRequestID),
		).
		Count(&count)
	if result.Error != nil {
		return 0, result.Error
	}
	return count, nil
}

func (r *maintenanceRequestRepository) DeleteExpense(ctx context.Context, expenseID string) error {
	return r.DB.WithContext(ctx).Where("id = ?", expenseID).Delete(&models.Expense{}).Error
}

func (r *maintenanceRequestRepository) UpdateExpense(ctx context.Context, expense *models.Expense) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Save(expense).Error
}

func (r *maintenanceRequestRepository) CreateComment(
	ctx context.Context,
	comment *models.MaintenanceRequestComment,
) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Create(comment).Error
}

func (r *maintenanceRequestRepository) GetComment(
	ctx context.Context,
	id string,
) (*models.MaintenanceRequestComment, error) {
	var comment models.MaintenanceRequestComment
	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Where("id = ?", id).
		First(&comment)
	if result.Error != nil {
		return nil, result.Error
	}
	return &comment, nil
}

func (r *maintenanceRequestRepository) ListComments(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListMaintenanceRequestCommentsFilter,
) (*[]models.MaintenanceRequestComment, error) {
	var comments []models.MaintenanceRequestComment
	db := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Scopes(
			DateRangeScope("maintenance_request_comments", filterQuery.DateRange),
			SearchScope("maintenance_request_comments", filterQuery.Search),
			mrCommentRequestScope(filters.MaintenanceRequestID),
			mrCommentCreatedByScope(filters.CreatedByClientUserID),

			PaginationScope(filterQuery.Page, filterQuery.PageSize),
			OrderScope("maintenance_request_comments", filterQuery.OrderBy, filterQuery.Order),
		)

	db = ApplyPopulate(db, &models.MaintenanceRequestComment{}, filterQuery.Populate)

	result := db.Find(&comments)
	if result.Error != nil {
		return nil, result.Error
	}
	return &comments, nil
}

func (r *maintenanceRequestRepository) CountComments(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListMaintenanceRequestCommentsFilter,
) (int64, error) {
	var count int64
	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Model(&models.MaintenanceRequestComment{}).
		Scopes(
			DateRangeScope("maintenance_request_comments", filterQuery.DateRange),
			SearchScope("maintenance_request_comments", filterQuery.Search),
			mrCommentRequestScope(filters.MaintenanceRequestID),
			mrCommentCreatedByScope(filters.CreatedByClientUserID),
		).
		Count(&count)
	if result.Error != nil {
		return 0, result.Error
	}
	return count, nil
}

func (r *maintenanceRequestRepository) UpdateComment(
	ctx context.Context,
	comment *models.MaintenanceRequestComment,
) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Save(comment).Error
}

func (r *maintenanceRequestRepository) DeleteComment(ctx context.Context, id string) error {
	return lib.ResolveDB(ctx, r.DB).
		WithContext(ctx).
		Where("id = ?", id).
		Delete(&models.MaintenanceRequestComment{}).
		Error
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
			Table("properties").
			Select("properties.id").
			Where("properties.client_id = ? AND properties.deleted_at IS NULL", *clientID)
		return db.Where("maintenance_requests.property_id IN (?)", subQuery)
	}
}

func mrClientUserAccessScope(clientUserID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if clientUserID == nil {
			return db
		}
		return db.Where(
			"maintenance_requests.property_id IN (?)",
			accessiblePropertyIDsSubQuery(db, *clientUserID),
		)
	}
}

func mrPropertyIDsScope(propertyIDs *[]string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyIDs == nil {
			return db
		}
		return db.Where("maintenance_requests.property_id IN (?)", *propertyIDs)
	}
}

// mrUnitIDsScope matches requests that target any of the given units. EXISTS
// rather than a join, so a request targeting two of the selected units is still
// returned exactly once.
func mrUnitIDsScope(unitIDs *[]string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if unitIDs == nil {
			return db
		}
		return db.Where(
			`EXISTS (
				SELECT 1 FROM maintenance_request_assets a
				WHERE a.maintenance_request_id = maintenance_requests.id
				  AND a.asset_type = 'UNIT'
				  AND a.unit_id IN (?)
				  AND a.deleted_at IS NULL
			)`,
			*unitIDs,
		)
	}
}

func mrBlockIDsScope(blockIDs *[]string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if blockIDs == nil {
			return db
		}
		return db.Where(
			`EXISTS (
				SELECT 1 FROM maintenance_request_assets a
				WHERE a.maintenance_request_id = maintenance_requests.id
				  AND a.asset_type = 'BLOCK'
				  AND a.property_block_id IN (?)
				  AND a.deleted_at IS NULL
			)`,
			*blockIDs,
		)
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

func mrStatusScope(statuses []string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if len(statuses) == 0 {
			return db
		}
		return db.Where("maintenance_requests.status IN ?", statuses)
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

func mrAssignedManagerScope(managerID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if managerID == nil {
			return db
		}
		return db.Where("maintenance_requests.assigned_manager_id = ?", *managerID)
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

func mrActivityLogRequestScope(maintenanceRequestID string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("maintenance_request_activity_logs.maintenance_request_id = ?", maintenanceRequestID)
	}
}

func mrActivityLogActionScope(action *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if action == nil {
			return db
		}
		return db.Where("maintenance_request_activity_logs.action = ?", *action)
	}
}

func mrActivityLogPerformedByScope(clientUserID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if clientUserID == nil {
			return db
		}
		return db.Where("maintenance_request_activity_logs.performed_by_client_user_id = ?", *clientUserID)
	}
}

func expenseRequestScope(maintenanceRequestID string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where(
			"expenses.context_type = ? AND expenses.context_maintenance_request_id = ?",
			"MAINTENANCE",
			maintenanceRequestID,
		)
	}
}

func expensePaidByScope(paidBy *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if paidBy == nil {
			return db
		}
		return db.Where("expenses.paid_by = ?", *paidBy)
	}
}

func expenseBillableScope(billable *bool) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if billable == nil {
			return db
		}
		return db.Where("expenses.billable_to_tenant = ?", *billable)
	}
}

func mrCommentRequestScope(maintenanceRequestID string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("maintenance_request_comments.maintenance_request_id = ?", maintenanceRequestID)
	}
}

func mrCommentCreatedByScope(clientUserID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if clientUserID == nil {
			return db
		}
		return db.Where("maintenance_request_comments.created_by_client_user_id = ?", *clientUserID)
	}
}

func (r *maintenanceRequestRepository) CountByStatus(
	ctx context.Context,
	filters ListMaintenanceRequestsFilter,
) (map[string]int64, error) {
	type statusCount struct {
		Status string
		Count  int64
	}
	var results []statusCount
	err := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Model(&models.MaintenanceRequest{}).
		Select("status, count(*) as count").
		Scopes(
			mrClientIDScope(filters.ClientID),
			mrPropertyIDsScope(filters.PropertyIDs),
			mrClientUserAccessScope(filters.ClientUserID),
			mrUnitIDsScope(filters.UnitIDs),
			mrBlockIDsScope(filters.BlockIDs),
			mrLeaseIDScope(filters.LeaseID),
			mrTenantScope(filters.TenantID),
		).
		Group("status").
		Find(&results).Error
	if err != nil {
		return nil, err
	}
	out := make(map[string]int64, len(results))
	for _, sc := range results {
		out[sc.Status] = sc.Count
	}
	return out, nil
}
