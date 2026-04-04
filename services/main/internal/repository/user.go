package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	// Upsert inserts the user or, on email conflict, does nothing and
	// re-fetches the existing record. Returns wasCreated=true when a new row
	// was inserted, false when an existing record was found.
	Upsert(ctx context.Context, user *models.User) (bool, error)
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

// Upsert inserts the user or, on email conflict, does nothing and re-fetches
// the existing record so the caller's struct has the correct ID.
// Returns wasCreated=true when a new row was inserted.
func (r *userRepository) Upsert(ctx context.Context, user *models.User) (bool, error) {
	db := lib.ResolveDB(ctx, r.DB)
	if err := db.WithContext(ctx).
		Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "email"}}, DoNothing: true}).
		Create(user).Error; err != nil {
		return false, err
	}
	// If a conflict occurred GORM leaves the ID as the zero UUID — re-fetch.
	if user.ID == (uuid.UUID{}) {
		existing, err := r.GetByEmail(ctx, user.Email)
		if err != nil {
			return false, err
		}
		*user = *existing
		return false, nil
	}
	return true, nil
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
