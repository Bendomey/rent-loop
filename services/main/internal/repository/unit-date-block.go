package repository

import (
	"context"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type UnitDateBlockRepository interface {
	Create(ctx context.Context, block *models.UnitDateBlock) error
	Delete(ctx context.Context, id string) error
	GetByID(ctx context.Context, id string) (*models.UnitDateBlock, error)
	ListByUnit(ctx context.Context, unitID string, from, to time.Time) (*[]models.UnitDateBlock, error)
}

type unitDateBlockRepository struct {
	DB *gorm.DB
}

func NewUnitDateBlockRepository(db *gorm.DB) UnitDateBlockRepository {
	return &unitDateBlockRepository{DB: db}
}

func (r *unitDateBlockRepository) Create(ctx context.Context, block *models.UnitDateBlock) error {
	db := lib.ResolveDB(ctx, r.DB)
	return db.WithContext(ctx).Create(block).Error
}

func (r *unitDateBlockRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Where("id = ?", id).Delete(&models.UnitDateBlock{}).Error
}

func (r *unitDateBlockRepository) GetByID(ctx context.Context, id string) (*models.UnitDateBlock, error) {
	var block models.UnitDateBlock
	if err := r.DB.WithContext(ctx).Where("id = ?", id).First(&block).Error; err != nil {
		return nil, err
	}
	return &block, nil
}

func (r *unitDateBlockRepository) ListByUnit(ctx context.Context, unitID string, from, to time.Time) (*[]models.UnitDateBlock, error) {
	var blocks []models.UnitDateBlock
	err := r.DB.WithContext(ctx).
		Where("unit_id = ? AND start_date < ? AND end_date > ?", unitID, to, from).
		Find(&blocks).Error
	return &blocks, err
}
