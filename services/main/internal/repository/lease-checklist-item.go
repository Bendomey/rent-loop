package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type LeaseChecklistItemRepository interface {
	BulkCreate(context context.Context, leaseChecklistItems *[]models.LeaseChecklistItem) error
	Create(context context.Context, leaseChecklistItem *models.LeaseChecklistItem) error
}

type leaseChecklistItemRepository struct {
	db *gorm.DB
}

func NewLeaseChecklistItemRepository(db *gorm.DB) LeaseChecklistItemRepository {
	return &leaseChecklistItemRepository{db}
}

func (r *leaseChecklistItemRepository) BulkCreate(
	ctx context.Context,
	leaseChecklistItems *[]models.LeaseChecklistItem,
) error {
	db := lib.ResolveDB(ctx, r.db)

	return db.WithContext(ctx).Create(&leaseChecklistItems).Error
}

func (r *leaseChecklistItemRepository) Create(
	ctx context.Context,
	leaseChecklistItem *models.LeaseChecklistItem,
) error {
	db := lib.ResolveDB(ctx, r.db)

	return db.WithContext(ctx).Create(leaseChecklistItem).Error
}
