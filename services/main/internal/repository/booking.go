package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type BookingRepository interface {
	Create(ctx context.Context, booking *models.Booking) error
	Update(ctx context.Context, booking *models.Booking) error
	GetByIDWithPopulate(ctx context.Context, query GetBookingQuery) (*models.Booking, error)
	GetByTrackingCode(ctx context.Context, trackingCode string, populate []string) (*models.Booking, error)
	List(ctx context.Context, filterQuery lib.FilterQuery, filters ListBookingsFilter) (*[]models.Booking, error)
	Count(ctx context.Context, filterQuery lib.FilterQuery, filter ListBookingsFilter) (int64, error)
	HasOverlappingBlock(ctx context.Context, unitID string, startDate, endDate interface{}) (bool, error)
}

type bookingRepository struct {
	DB *gorm.DB
}

func NewBookingRepository(db *gorm.DB) BookingRepository {
	return &bookingRepository{DB: db}
}

type ListBookingsFilter struct {
	PropertyID *string
	UnitID     *string
	Status     *string
	lib.FilterQuery
}

func (r *bookingRepository) Create(ctx context.Context, booking *models.Booking) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Create(booking).Error
}

func (r *bookingRepository) Update(ctx context.Context, booking *models.Booking) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Save(booking).Error
}

type GetBookingQuery struct {
	ID       string
	Populate *[]string
}

func (r *bookingRepository) GetByIDWithPopulate(ctx context.Context, query GetBookingQuery) (*models.Booking, error) {
	var booking models.Booking
	db := lib.ResolveDB(ctx, r.DB).WithContext(ctx).Where("id = ?", query.ID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&booking)
	if result.Error != nil {
		return nil, result.Error
	}
	return &booking, nil
}

func (r *bookingRepository) GetByTrackingCode(
	ctx context.Context,
	trackingCode string,
	populate []string,
) (*models.Booking, error) {
	var booking models.Booking
	db := r.DB.WithContext(ctx).Where("code = ?", trackingCode)

	for _, field := range populate {
		db = db.Preload(field)
	}

	if err := db.First(&booking).Error; err != nil {
		return nil, err
	}

	return &booking, nil
}

func (r *bookingRepository) List(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListBookingsFilter,
) (*[]models.Booking, error) {
	var bookings []models.Booking

	db := r.DB.WithContext(ctx).
		Scopes(
			IDsFilterScope("bookings", filterQuery.IDs),
			DateRangeScope("bookings", filterQuery.DateRange),
			SearchScope("bookings", filterQuery.Search),
			bookingPropertyIDScope(filters.PropertyID),
			bookingUnitIDScope(filters.UnitID),
			bookingStatusScope(filters.Status),
			PaginationScope(filterQuery.Page, filterQuery.PageSize),
			OrderScope("bookings", filterQuery.OrderBy, filterQuery.Order),
		)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	if err := db.Find(&bookings).Error; err != nil {
		return nil, err
	}
	return &bookings, nil
}

func (r *bookingRepository) Count(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListBookingsFilter,
) (int64, error) {
	var count int64
	db := r.DB.WithContext(ctx).
		Model(&models.Booking{}).
		Scopes(
			IDsFilterScope("bookings", filterQuery.IDs),
			DateRangeScope("bookings", filterQuery.DateRange),
			SearchScope("bookings", filterQuery.Search),
			bookingPropertyIDScope(filters.PropertyID),
			bookingUnitIDScope(filters.UnitID),
			bookingStatusScope(filters.Status),
		)

	if err := db.Count(&count).Error; err != nil {
		return 0, err
	}

	return count, nil
}

// HasOverlappingBlock checks if any UnitDateBlock overlaps with [startDate, endDate) for the given unit.
func (r *bookingRepository) HasOverlappingBlock(
	ctx context.Context,
	unitID string,
	startDate, endDate interface{},
) (bool, error) {
	var count int64
	err := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Model(&models.UnitDateBlock{}).
		Where("unit_id = ? AND start_date < ? AND end_date > ?", unitID, endDate, startDate).
		Count(&count).Error
	return count > 0, err
}

func bookingPropertyIDScope(propertyID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyID != nil {
			return db.Where("property_id = ?", *propertyID)
		}
		return db
	}
}

func bookingUnitIDScope(unitID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if unitID != nil {
			return db.Where("unit_id = ?", *unitID)
		}
		return db
	}
}

func bookingStatusScope(status *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if status != nil {
			return db.Where("status = ?", *status)
		}
		return db
	}
}
