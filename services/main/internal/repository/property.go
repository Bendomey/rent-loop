package repository

import (
	"context"
	"fmt"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type PropertyRepository interface {
	Create(context context.Context, property *models.Property) error
	GetByID(context context.Context, query GetPropertyQuery) (*models.Property, error)
	List(context context.Context, filterQuery ListPropertiesFilter) (*[]models.Property, error)
	Count(context context.Context, filterQuery ListPropertiesFilter) (int64, error)
	Update(context context.Context, property *models.Property) error
	Delete(context context.Context, propertyID string) error
	GetByQuery(context context.Context, query map[string]any) (*models.Property, error)
	GetByQueryUnscoped(context context.Context, query map[string]any) (*models.Property, error)
	GetBySlug(context context.Context, query GetPropertyBySlugQuery) (*models.Property, error)
	RestoreByID(context context.Context, propertyID string) error
}

type propertyRepository struct {
	DB *gorm.DB
}

func NewPropertyRepository(DB *gorm.DB) PropertyRepository {
	return &propertyRepository{DB}
}

func (r *propertyRepository) Create(ctx context.Context, property *models.Property) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Create(property).Error
}

type GetPropertyQuery struct {
	ID       string
	Populate *[]string
}

func (r *propertyRepository) GetByID(
	ctx context.Context,
	query GetPropertyQuery,
) (*models.Property, error) {
	var property models.Property
	db := r.DB.WithContext(ctx).Where("id = ?", query.ID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&property)

	if result.Error != nil {
		return nil, result.Error
	}

	return &property, nil
}

type ListPropertiesFilter struct {
	lib.FilterQuery
	ClientID string
	Status   *string
	Type     *string
	Archived *bool
}

func (r *propertyRepository) List(
	ctx context.Context,
	filterQuery ListPropertiesFilter,
) (*[]models.Property, error) {
	var properties []models.Property

	db := r.DB.WithContext(ctx).Scopes(
		IDsFilterScope("properties", filterQuery.IDs),
		ClientFilterScope("properties", filterQuery.ClientID),
		propertyStatusScope("properties", filterQuery.Status),
		propertyTypeScope("properties", filterQuery.Type),
		propertyArchivedScope(filterQuery.Archived),
		DateRangeScope("properties", filterQuery.DateRange),
		SearchScope("properties", filterQuery.Search),

		PaginationScope(filterQuery.Page, filterQuery.PageSize),
		OrderScope("properties", filterQuery.OrderBy, filterQuery.Order),
	)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}
	results := db.Find(&properties)

	if results.Error != nil {
		return nil, results.Error
	}
	return &properties, nil
}

func (r *propertyRepository) Count(
	ctx context.Context,
	filterQuery ListPropertiesFilter,
) (int64, error) {
	var count int64

	result := r.DB.WithContext(ctx).
		Model(&models.Property{}).
		Scopes(
			IDsFilterScope("properties", filterQuery.IDs),
			ClientFilterScope("properties", filterQuery.ClientID),
			propertyStatusScope("properties", filterQuery.Status),
			propertyTypeScope("properties", filterQuery.Type),
			propertyArchivedScope(filterQuery.Archived),
			DateRangeScope("properties", filterQuery.DateRange),
			SearchScope("properties", filterQuery.Search),
		).Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func propertyStatusScope(tableName string, propertyStatus *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyStatus == nil {
			return db
		}
		return db.Where(fmt.Sprintf("%s.status = ?", tableName), propertyStatus)
	}
}

func propertyTypeScope(tableName string, propertyType *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyType == nil {
			return db
		}
		return db.Where(fmt.Sprintf("%s.type = ?", tableName), propertyType)
	}
}

func propertyArchivedScope(archived *bool) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if archived == nil || !*archived {
			return db // default GORM scope already excludes soft-deleted rows
		}
		return db.Unscoped().Where("properties.deleted_at IS NOT NULL")
	}
}

func (r *propertyRepository) Update(ctx context.Context, property *models.Property) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Save(property).Error
}

func (r *propertyRepository) Delete(ctx context.Context, propertyID string) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Where("id = ?", propertyID).Delete(&models.Property{}).Error
}

func (r *propertyRepository) GetByQuery(
	ctx context.Context,
	query map[string]any,
) (*models.Property, error) {
	var property models.Property

	result := r.DB.WithContext(ctx).Where(query).First(&property)
	if result.Error != nil {
		return nil, result.Error
	}

	return &property, nil
}

func (r *propertyRepository) GetByQueryUnscoped(
	ctx context.Context,
	query map[string]any,
) (*models.Property, error) {
	var property models.Property

	result := r.DB.WithContext(ctx).Unscoped().Where(query).First(&property)
	if result.Error != nil {
		return nil, result.Error
	}

	return &property, nil
}

func (r *propertyRepository) RestoreByID(ctx context.Context, propertyID string) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).
		Unscoped().
		Model(&models.Property{}).
		Where("id = ?", propertyID).
		Updates(map[string]any{"deleted_at": nil, "deleted_by_id": nil}).
		Error
}

type GetPropertyBySlugQuery struct {
	Slug     string
	Populate *[]string
}

func (r *propertyRepository) GetBySlug(
	ctx context.Context,
	query GetPropertyBySlugQuery,
) (*models.Property, error) {
	var property models.Property

	db := r.DB.WithContext(ctx).Where("slug = ?", query.Slug)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&property)

	if result.Error != nil {
		return nil, result.Error
	}

	return &property, nil
}
