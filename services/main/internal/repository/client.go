package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type ClientRepository interface {
	GetByID(ctx context.Context, id string) (*models.Client, error)
	Create(ctx context.Context, clientApp *models.Client) error
	List(ctx context.Context, filterQuery lib.FilterQuery, filters ListClientsFilter) (*[]models.Client, error)
	Count(ctx context.Context, filterQuery lib.FilterQuery, filters ListClientsFilter) (int64, error)
	UpdateClient(ctx context.Context, clientApp *models.Client) error
}

type clientRepository struct {
	db *gorm.DB
}

func NewClientRepository(db *gorm.DB) ClientRepository {
	return &clientRepository{db}
}

func (r *clientRepository) GetByID(ctx context.Context, id string) (*models.Client, error) {
	var clientApp models.Client
	if err := r.db.WithContext(ctx).First(&clientApp, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &clientApp, nil
}

func (r *clientRepository) Create(ctx context.Context, clientApp *models.Client) error {
	return r.db.WithContext(ctx).Create(clientApp).Error
}

func (r *clientRepository) List(ctx context.Context, filterQuery lib.FilterQuery, filters ListClientsFilter) (*[]models.Client, error) {
	var clientApps []models.Client
	if err := r.db.WithContext(ctx).Find(&clientApps).Error; err != nil {
		return nil, err
	}
	return &clientApps, nil
}

func (r *clientRepository) Count(ctx context.Context, filterQuery lib.FilterQuery, filters ListClientsFilter) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.Client{}).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

type ListClientsFilter struct {
	// Add any filter fields you need later (e.g. Status, Type, etc.)
}

func (r *clientRepository) UpdateClient(ctx context.Context, client *models.Client) error {
	return r.db.WithContext(ctx).Save(client).Error
}
