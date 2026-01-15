package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type ClientApplicationRepository interface {
	GetByID(ctx context.Context, id string) (*models.ClientApplication, error)
	Create(ctx context.Context, clientApp *models.ClientApplication) error
	List(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters ListClientApplicationsFilter,
	) (*[]models.ClientApplication, error)
	Count(ctx context.Context, filterQuery lib.FilterQuery, filters ListClientApplicationsFilter) (int64, error)
	UpdateClientApplication(ctx context.Context, clientApp *models.ClientApplication) error
}

type clientApplicationRepository struct {
	db *gorm.DB
}

func NewClientApplicationRepository(db *gorm.DB) ClientApplicationRepository {
	return &clientApplicationRepository{db}
}

func (r *clientApplicationRepository) GetByID(ctx context.Context, id string) (*models.ClientApplication, error) {
	var clientApp models.ClientApplication
	if err := r.db.WithContext(ctx).First(&clientApp, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &clientApp, nil
}

func (r *clientApplicationRepository) Create(ctx context.Context, clientApp *models.ClientApplication) error {
	return r.db.WithContext(ctx).Create(clientApp).Error
}

func (r *clientApplicationRepository) List(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListClientApplicationsFilter,
) (*[]models.ClientApplication, error) {
	var clientApplications []models.ClientApplication

	db := r.db.WithContext(ctx).
		Scopes(
			IDsFilterScope("client_applications", filters.IDs),
			DateRangeScope("client_applications", filterQuery.DateRange),
			SearchScope("client_applications", filterQuery.Search),
			StatusFilterScope(filters.Status),
			TypeFilterScope(filters.Type),
			SubTypeFilterScope(filters.SubType),

			PaginationScope(filterQuery.Page, filterQuery.PageSize),
			OrderScope("client_applications", filterQuery.OrderBy, filterQuery.Order),
		)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	results := db.Find(&clientApplications)

	if results.Error != nil {
		return nil, results.Error
	}

	return &clientApplications, nil
}

func (r *clientApplicationRepository) Count(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListClientApplicationsFilter,
) (int64, error) {
	var count int64

	result := r.db.
		WithContext(ctx).
		Model(&models.ClientApplication{}).
		Scopes(
			IDsFilterScope("client_applications", filters.IDs),
			DateRangeScope("client_applications", filterQuery.DateRange),
			SearchScope("client_applications", filterQuery.Search),
			StatusFilterScope(filters.Status),
			TypeFilterScope(filters.Type),
			SubTypeFilterScope(filters.SubType),

			PaginationScope(filterQuery.Page, filterQuery.PageSize),
			OrderScope("client_applications", filterQuery.OrderBy, filterQuery.Order),
		).
		Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

type ListClientApplicationsFilter struct {
	Status  *string
	Type    *string
	SubType *string
	IDs     *[]string
}

func (r *clientApplicationRepository) UpdateClientApplication(
	ctx context.Context,
	clientApplication *models.ClientApplication,
) error {
	return r.db.WithContext(ctx).Save(clientApplication).Error
}

// Private methods
func StatusFilterScope(status *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if status == nil {
			return db
		}

		return db.Where("client_applications.status = ?", *status)
	}
}

func TypeFilterScope(input *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if input == nil {
			return db
		}

		return db.Where("client_applications.type = ?", *input)
	}
}

func SubTypeFilterScope(subType *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if subType == nil {
			return db
		}

		return db.Where("client_applications.sub_type = ?", *subType)
	}
}
