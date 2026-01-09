package repository

import (
	"context"
	"fmt"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type TenantApplicationRepository interface {
	Create(context.Context, *models.TenantApplication) error
	List(context context.Context, filter ListTenantApplicationsQuery) (*[]models.TenantApplication, error)
	Count(context context.Context, filter ListTenantApplicationsQuery) (int64, error)
}

type tenantApplicationRepository struct {
	DB *gorm.DB
}

func NewTenantApplicationRepository(db *gorm.DB) TenantApplicationRepository {
	return &tenantApplicationRepository{DB: db}
}

func (r *tenantApplicationRepository) Create(ctx context.Context, tenantApplication *models.TenantApplication) error {
	db := lib.ResolveDB(ctx, r.DB)
	return db.WithContext(ctx).Create(tenantApplication).Error
}

type ListTenantApplicationsQuery struct {
	lib.FilterQuery
	Status                       *string
	StayDurationFrequency        *string
	PaymentFrequency             *string
	InitialDepositPaymentMethod  *string
	SecurityDepositPaymentMethod *string
	Gender                       *string
	MaritalStatus                *string
	CreatedById                  *string
}

func (r *tenantApplicationRepository) List(
	ctx context.Context,
	filterQuery ListTenantApplicationsQuery,
) (*[]models.TenantApplication, error) {
	var tenantApplications []models.TenantApplication

	db := r.DB.WithContext(ctx).Scopes(
		tenantApplicationFilterScope("status", filterQuery.Status),
		tenantApplicationFilterScope("stay_duration_frequency", filterQuery.StayDurationFrequency),
		tenantApplicationFilterScope("payment_frequency", filterQuery.PaymentFrequency),
		tenantApplicationFilterScope("initial_deposit_payment_method", filterQuery.InitialDepositPaymentMethod),
		tenantApplicationFilterScope("security_deposit_payment_method", filterQuery.SecurityDepositPaymentMethod),
		tenantApplicationFilterScope("gender", filterQuery.Gender),
		tenantApplicationFilterScope("marital_status", filterQuery.MaritalStatus),
		tenantApplicationFilterScope("created_by_id", filterQuery.CreatedById),
		DateRangeScope("tenant_applications", filterQuery.DateRange),
		SearchScope("tenant_applications", filterQuery.Search),

		PaginationScope(filterQuery.Page, filterQuery.PageSize),
		OrderScope("tenant_applications", filterQuery.OrderBy, filterQuery.Order),
	)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	results := db.Find(&tenantApplications)
	if results.Error != nil {
		return nil, results.Error
	}
	return &tenantApplications, nil
}

func (r *tenantApplicationRepository) Count(
	ctx context.Context,
	filterQuery ListTenantApplicationsQuery,
) (int64, error) {
	var count int64

	result := r.DB.WithContext(ctx).Model(models.TenantApplication{}).Scopes(
		tenantApplicationFilterScope("status", filterQuery.Status),
		tenantApplicationFilterScope("stay_duration_frequency", filterQuery.StayDurationFrequency),
		tenantApplicationFilterScope("payment_frequency", filterQuery.PaymentFrequency),
		tenantApplicationFilterScope("initial_deposit_payment_method", filterQuery.InitialDepositPaymentMethod),
		tenantApplicationFilterScope("security_deposit_payment_method", filterQuery.SecurityDepositPaymentMethod),
		tenantApplicationFilterScope("gender", filterQuery.Gender),
		tenantApplicationFilterScope("marital_status", filterQuery.MaritalStatus),
		tenantApplicationFilterScope("created_by_id", filterQuery.CreatedById),
		DateRangeScope("tenant_applications", filterQuery.DateRange),
		SearchScope("tenant_applications", filterQuery.Search),
	).Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func tenantApplicationFilterScope(field string, value *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if value == nil {
			return db
		}

		query := fmt.Sprintf("tenant_applications.%s = ?", field)
		return db.Where(query, value)
	}
}
