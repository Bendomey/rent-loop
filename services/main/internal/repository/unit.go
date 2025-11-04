package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type UnitRepository interface {
	GetByQuery(context context.Context, query map[string]any) (*models.Unit, error)
}

type unitRepository struct {
	DB *gorm.DB
}

func NewUnitRepository(DB *gorm.DB) UnitRepository {
	return &unitRepository{DB: DB}
}

func (r *unitRepository) GetByQuery(
	ctx context.Context,
	query map[string]any,
) (*models.Unit, error) {
	var unit models.Unit
	result := r.DB.WithContext(ctx).Where(query).First(&unit)

	if result.Error != nil {
		return nil, result.Error
	}

	return &unit, nil
}
