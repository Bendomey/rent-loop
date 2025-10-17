package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type ClientApplicationRepository interface {
	GetByID(ctx context.Context, id string) (*models.ClientApplication, error)
	Create(ctx context.Context, clientApp *models.ClientApplication) error
	List(ctx context.Context, filterQuery lib.FilterQuery, filters ListClientApplicationsFilter) (*[]models.ClientApplication, error)
	Count(ctx context.Context, filterQuery lib.FilterQuery, filters ListClientApplicationsFilter) (int64, error)
}

type clientApplicationRepository struct {
	db *gorm.DB
}

func NewClientApplicationRepository(db *gorm.DB) ClientApplicationRepository {
	return &clientApplicationRepository{db}
}

func (r *clientApplicationRepository) GetByID(ctx context.Context, id string) (*models.ClientApplication, error) {
	var clientApp models.ClientApplication
	if err := r.db.WithContext(ctx).First(&clientApp, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &clientApp, nil
}

func (r *clientApplicationRepository) Create(ctx context.Context, clientApp *models.ClientApplication) error {
	return r.db.WithContext(ctx).Create(clientApp).Error
}

func (r *clientApplicationRepository) List(ctx context.Context, filterQuery lib.FilterQuery, filters ListClientApplicationsFilter) (*[]models.ClientApplication, error) {
	var clientApps []models.ClientApplication
	if err := r.db.WithContext(ctx).Find(&clientApps).Error; err != nil {
		return nil, err
	}
	return &clientApps, nil
}

func (r *clientApplicationRepository) Count(ctx context.Context, filterQuery lib.FilterQuery, filters ListClientApplicationsFilter) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.ClientApplication{}).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

type ListClientApplicationsFilter struct {
	// Add any filter fields you need later (e.g. Status, Type, etc.)
}
