package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type PropertyRepository interface {
	GetByID(ctx context.Context, id string) (*models.Property, error)
	Create(ctx context.Context, property *models.Property) error
	List(ctx context.Context, filterQuery interface{}, filters ListPropertiesFilter) (*[]models.Property, error)
	Count(ctx context.Context, filterQuery interface{}, filters ListPropertiesFilter) (int64, error)
	UpdateProperty(ctx context.Context, property *models.Property) error
	Delete(ctx context.Context, id string) error
}

type ListPropertiesFilter struct {
	Status   *string 
	Type     *string 
	Country  *string
	Region   *string
	City     *string
	Search   *string 
}

type propertyRepository struct {
	db *gorm.DB
}

func NewPropertyRepository(db *gorm.DB) PropertyRepository {
	return &propertyRepository{db: db}
}


func (r *propertyRepository) GetByID(ctx context.Context, id string) (*models.Property, error) {
	var property models.Property
	err := r.db.WithContext(ctx).
		Preload("CreatedBy").
		Preload("Units").
		First(&property, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &property, nil
}

func (r *propertyRepository) Create(ctx context.Context, property *models.Property) error {
	return r.db.WithContext(ctx).Create(property).Error
}

func (r *propertyRepository) UpdateProperty(ctx context.Context, property *models.Property) error {
	return r.db.WithContext(ctx).Save(property).Error
}

func (r *propertyRepository) List(ctx context.Context, filterQuery interface{}, filters ListPropertiesFilter) (*[]models.Property, error) {
	var properties []models.Property

	q := r.db.WithContext(ctx).Model(&models.Property{}).
		Preload("CreatedBy")

	if filters.Status != nil && *filters.Status != "" {
		q = q.Where("status = ?", *filters.Status)
	}
	if filters.Type != nil && *filters.Type != "" {
		q = q.Where(`type = ?`, *filters.Type)
	}
	if filters.Country != nil && *filters.Country != "" {
		q = q.Where("country = ?", *filters.Country)
	}
	if filters.Region != nil && *filters.Region != "" {
		q = q.Where("region = ?", *filters.Region)
	}
	if filters.City != nil && *filters.City != "" {
		q = q.Where("city = ?", *filters.City)
	}
	if filters.Search != nil && *filters.Search != "" {
		like := "%" + *filters.Search + "%"
		
		q = q.Where(
			r.db.
				Where("name ILIKE ?", like).
				Or("slug ILIKE ?", like).
				Or("address ILIKE ?", like).
				Or("city ILIKE ?", like),
		)
	}

	q = q.Order("created_at DESC")

	if err := q.Find(&properties).Error; err != nil {
		return nil, err
	}

	return &properties, nil
}

func (r *propertyRepository) Count(ctx context.Context, filterQuery interface{}, filters ListPropertiesFilter) (int64, error) {
	var count int64

	q := r.db.WithContext(ctx).Model(&models.Property{})

	if filters.Status != nil && *filters.Status != "" {
		q = q.Where("status = ?", *filters.Status)
	}
	if filters.Type != nil && *filters.Type != "" {
		q = q.Where(`type = ?`, *filters.Type)
	}
	if filters.Country != nil && *filters.Country != "" {
		q = q.Where("country = ?", *filters.Country)
	}
	if filters.Region != nil && *filters.Region != "" {
		q = q.Where("region = ?", *filters.Region)
	}
	if filters.City != nil && *filters.City != "" {
		q = q.Where("city = ?", *filters.City)
	}
	if filters.Search != nil && *filters.Search != "" {
		like := "%" + *filters.Search + "%"
		q = q.Where(
			r.db.
				Where("name ILIKE ?", like).
				Or("slug ILIKE ?", like).
				Or("address ILIKE ?", like).
				Or("city ILIKE ?", like),
		)
	}

	if err := q.Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *propertyRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&models.Property{}).Error
}