package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type LeaseChecklistAcknowledgmentRepository interface {
	Create(ctx context.Context, ack *models.LeaseChecklistAcknowledgment) error
	GetByChecklistTenantAndRound(
		ctx context.Context,
		checklistID, tenantAccountID string,
		round int,
	) (*models.LeaseChecklistAcknowledgment, error)
	ListByChecklist(ctx context.Context, checklistID string) (*[]models.LeaseChecklistAcknowledgment, error)
}

type leaseChecklistAcknowledgmentRepository struct {
	db *gorm.DB
}

func NewLeaseChecklistAcknowledgmentRepository(db *gorm.DB) LeaseChecklistAcknowledgmentRepository {
	return &leaseChecklistAcknowledgmentRepository{db: db}
}

func (r *leaseChecklistAcknowledgmentRepository) Create(
	ctx context.Context,
	ack *models.LeaseChecklistAcknowledgment,
) error {
	db := lib.ResolveDB(ctx, r.db)
	return db.WithContext(ctx).Create(ack).Error
}

func (r *leaseChecklistAcknowledgmentRepository) GetByChecklistTenantAndRound(
	ctx context.Context,
	checklistID, tenantAccountID string,
	round int,
) (*models.LeaseChecklistAcknowledgment, error) {
	var ack models.LeaseChecklistAcknowledgment
	result := lib.ResolveDB(ctx, r.db).WithContext(ctx).
		Where("lease_checklist_id = ? AND tenant_account_id = ? AND round = ?", checklistID, tenantAccountID, round).
		First(&ack)
	if result.Error != nil {
		return nil, result.Error
	}
	return &ack, nil
}

func (r *leaseChecklistAcknowledgmentRepository) ListByChecklist(
	ctx context.Context,
	checklistID string,
) (*[]models.LeaseChecklistAcknowledgment, error) {
	var acks []models.LeaseChecklistAcknowledgment
	result := lib.ResolveDB(ctx, r.db).WithContext(ctx).
		Where("lease_checklist_id = ?", checklistID).
		Order("round ASC").
		Find(&acks)
	if result.Error != nil {
		return nil, result.Error
	}
	return &acks, nil
}
