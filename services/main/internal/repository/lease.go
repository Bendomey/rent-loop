package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type LeaseRepository interface {
	Create(context context.Context, lease *models.Lease) error
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
