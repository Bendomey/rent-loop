package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type ClientUserRepository interface {
	Create(context context.Context, clientUser *models.ClientUser) error
	GetByID(context context.Context, id string) (*models.ClientUser, error)
	GetByEmail(context context.Context, email string) (*models.ClientUser, error)
	GetByQuery(context context.Context, query map[string]any) (*models.ClientUser, error)
	Update(context context.Context, clientUser *models.ClientUser) error
	List(context context.Context, filterQuery ListClientUsersFilter) (*[]models.ClientUser, error)
	Count(context context.Context, filterQuery ListClientUsersFilter) (int64, error)
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

func (r *clientUserRepository) Update(ctx context.Context, clientUser *models.ClientUser) error {
	return r.DB.WithContext(ctx).Save(clientUser).Error
}

type ListClientUsersFilter struct {
	lib.FilterQuery
	ClientID string
	Role     *string
	Status   *string
}

func (r *clientUserRepository) List(
	ctx context.Context,
	filterQuery ListClientUsersFilter,
) (*[]models.ClientUser, error) {
	var clientUsers []models.ClientUser

	db := r.DB.WithContext(ctx).Scopes(
		ClientFilterScope("client_users", filterQuery.ClientID),
		roleFilterScope(filterQuery.Role),
		statusFilterScope(filterQuery.Status),
		DateRangeScope("client_users", filterQuery.DateRange),
		SearchScope("client_users", filterQuery.Search),

		PaginationScope(filterQuery.Page, filterQuery.PageSize),
		OrderScope("client_users", filterQuery.OrderBy, filterQuery.Order),
	)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	results := db.Find(&clientUsers)
	if results.Error != nil {
		return nil, results.Error
	}

	return &clientUsers, nil
}

func (r *clientUserRepository) Count(
	ctx context.Context,
	filterQuery ListClientUsersFilter,
) (int64, error) {
	var count int64

	result := r.DB.WithContext(ctx).
		Model(&models.ClientUser{}).
		Scopes(
			ClientFilterScope("client_users", filterQuery.ClientID),
			DateRangeScope("client_users", filterQuery.DateRange),
			SearchScope("client_users", filterQuery.Search),
		).Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func roleFilterScope(role *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if role == nil {
			return db
		}

		return db.Where("client_users.role = ?", role)
	}
}

func statusFilterScope(status *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if status == nil {
			return db
		}

		return db.Where("client_users.status = ?", status)
	}
}
