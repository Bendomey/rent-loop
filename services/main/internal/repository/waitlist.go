package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type WaitlistRepository interface {
	CreateWaitlistEntry(ctx context.Context, entry *models.Waitlist) error
}

type waitlistRepository struct {
	DB *gorm.DB
}

func NewWaitlistRepository(DB *gorm.DB) WaitlistRepository {
	return &waitlistRepository{DB}
}

func (r *waitlistRepository) CreateWaitlistEntry(ctx context.Context, entry *models.Waitlist) error {
	db := lib.ResolveDB(ctx, r.DB)
	return db.WithContext(ctx).Create(entry).Error
}
