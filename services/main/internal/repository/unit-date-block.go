package repository

import (
	"context"
	"errors"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type UnitDateBlockRepository interface {
	Create(ctx context.Context, block *models.UnitDateBlock) error
	Delete(ctx context.Context, id string) error
	DeleteByBookingID(ctx context.Context, bookingID string) error
	DeleteByLeaseID(ctx context.Context, leaseID string) error
	UpdateDatesByLeaseID(ctx context.Context, leaseID string, start, end time.Time) error
	GetByID(ctx context.Context, id string) (*models.UnitDateBlock, error)
	// GetByLeaseID returns (nil, nil) when the lease holds no block. A lease
	// from before blocks were written at creation is not an error.
	GetByLeaseID(ctx context.Context, leaseID string) (*models.UnitDateBlock, error)
	ListByUnit(ctx context.Context, unitID string, from, to time.Time) (*[]models.UnitDateBlock, error)
	// LockUnit serialises everyone claiming dates on one unit. Held until the
	// caller's transaction ends, so the availability read and the block write
	// that follows it cannot interleave with another booking of the same unit.
	// Outside a transaction it takes and releases immediately, which is the
	// honest answer: there is nothing to protect.
	LockUnit(ctx context.Context, unitID string) error
}

type unitDateBlockRepository struct {
	DB *gorm.DB
}

func NewUnitDateBlockRepository(db *gorm.DB) UnitDateBlockRepository {
	return &unitDateBlockRepository{DB: db}
}

func (r *unitDateBlockRepository) Create(ctx context.Context, block *models.UnitDateBlock) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Create(block).Error
}

func (r *unitDateBlockRepository) Delete(ctx context.Context, id string) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Where("id = ?", id).Delete(&models.UnitDateBlock{}).Error
}

func (r *unitDateBlockRepository) DeleteByBookingID(ctx context.Context, bookingID string) error {
	return lib.ResolveDB(ctx, r.DB).
		WithContext(ctx).
		Where("booking_id = ?", bookingID).
		Delete(&models.UnitDateBlock{}).
		Error
}

func (r *unitDateBlockRepository) DeleteByLeaseID(ctx context.Context, leaseID string) error {
	return lib.ResolveDB(ctx, r.DB).
		WithContext(ctx).
		Where("lease_id = ?", leaseID).
		Delete(&models.UnitDateBlock{}).
		Error
}

func (r *unitDateBlockRepository) UpdateDatesByLeaseID(
	ctx context.Context,
	leaseID string,
	start, end time.Time,
) error {
	return lib.ResolveDB(ctx, r.DB).
		WithContext(ctx).
		Model(&models.UnitDateBlock{}).
		Where("lease_id = ?", leaseID).
		Updates(map[string]any{"start_date": start, "end_date": end}).
		Error
}

func (r *unitDateBlockRepository) GetByLeaseID(
	ctx context.Context,
	leaseID string,
) (*models.UnitDateBlock, error) {
	var block models.UnitDateBlock
	err := lib.ResolveDB(ctx, r.DB).WithContext(ctx).Where("lease_id = ?", leaseID).First(&block).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &block, nil
}

func (r *unitDateBlockRepository) LockUnit(ctx context.Context, unitID string) error {
	return lib.ResolveDB(ctx, r.DB).
		WithContext(ctx).
		Exec(`SELECT pg_advisory_xact_lock(hashtext(?))`, unitID).
		Error
}

func (r *unitDateBlockRepository) GetByID(ctx context.Context, id string) (*models.UnitDateBlock, error) {
	var block models.UnitDateBlock
	if err := lib.ResolveDB(ctx, r.DB).WithContext(ctx).Where("id = ?", id).First(&block).Error; err != nil {
		return nil, err
	}

	return &block, nil
}

func (r *unitDateBlockRepository) ListByUnit(
	ctx context.Context,
	unitID string,
	from, to time.Time,
) (*[]models.UnitDateBlock, error) {
	var blocks []models.UnitDateBlock
	err := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Where("unit_id = ? AND start_date < ? AND end_date > ?", unitID, to, from).
		Find(&blocks).Error
	return &blocks, err
}
