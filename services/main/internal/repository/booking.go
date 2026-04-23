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
	GetByID(ctx context.Context, id string, populate []string) (*models.Booking, error)
	GetByTrackingCode(ctx context.Context, trackingCode string, populate []string) (*models.Booking, error)
	List(ctx context.Context, filter ListBookingsFilter) (*[]models.Booking, error)
	Count(ctx context.Context, filter ListBookingsFilter) (int64, error)
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
	db := lib.ResolveDB(ctx, r.DB)
	return db.WithContext(ctx).Create(booking).Error
}

func (r *bookingRepository) Update(ctx context.Context, booking *models.Booking) error {
	db := lib.ResolveDB(ctx, r.DB)
	return db.WithContext(ctx).Save(booking).Error
}

func (r *bookingRepository) GetByID(ctx context.Context, id string, populate []string) (*models.Booking, error) {
	var booking models.Booking
	db := r.DB.WithContext(ctx).Where("id = ?", id)
	for _, field := range populate {
		db = db.Preload(field)
	}
	if err := db.First(&booking).Error; err != nil {
		return nil, err
	}
	return &booking, nil
}

func (r *bookingRepository) GetByTrackingCode(
	ctx context.Context,
	trackingCode string,
	populate []string,
) (*models.Booking, error) {
	var booking models.Booking
	db := r.DB.WithContext(ctx).Where("tracking_code = ?", trackingCode)
	for _, field := range populate {
		db = db.Preload(field)
	}
	if err := db.First(&booking).Error; err != nil {
		return nil, err
	}
	return &booking, nil
}

func (r *bookingRepository) List(ctx context.Context, filter ListBookingsFilter) (*[]models.Booking, error) {
	var bookings []models.Booking
	db := r.DB.WithContext(ctx)

	if filter.PropertyID != nil {
		db = db.Where("property_id = ?", *filter.PropertyID)
	}
	if filter.UnitID != nil {
		db = db.Where("unit_id = ?", *filter.UnitID)
	}
	if filter.Status != nil {
		db = db.Where("status = ?", *filter.Status)
	}

	db = db.Scopes(
		PaginationScope(filter.Page, filter.PageSize),
		OrderScope("bookings", filter.OrderBy, filter.Order),
	)

	if filter.Populate != nil {
		for _, field := range *filter.Populate {
			db = db.Preload(field)
		}
	}

	if err := db.Find(&bookings).Error; err != nil {
		return nil, err
	}
	return &bookings, nil
}

func (r *bookingRepository) Count(ctx context.Context, filter ListBookingsFilter) (int64, error) {
	var count int64
	db := r.DB.WithContext(ctx).Model(&models.Booking{})
	if filter.PropertyID != nil {
		db = db.Where("property_id = ?", *filter.PropertyID)
	}
	if filter.UnitID != nil {
		db = db.Where("unit_id = ?", *filter.UnitID)
	}
	if filter.Status != nil {
		db = db.Where("status = ?", *filter.Status)
	}
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
	db := lib.ResolveDB(ctx, r.DB)
	err := db.WithContext(ctx).
		Model(&models.UnitDateBlock{}).
		Where("unit_id = ? AND start_date < ? AND end_date > ?", unitID, endDate, startDate).
		Count(&count).Error
	return count > 0, err
}
