package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type ClientRepository interface {
	GetByID(context context.Context, id string) (*models.Client, error)
}

type clientRepository struct {
	DB *gorm.DB
}

func NewClientRepository(DB *gorm.DB) ClientRepository {
	return &clientRepository{DB}
}

func (r *clientRepository) GetByID(ctx context.Context, id string) (*models.Client, error) {
	var client models.Client
	result := r.DB.WithContext(ctx).Where("id = ?", id).First(&client)

	if result.Error != nil {
		return nil, result.Error
	}

	return &client, nil
}
