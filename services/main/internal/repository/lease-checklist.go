package repository

import (
	"context"
	"fmt"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type LeaseChecklistRepository interface {
	Create(context context.Context, leaseChecklist *models.LeaseChecklist) error
	GetOneWithPopulate(context context.Context, query GetLeaseCheckListQuery) (*models.LeaseChecklist, error)
	Update(context context.Context, leaseChecklist *models.LeaseChecklist) error
	Delete(context context.Context, query DeleteLeaseChecklistQuery) error
	List(
		context context.Context,
		filters ListLeaseChecklistsFilter,
	) (*[]models.LeaseChecklist, error)
	Count(context context.Context, filters ListLeaseChecklistsFilter) (int64, error)
}

type leaseChecklistRepository struct {
	db *gorm.DB
}

func NewLeaseChecklistRepository(db *gorm.DB) LeaseChecklistRepository {
	return &leaseChecklistRepository{db: db}
}

func (r *leaseChecklistRepository) Create(ctx context.Context, leaseChecklist *models.LeaseChecklist) error {
	db := lib.ResolveDB(ctx, r.db)

	return db.WithContext(ctx).Create(leaseChecklist).Error
}

type GetLeaseCheckListQuery struct {
	ID       string
	LeaseID  string
	Populate *[]string
}

func (r *leaseChecklistRepository) GetOneWithPopulate(
	ctx context.Context,
	query GetLeaseCheckListQuery,
) (*models.LeaseChecklist, error) {
	var leaseChecklist models.LeaseChecklist

	db := r.db.WithContext(ctx).Where("id = ? AND lease_id = ?", query.ID, query.LeaseID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&leaseChecklist)
	if result.Error != nil {
		return nil, result.Error
	}

	return &leaseChecklist, nil
}

func (r *leaseChecklistRepository) Update(ctx context.Context, leaseChecklist *models.LeaseChecklist) error {
	db := lib.ResolveDB(ctx, r.db)

	return db.WithContext(ctx).Save(leaseChecklist).Error
}

type DeleteLeaseChecklistQuery struct {
	LeaseID          string
	LeaseChecklistID string
}

func (r *leaseChecklistRepository) Delete(ctx context.Context, query DeleteLeaseChecklistQuery) error {
	db := lib.ResolveDB(ctx, r.db)

	return db.WithContext(ctx).
		Delete(&models.LeaseChecklist{}, "id = ? AND lease_id = ?", query.LeaseChecklistID, query.LeaseID).
		Error
}

type ListLeaseChecklistsFilter struct {
	lib.FilterQuery
	LeaseId string
	Type    *string
}

func (r *leaseChecklistRepository) List(
	ctx context.Context,
	filters ListLeaseChecklistsFilter,
) (*[]models.LeaseChecklist, error) {
	var leaseChecklists []models.LeaseChecklist

	db := r.db.WithContext(ctx).Scopes(
		IDsFilterScope("lease_checklists", filters.IDs),
		leaseChecklistFilterScope("lease_id", &filters.LeaseId),
		leaseChecklistFilterScope("type", filters.Type),
		DateRangeScope("lease_checklists", filters.DateRange),
		SearchScope("lease_checklists", filters.Search),

		PaginationScope(filters.Page, filters.PageSize),
		OrderScope("lease_checklists", filters.OrderBy, filters.Order),
	)

	if filters.Populate != nil {
		for _, field := range *filters.Populate {
			db = db.Preload(field)
		}
	}

	results := db.Find(&leaseChecklists)
	if results.Error != nil {
		return nil, results.Error
	}

	return &leaseChecklists, nil
}

func (r *leaseChecklistRepository) Count(
	ctx context.Context,
	filters ListLeaseChecklistsFilter,
) (int64, error) {
	var count int64

	result := r.db.WithContext(ctx).Model(&models.LeaseChecklist{}).Scopes(
		IDsFilterScope("lease_checklists", filters.IDs),
		leaseChecklistFilterScope("lease_id", &filters.LeaseId),
		leaseChecklistFilterScope("type", filters.Type),
		DateRangeScope("lease_checklists", filters.DateRange),
		SearchScope("lease_checklists", filters.Search),
	).Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func leaseChecklistFilterScope(field string, value *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if value == nil {
			return db
		}

		query := fmt.Sprintf("lease_checklists.%s = ?", field)
		return db.Where(query, value)
	}
}
