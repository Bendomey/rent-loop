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
	GetOne(ctx context.Context, id string, checklistID string) (*models.LeaseChecklistItem, error)
	Update(ctx context.Context, item *models.LeaseChecklistItem) error
	Delete(ctx context.Context, id string, checklistID string) error
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

func (r *leaseChecklistItemRepository) GetOne(
	ctx context.Context,
	id string,
	checklistID string,
) (*models.LeaseChecklistItem, error) {
	var item models.LeaseChecklistItem
	result := r.db.WithContext(ctx).
		Where("id = ? AND lease_checklist_id = ?", id, checklistID).
		First(&item)
	if result.Error != nil {
		return nil, result.Error
	}
	return &item, nil
}

func (r *leaseChecklistItemRepository) Update(ctx context.Context, item *models.LeaseChecklistItem) error {
	db := lib.ResolveDB(ctx, r.db)
	return db.WithContext(ctx).Save(item).Error
}

func (r *leaseChecklistItemRepository) Delete(ctx context.Context, id string, checklistID string) error {
	db := lib.ResolveDB(ctx, r.db)
	return db.WithContext(ctx).
		Delete(&models.LeaseChecklistItem{}, "id = ? AND lease_checklist_id = ?", id, checklistID).
		Error
}
