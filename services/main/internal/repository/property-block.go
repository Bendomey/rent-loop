package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type PropertyBlockRepository interface {
	Create(context context.Context, propertyBlock *models.PropertyBlock) error
	List(context context.Context, filterQuery ListPropertyBlocksFilter) (*[]models.PropertyBlock, error)
	Count(context context.Context, filterQuery ListPropertyBlocksFilter) (int64, error)
}

type propertyBlockRepository struct {
	DB *gorm.DB
}

func NewPropertyBlockRepository(DB *gorm.DB) PropertyBlockRepository {
	return &propertyBlockRepository{DB}
}

func (r *propertyBlockRepository) Create(ctx context.Context, propertyBlock *models.PropertyBlock) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.Create(propertyBlock).Error
}

type ListPropertyBlocksFilter struct {
	lib.FilterQuery
	PropertyID string
	Status     *string
}

func (r *propertyBlockRepository) List(
	ctx context.Context,
	filterQuery ListPropertyBlocksFilter,
) (*[]models.PropertyBlock, error) {
	var propertyBlocks []models.PropertyBlock

	db := r.DB.WithContext(ctx).Scopes(
		propertyBlockPropertyIDScope(filterQuery.PropertyID),
		propertyBlockStatusScope(filterQuery.Status),
		DateRangeScope("property_blocks", filterQuery.DateRange),
		SearchScope("property_blocks", filterQuery.Search),

		PaginationScope(filterQuery.Page, filterQuery.PageSize),
		OrderScope("property_blocks", filterQuery.OrderBy, filterQuery.Order),
	)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}
	results := db.Find(&propertyBlocks)

	if results.Error != nil {
		return nil, results.Error
	}
	return &propertyBlocks, nil
}

func (r *propertyBlockRepository) Count(ctx context.Context, filterQuery ListPropertyBlocksFilter) (int64, error) {
	var count int64

	result := r.DB.WithContext(ctx).
		Model(&models.PropertyBlock{}).
		Scopes(
			propertyBlockPropertyIDScope(filterQuery.PropertyID),
			propertyBlockStatusScope(filterQuery.Status),
			DateRangeScope("property_blocks", filterQuery.DateRange),
			SearchScope("property_blocks", filterQuery.Search),
		).Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}
	return count, nil
}

func propertyBlockPropertyIDScope(propertyID string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("property_blocks.property_id = ?", propertyID)
	}
}

func propertyBlockStatusScope(propertyBlockStatus *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyBlockStatus == nil {
			return db
		}
		return db.Where("property_blocks.status = ?", *propertyBlockStatus)
	}
}
