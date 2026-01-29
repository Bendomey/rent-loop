package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type LeaseRepository interface {
	Create(context context.Context, lease *models.Lease) error
	GetOneWithPopulate(context context.Context, query GetLeaseQuery) (*models.Lease, error)
	Update(context context.Context, lease *models.Lease) error
}

type leaseRepository struct {
	DB *gorm.DB
}

func NewLeaseRepository(db *gorm.DB) LeaseRepository {
	return &leaseRepository{DB: db}
}

func (r *leaseRepository) Create(ctx context.Context, lease *models.Lease) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Create(lease).Error
}

type GetLeaseQuery struct {
	ID       string
	Populate *[]string
}

func (r *leaseRepository) GetOneWithPopulate(ctx context.Context, query GetLeaseQuery) (*models.Lease, error) {
	var lease models.Lease
	db := r.DB.WithContext(ctx).Where("id = ?", query.ID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&lease)
	if result.Error != nil {
		return nil, result.Error
	}

	return &lease, nil
}

func (r *leaseRepository) Update(ctx context.Context, lease *models.Lease) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Save(lease).Error
}
