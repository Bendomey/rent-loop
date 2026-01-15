package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type ClientUserPropertyRepository interface {
	Create(context context.Context, clientUserProperty *models.ClientUserProperty) error
	DeleteByPropertyID(context context.Context, propertyID string) error
	DeleteByClientUserID(context context.Context, input UnlinkClientUserFromPropertyQuery) error
	List(
		ctx context.Context,
		filterQuery ListClientUserPropertiesFilter,
	) (*[]models.ClientUserProperty, error)
	Count(
		ctx context.Context,
		filterQuery ListClientUserPropertiesFilter,
	) (int64, error)
	BulkCreate(ctx context.Context, clientUserProperty *[]models.ClientUserProperty) error
	UnlinkPropertyFromClientUsers(context context.Context, input UnlinkPropertyFromClientUsersQuery) error
	GetWithPopulate(ctx context.Context, query ClientUserPropertyWithPopulateQuery) (*models.ClientUserProperty, error)
}

type clientUserPropertyRepository struct {
	DB *gorm.DB
}

func NewClientUserPropertyRepository(db *gorm.DB) ClientUserPropertyRepository {
	return &clientUserPropertyRepository{db}
}

func (r *clientUserPropertyRepository) Create(
	ctx context.Context,
	clientUserProperty *models.ClientUserProperty,
) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Create(clientUserProperty).Error
}

func (r *clientUserPropertyRepository) BulkCreate(
	ctx context.Context,
	clientUserProperties *[]models.ClientUserProperty,
) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Create(clientUserProperties).Error
}

func (r *clientUserPropertyRepository) DeleteByPropertyID(
	ctx context.Context,
	propertyID string,
) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).
		Delete(&models.ClientUserProperty{}, "property_id = ?", propertyID).
		Error
}

type UnlinkClientUserFromPropertyQuery struct {
	ClientUserID string
	PropertyIDs  []string
}

func (r *clientUserPropertyRepository) DeleteByClientUserID(
	ctx context.Context,
	input UnlinkClientUserFromPropertyQuery,
) error {
	db := lib.ResolveDB(ctx, r.DB)

	query := db.WithContext(ctx).
		Where("client_user_id = ?", input.ClientUserID).
		Where("property_id IN (?)", input.PropertyIDs)

	result := query.Delete(&models.ClientUserProperty{}).Error
	return result
}

type UnlinkPropertyFromClientUsersQuery struct {
	PropertyID    string
	ClientUserIDs []string
}

func (r *clientUserPropertyRepository) UnlinkPropertyFromClientUsers(
	ctx context.Context,
	input UnlinkPropertyFromClientUsersQuery,
) error {
	db := lib.ResolveDB(ctx, r.DB)

	query := db.WithContext(ctx).
		Where("property_id = ?", input.PropertyID).
		Where("client_user_id IN (?)", input.ClientUserIDs)

	result := query.Delete(&models.ClientUserProperty{}).Error
	return result
}

type ClientUserPropertyWithPopulateQuery struct {
	ClientUserPropertyID string
	Populate             *[]string
}

func (r *clientUserPropertyRepository) GetWithPopulate(
	ctx context.Context,
	query ClientUserPropertyWithPopulateQuery,
) (*models.ClientUserProperty, error) {
	var clientUserProperty models.ClientUserProperty

	db := r.DB.WithContext(ctx).Where("id = ?", query.ClientUserPropertyID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&clientUserProperty)
	if result.Error != nil {
		return nil, result.Error
	}

	return &clientUserProperty, nil
}

type ListClientUserPropertiesFilter struct {
	lib.FilterQuery
	ClientUserID *string
	PropertyID   *string
	Role         *string
	IDs          *[]string
}

func (r *clientUserPropertyRepository) List(
	ctx context.Context,
	filterQuery ListClientUserPropertiesFilter,
) (*[]models.ClientUserProperty, error) {
	var clientUserproperties []models.ClientUserProperty

	db := r.DB.WithContext(ctx).Scopes(
		IDsFilterScope("client_user_properties", filterQuery.IDs),
		DateRangeScope("client_user_properties", filterQuery.DateRange),
		SearchScope("client_user_properties", filterQuery.Search),

		clientUserIDScope(filterQuery.ClientUserID),
		propertyIDScope(filterQuery.PropertyID),
		roleScope(filterQuery.Role),

		PaginationScope(filterQuery.Page, filterQuery.PageSize),
		OrderScope("client_user_properties", filterQuery.OrderBy, filterQuery.Order),
	)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}
	results := db.Find(&clientUserproperties)

	if results.Error != nil {
		return nil, results.Error
	}
	return &clientUserproperties, nil
}

func (r *clientUserPropertyRepository) Count(
	ctx context.Context,
	filterQuery ListClientUserPropertiesFilter,
) (int64, error) {
	var count int64

	result := r.DB.WithContext(ctx).
		Model(&models.ClientUserProperty{}).
		Scopes(
			IDsFilterScope("client_user_properties", filterQuery.IDs),
			DateRangeScope("client_user_properties", filterQuery.DateRange),
			SearchScope("client_user_properties", filterQuery.Search),

			clientUserIDScope(filterQuery.ClientUserID),
			propertyIDScope(filterQuery.PropertyID),
			roleScope(filterQuery.Role),
		).Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func clientUserIDScope(clientUserID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if clientUserID == nil {
			return db
		}
		return db.Where("client_user_properties.client_user_id = ?", clientUserID)
	}
}

func propertyIDScope(propertyID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyID == nil {
			return db
		}
		return db.Where("client_user_properties.property_id = ?", propertyID)
	}
}

func roleScope(role *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if role == nil {
			return db
		}
		return db.Where("client_user_properties.role = ?", role)
	}
}
