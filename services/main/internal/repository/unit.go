package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type UnitRepository interface {
	List(context context.Context, filterQuery ListUnitsFilter) (*[]models.Unit, error)
	Count(context context.Context, filterQuery ListUnitsFilter) (int64, error)
	Create(context context.Context, unit *models.Unit) error
	GetOneWithQuery(context context.Context, query GetUnitQuery) (*models.Unit, error)
}

type unitRepository struct {
	DB *gorm.DB
}

func NewUnitRepository(DB *gorm.DB) UnitRepository {
	return &unitRepository{DB: DB}
}

func (r *unitRepository) Create(ctx context.Context, unit *models.Unit) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Create(unit).Error
}

type GetUnitQuery struct {
	PropertyID      string
	PropertyBlockID string
	UnitID          string
	Populate        *[]string
}

func (r *unitRepository) GetOneWithQuery(ctx context.Context, query GetUnitQuery) (*models.Unit, error) {
	var unit models.Unit

	db := r.DB.WithContext(ctx).
		Where("id = ? AND property_block_id = ? AND property_id = ?", query.UnitID, query.PropertyBlockID, query.PropertyID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&unit)

	if result.Error != nil {
		return nil, result.Error
	}

	return &unit, nil
}

type ListUnitsFilter struct {
	lib.FilterQuery
	PropertyID       string
	Status           *string
	Type             *string
	PaymentFrequency *string
	BlockIDs         *[]string
}

func (r *unitRepository) List(ctx context.Context, filterQuery ListUnitsFilter) (*[]models.Unit, error) {
	var units []models.Unit

	db := r.DB.WithContext(ctx).Scopes(
		propertyFilterScope(filterQuery.PropertyID),
		unitStatusScope(filterQuery.Status),
		unitTypeScope(filterQuery.Type),
		unitBlockIDsScope(filterQuery.BlockIDs),
		unitPaymentFrequencyScope(filterQuery.PaymentFrequency),
		DateRangeScope("units", filterQuery.DateRange),
		SearchScope("units", filterQuery.Search),

		PaginationScope(filterQuery.Page, filterQuery.PageSize),
		OrderScope("units", filterQuery.OrderBy, filterQuery.Order),
	)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	results := db.Find(&units)

	if results.Error != nil {
		return nil, results.Error
	}
	return &units, nil
}

func (r *unitRepository) Count(ctx context.Context, filterQuery ListUnitsFilter) (int64, error) {
	var count int64

	db := lib.ResolveDB(ctx, r.DB)

	result := db.WithContext(ctx).
		Model(&models.Unit{}).
		Scopes(
			propertyFilterScope(filterQuery.PropertyID),
			unitStatusScope(filterQuery.Status),
			unitTypeScope(filterQuery.Type),
			unitBlockIDsScope(filterQuery.BlockIDs),
			unitPaymentFrequencyScope(filterQuery.PaymentFrequency),
			DateRangeScope("units", filterQuery.DateRange),
			SearchScope("units", filterQuery.Search),
		).
		Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func propertyFilterScope(propertyID string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyID == "" {
			return db
		}

		return db.Where("units.property_id = ?", propertyID)
	}
}

func unitStatusScope(unitStatus *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if unitStatus == nil {
			return db
		}

		return db.Where("units.status = ?", unitStatus)
	}
}

func unitTypeScope(unitType *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if unitType == nil {
			return db
		}

		return db.Where("units.type = ?", unitType)
	}
}

func unitBlockIDsScope(blockIDs *[]string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if blockIDs == nil {
			return db
		}

		return db.Where("units.property_block_id IN (?)", *blockIDs)
	}
}

func unitPaymentFrequencyScope(paymentFrequency *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if paymentFrequency == nil {
			return db
		}

		return db.Where("units.payment_frequency = ?", *paymentFrequency)
	}
}
