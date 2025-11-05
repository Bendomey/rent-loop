package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type UnitRepository interface {
	Count(context context.Context, filterQuery ListUnitsFilter) (int64, error)
}

type unitRepository struct {
	DB *gorm.DB
}

func NewUnitRepository(DB *gorm.DB) UnitRepository {
	return &unitRepository{DB: DB}
}

type ListUnitsFilter struct {
	lib.FilterQuery
	PropertyID string
	Status     *string
	Type       *string
}

func (r *unitRepository) Count(ctx context.Context, filterQuery ListUnitsFilter) (int64, error) {
	var count int64

	result := r.DB.WithContext(ctx).
		Model(&models.Unit{}).
		Scopes(
			propertyFilterScope(filterQuery.PropertyID),
			unitStatusScope(filterQuery.Status),
			unitTypeScope(filterQuery.Type),
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
