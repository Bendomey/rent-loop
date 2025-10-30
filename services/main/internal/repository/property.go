package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type PropertyRepository interface {
	Create(context context.Context, property *models.Property) error
	GetByID(context context.Context, id string) (*models.Property, error)
}

type propertyRepository struct {
	DB *gorm.DB
}

func NewPropertyRepository(DB *gorm.DB) PropertyRepository {
	return &propertyRepository{DB}
}

func (r *propertyRepository) Create(ctx context.Context, property *models.Property) error {
	return r.DB.WithContext(ctx).Create(property).Error
}

func (r *propertyRepository) GetByID(ctx context.Context, id string) (*models.Property, error) {
	var property models.Property
	result := r.DB.WithContext(ctx).Where("id = ?", id).First(&property)

	if result.Error != nil {
		return nil, result.Error
	}

	return &property, nil
}
