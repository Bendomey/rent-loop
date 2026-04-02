package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	GetByID(ctx context.Context, id string) (*models.User, error)
	GetByIDWithClientUsers(ctx context.Context, id string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
}

type userRepository struct {
	DB *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db}
}

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	db := lib.ResolveDB(ctx, r.DB)
	return db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	result := lib.ResolveDB(ctx, r.DB).Where("email = ?", email).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

func (r *userRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	var user models.User
	result := lib.ResolveDB(ctx, r.DB).Where("id = ?", id).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

func (r *userRepository) GetByIDWithClientUsers(ctx context.Context, id string) (*models.User, error) {
	var user models.User
	result := lib.ResolveDB(ctx, r.DB).
		Preload("ClientUsers").
		Preload("ClientUsers.Client").
		Where("id = ?", id).
		First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

func (r *userRepository) Update(ctx context.Context, user *models.User) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Save(user).Error
}
