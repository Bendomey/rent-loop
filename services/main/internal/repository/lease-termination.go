package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type LeaseTerminationRepository interface {
	Create(ctx context.Context, termination *models.LeaseTermination) error
	GetOne(ctx context.Context, query GetTerminatedLeaseQuery) (*models.LeaseTermination, error)
	List(ctx context.Context, filter ListLeaseTerminationsFilter) (*[]models.LeaseTermination, error)
	Count(ctx context.Context, filter ListLeaseTerminationsFilter) (int64, error)
	Update(ctx context.Context, termination *models.LeaseTermination) error
}

type leaseTerminationRepository struct {
	DB *gorm.DB
}

func NewLeaseTerminationRepository(db *gorm.DB) LeaseTerminationRepository {
	return &leaseTerminationRepository{DB: db}
}

func (r *leaseTerminationRepository) Create(ctx context.Context, termination *models.LeaseTermination) error {
	db := lib.ResolveDB(ctx, r.DB)
	return db.WithContext(ctx).Create(termination).Error
}

type GetTerminatedLeaseQuery struct {
	ID       string
	LeaseID  string
	Populate *[]string
}

func (r *leaseTerminationRepository) GetOne(ctx context.Context, query GetTerminatedLeaseQuery) (*models.LeaseTermination, error) {
	var termination models.LeaseTermination

	db := r.DB.WithContext(ctx).Where("id = ? AND lease_id = ?", query.ID, query.LeaseID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	if result := db.First(&termination); result.Error != nil {
		return nil, result.Error
	}

	return &termination, nil
}

type ListLeaseTerminationsFilter struct {
	lib.FilterQuery
	LeaseID *string
	Status  *string
}

func (r *leaseTerminationRepository) List(ctx context.Context, filter ListLeaseTerminationsFilter) (*[]models.LeaseTermination, error) {
	var terminations []models.LeaseTermination

	db := r.DB.WithContext(ctx).Scopes(
		leaseTerminationFilterScope("lease_id", filter.LeaseID),
		leaseTerminationFilterScope("status", filter.Status),
		PaginationScope(filter.Page, filter.PageSize),
		OrderScope("lease_terminations", filter.OrderBy, filter.Order),
	)

	if filter.Populate != nil {
		for _, field := range *filter.Populate {
			db = db.Preload(field)
		}
	}

	if result := db.Find(&terminations); result.Error != nil {
		return nil, result.Error
	}
	return &terminations, nil
}

func (r *leaseTerminationRepository) Count(ctx context.Context, filter ListLeaseTerminationsFilter) (int64, error) {
	var count int64
	result := r.DB.WithContext(ctx).Model(&models.LeaseTermination{}).Scopes(
		leaseTerminationFilterScope("lease_id", filter.LeaseID),
		leaseTerminationFilterScope("status", filter.Status),
	).Count(&count)
	if result.Error != nil {
		return 0, result.Error
	}
	return count, nil
}

func (r *leaseTerminationRepository) Update(ctx context.Context, termination *models.LeaseTermination) error {
	db := lib.ResolveDB(ctx, r.DB)
	return db.WithContext(ctx).Save(termination).Error
}

func leaseTerminationFilterScope(field string, value *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if value == nil {
			return db
		}
		return db.Where("lease_terminations."+field+" = ?", *value)
	}
}
