package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type PropertyBlockRepository interface {
	Create(context context.Context, propertyBlock *models.PropertyBlock) error
	GetByIDWithQuery(context context.Context, query GetPropertyBlockQuery) (*models.PropertyBlock, error)
	List(context context.Context, filterQuery ListPropertyBlocksFilter) (*[]models.PropertyBlock, error)
	Count(context context.Context, filterQuery ListPropertyBlocksFilter) (int64, error)
	Update(context context.Context, propertyBlock *models.PropertyBlock) error
	Delete(context context.Context, input DeletePropertyBlockInput) error
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

type GetPropertyBlockQuery struct {
	PropertyBlockID string
	PropertyID      string
	Populate        *[]string
}

func (r *propertyBlockRepository) GetByIDWithQuery(
	ctx context.Context,
	query GetPropertyBlockQuery,
) (*models.PropertyBlock, error) {
	var propertyBlock models.PropertyBlock

	db := r.DB.WithContext(ctx).Where("id = ? AND property_id = ?", query.PropertyBlockID, query.PropertyID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&propertyBlock)

	if result.Error != nil {
		return nil, result.Error
	}
	return &propertyBlock, nil
}

func (r *propertyBlockRepository) Update(ctx context.Context, propertyBlock *models.PropertyBlock) error {
	db := lib.ResolveDB(ctx, r.DB)
	return db.Save(propertyBlock).Error
}

type DeletePropertyBlockInput struct {
	PropertyBlockID string
	PropertyID      string
}

func (r *propertyBlockRepository) Delete(ctx context.Context, input DeletePropertyBlockInput) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).
		Where("id = ? AND property_id = ?", input.PropertyBlockID, input.PropertyID).
		Delete(&models.PropertyBlock{}).
		Error
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
