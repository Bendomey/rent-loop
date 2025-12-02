package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type PropertyBlockRepository interface {
	Create(context context.Context, propertyBlock *models.PropertyBlock) error
}

type propertyBlockRepository struct {
	DB *gorm.DB
}

func NewPropertyBlockRepository(DB *gorm.DB) PropertyBlockRepository {
	return &propertyBlockRepository{DB}
}

func (r *propertyBlockRepository) Create(ctx context.Context, propertyBlock *models.PropertyBlock) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.Create(propertyBlock).Error
}
