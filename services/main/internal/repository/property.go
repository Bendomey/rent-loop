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
	GetByID(context context.Context, id string) (*models.Property, error)
	List(context context.Context, filterQuery ListPropertiesFilter) (*[]models.Property, error)
	Count(context context.Context, filterQuery ListPropertiesFilter) (int64, error)
}

type propertyRepository struct {
	DB *gorm.DB
}

func NewPropertyRepository(DB *gorm.DB) PropertyRepository {
	return &propertyRepository{DB}
}

func (r *propertyRepository) Create(ctx context.Context, property *models.Property) error {
	var db *gorm.DB

	tx, txOk := lib.TransactionFromContext(ctx)
	db = tx

	if !txOk || tx == nil {
		db = r.DB
	}

	return db.WithContext(ctx).Create(property).Error
}

func (r *propertyRepository) GetByID(ctx context.Context, id string) (*models.Property, error) {
	var property models.Property
	result := r.DB.WithContext(ctx).Where("id = ?", id).First(&property)

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
}

func (r *propertyRepository) List(
	ctx context.Context,
	filterQuery ListPropertiesFilter,
) (*[]models.Property, error) {
	var properties []models.Property

	db := r.DB.WithContext(ctx).Scopes(
		ClientFilterScope("properties", filterQuery.ClientID),
		propertyStatusScope("properties", filterQuery.Status),
		propertyTypeScope("properties", filterQuery.Type),
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
			ClientFilterScope("properties", filterQuery.ClientID),
			propertyStatusScope("properties", filterQuery.Status),
			propertyTypeScope("properties", filterQuery.Type),
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
