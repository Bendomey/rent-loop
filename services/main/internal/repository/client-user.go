package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type ClientUserRepository interface {
	Create(context context.Context, clientUser *models.ClientUser) error
	GetByID(context context.Context, id string) (*models.ClientUser, error)
	GetByEmail(context context.Context, email string) (*models.ClientUser, error)
	GetByQuery(context context.Context, query map[string]any) (*models.ClientUser, error)
}

type clientUserRepository struct {
	DB *gorm.DB
}

func NewClientUserRepository(DB *gorm.DB) ClientUserRepository {
	return &clientUserRepository{DB}
}

func (r *clientUserRepository) Create(ctx context.Context, clientUser *models.ClientUser) error {
	return r.DB.WithContext(ctx).Create(clientUser).Error
}

func (r *clientUserRepository) GetByID(ctx context.Context, id string) (*models.ClientUser, error) {
	var clientUser models.ClientUser
	result := r.DB.WithContext(ctx).Where("id = ?", id).First(&clientUser)

	if result.Error != nil {
		return nil, result.Error
	}
	return &clientUser, nil
}

func (r *clientUserRepository) GetByEmail(
	ctx context.Context,
	email string,
) (*models.ClientUser, error) {
	var clientUser models.ClientUser
	result := r.DB.WithContext(ctx).Where("email = ?", email).First(&clientUser)

	if result.Error != nil {
		return nil, result.Error
	}
	return &clientUser, nil
}

func (r *clientUserRepository) GetByQuery(
	ctx context.Context,
	query map[string]any,
) (*models.ClientUser, error) {
	var clientUser models.ClientUser
	result := r.DB.WithContext(ctx).Where(query).First(&clientUser)

	if result.Error != nil {
		return nil, result.Error
	}

	return &clientUser, nil
}
