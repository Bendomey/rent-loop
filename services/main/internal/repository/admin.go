package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type AdminRepository interface {
	GetByEmail(context context.Context, email string) (*models.Admin, error)
	GetByAdminID(context context.Context, adminId string) (*models.Admin, error)
	GetByID(context context.Context, id string) (*models.Admin, error)
	Create(context context.Context, admin *models.Admin) error
	List(context context.Context, filterQuery lib.FilterQuery, filters ListAdminsFilter) (*[]models.Admin, error)
	Count(context context.Context, filterQuery lib.FilterQuery, filters ListAdminsFilter) (int64, error)
}

type adminRepository struct {
	DB *gorm.DB
}

func NewAdminRepository(DB *gorm.DB) AdminRepository {
	return &adminRepository{DB}
}

func (r *adminRepository) GetByAdminID(ctx context.Context, adminId string) (*models.Admin, error) {
	var admin models.Admin
	result := r.DB.WithContext(ctx).Where("admin_id = ?", adminId).First(&admin)
	if result.Error != nil {
		return nil, result.Error
	}
	return &admin, nil
}

func (r *adminRepository) GetByEmail(ctx context.Context, email string) (*models.Admin, error) {
	var admin models.Admin
	result := r.DB.WithContext(ctx).Where("email = ?", email).First(&admin)
	if result.Error != nil {
		return nil, result.Error
	}

	return &admin, nil
}

func (r *adminRepository) GetByID(ctx context.Context, id string) (*models.Admin, error) {
	var admin models.Admin
	result := r.DB.WithContext(ctx).Where("id = ?", id).First(&admin)
	if result.Error != nil {
		return nil, result.Error
	}
	return &admin, nil
}

func (r *adminRepository) Create(ctx context.Context, admin *models.Admin) error {
	return r.DB.WithContext(ctx).Create(admin).Error
}

type ListAdminsFilter struct {
}

func (r *adminRepository) List(ctx context.Context, filterQuery lib.FilterQuery, filters ListAdminsFilter) (*[]models.Admin, error) {
	var admins []models.Admin

	db := r.DB.WithContext(ctx).
		Scopes(
			DateRangeScope("admins", filterQuery.DateRange),
			SearchScope("admins", filterQuery.Search),

			PaginationScope(filterQuery.Page, filterQuery.PageSize),
			OrderScope("admins", filterQuery.OrderBy, filterQuery.Order),
		)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	results := db.Find(&admins)

	if results.Error != nil {
		return nil, results.Error
	}

	return &admins, nil
}

func (r *adminRepository) Count(ctx context.Context, filterQuery lib.FilterQuery, filters ListAdminsFilter) (int64, error) {
	var count int64

	result := r.DB.
		WithContext(ctx).
		Model(&models.Admin{}).
		Scopes(
			DateRangeScope("admins", filterQuery.DateRange),
			SearchScope("admins", filterQuery.Search),
		).
		Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

// TODO: example filter scope function
// func StatusFilterScope(status *string) func(db *gorm.DB) *gorm.DB {
// 	return func(db *gorm.DB) *gorm.DB {
// 		if status == nil {
// 			return db
// 		}

// 		return db.Where("admins.status = ?", *status)
// 	}
// }
