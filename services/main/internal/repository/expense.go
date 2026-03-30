package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type ListExpensesFilter struct {
	PropertyID                  string
	ContextLeaseID              *string
	ContextMaintenanceRequestID *string
	ContextType                 *string
}

type GetExpenseQuery struct {
	ID       string
	Populate *[]string
}

type ExpenseRepository interface {
	Create(ctx context.Context, expense *models.Expense) error
	GetOne(ctx context.Context, query GetExpenseQuery) (*models.Expense, error)
	List(ctx context.Context, filterQuery lib.FilterQuery, filters ListExpensesFilter) (*[]models.Expense, error)
	Count(ctx context.Context, filterQuery lib.FilterQuery, filters ListExpensesFilter) (int64, error)
	Delete(ctx context.Context, id string) error
	Update(ctx context.Context, expense *models.Expense) error
}

type expenseRepository struct {
	DB *gorm.DB
}

func NewExpenseRepository(db *gorm.DB) ExpenseRepository {
	return &expenseRepository{DB: db}
}

func expensePropertyScope(propertyID string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyID == "" {
			return db
		}
		return db.Where("expenses.property_id = ?", propertyID)
	}
}

func expenseLeaseScope(leaseID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if leaseID == nil {
			return db
		}
		return db.Where("expenses.context_lease_id = ?", *leaseID)
	}
}

func expenseMaintenanceRequestScope(requestID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if requestID == nil {
			return db
		}
		return db.Where("expenses.context_maintenance_request_id = ?", *requestID)
	}
}

func expenseContextTypeScope(contextType *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if contextType == nil {
			return db
		}
		return db.Where("expenses.context_type = ?", *contextType)
	}
}

func (r *expenseRepository) Create(ctx context.Context, expense *models.Expense) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Create(expense).Error
}

func (r *expenseRepository) GetOne(ctx context.Context, query GetExpenseQuery) (*models.Expense, error) {
	var expense models.Expense
	db := r.DB.WithContext(ctx).Where("expenses.id = ?", query.ID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&expense)
	if result.Error != nil {
		return nil, result.Error
	}
	return &expense, nil
}

func (r *expenseRepository) List(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListExpensesFilter,
) (*[]models.Expense, error) {
	var expenses []models.Expense
	db := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Scopes(
			DateRangeScope("expenses", filterQuery.DateRange),
			SearchScope("expenses", filterQuery.Search),
			expensePropertyScope(filters.PropertyID),
			expenseLeaseScope(filters.ContextLeaseID),
			expenseMaintenanceRequestScope(filters.ContextMaintenanceRequestID),
			expenseContextTypeScope(filters.ContextType),
			PaginationScope(filterQuery.Page, filterQuery.PageSize),
			OrderScope("expenses", filterQuery.OrderBy, filterQuery.Order),
		)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	result := db.Find(&expenses)
	if result.Error != nil {
		return nil, result.Error
	}
	return &expenses, nil
}

func (r *expenseRepository) Count(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListExpensesFilter,
) (int64, error) {
	var count int64
	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Model(&models.Expense{}).
		Scopes(
			DateRangeScope("expenses", filterQuery.DateRange),
			SearchScope("expenses", filterQuery.Search),
			expensePropertyScope(filters.PropertyID),
			expenseLeaseScope(filters.ContextLeaseID),
			expenseMaintenanceRequestScope(filters.ContextMaintenanceRequestID),
			expenseContextTypeScope(filters.ContextType),
		).
		Count(&count)
	if result.Error != nil {
		return 0, result.Error
	}
	return count, nil
}

func (r *expenseRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Where("id = ?", id).Delete(&models.Expense{}).Error
}

func (r *expenseRepository) Update(ctx context.Context, expense *models.Expense) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Save(expense).Error
}
