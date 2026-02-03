package repository

import (
	"context"
	"fmt"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type LeaseRepository interface {
	Create(context context.Context, lease *models.Lease) error
	GetOneWithPopulate(context context.Context, query GetLeaseQuery) (*models.Lease, error)
	Update(context context.Context, lease *models.Lease) error
	List(context context.Context, filterQuery ListLeasesFilter) (*[]models.Lease, error)
	Count(context context.Context, filterQuery ListLeasesFilter) (int64, error)
}

type leaseRepository struct {
	DB *gorm.DB
}

func NewLeaseRepository(db *gorm.DB) LeaseRepository {
	return &leaseRepository{DB: db}
}

func (r *leaseRepository) Create(ctx context.Context, lease *models.Lease) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Create(lease).Error
}

type GetLeaseQuery struct {
	ID       string
	Populate *[]string
}

func (r *leaseRepository) GetOneWithPopulate(ctx context.Context, query GetLeaseQuery) (*models.Lease, error) {
	var lease models.Lease
	db := r.DB.WithContext(ctx).Where("id = ?", query.ID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&lease)
	if result.Error != nil {
		return nil, result.Error
	}

	return &lease, nil
}

func (r *leaseRepository) Update(ctx context.Context, lease *models.Lease) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Save(lease).Error
}

type ListLeasesFilter struct {
	lib.FilterQuery
	TenantID                   *string
	PropertyID                 *string
	Status                     *string
	ParentLeaseID              *string
	PaymentFrequency           *string
	StayDurationFrequency      *string
	LeaseAgreementDocumentMode *string
	UnitIds                    *[]string
	IDs                        *[]string
}

func (r *leaseRepository) List(ctx context.Context, filterQuery ListLeasesFilter) (*[]models.Lease, error) {
	var leases []models.Lease

	db := r.DB.WithContext(ctx).Scopes(
		leaseFilterScope("tenant_id", filterQuery.TenantID),
		propertyLeasesScope(filterQuery.PropertyID),
		leaseFilterScope("status", filterQuery.Status),
		leaseFilterScope("parent_lease_id", filterQuery.ParentLeaseID),
		leaseFilterScope("payment_frequency", filterQuery.PaymentFrequency),
		leaseFilterScope("stay_duration_frequency", filterQuery.StayDurationFrequency),
		leaseFilterScope("lease_agreement_document_mode", filterQuery.LeaseAgreementDocumentMode),
		leaseArrayFilterScope("unit_id", filterQuery.UnitIds),
		IDsFilterScope("leases", filterQuery.IDs),
		DateRangeScope("leases", filterQuery.DateRange),
		SearchScope("leases", filterQuery.Search),

		PaginationScope(filterQuery.Page, filterQuery.PageSize),
		OrderScope("leases", filterQuery.OrderBy, filterQuery.Order),
	)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}
	results := db.Find(&leases)
	if results.Error != nil {
		return nil, results.Error
	}

	return &leases, nil
}

func (r *leaseRepository) Count(ctx context.Context, filterQuery ListLeasesFilter) (int64, error) {
	var count int64

	result := r.DB.WithContext(ctx).Model(&models.Lease{}).Scopes(
		leaseFilterScope("tenant_id", filterQuery.TenantID),
		propertyLeasesScope(filterQuery.PropertyID),
		leaseFilterScope("status", filterQuery.Status),
		leaseFilterScope("parent_lease_id", filterQuery.ParentLeaseID),
		leaseFilterScope("payment_frequency", filterQuery.PaymentFrequency),
		leaseFilterScope("stay_duration_frequency", filterQuery.StayDurationFrequency),
		leaseFilterScope("lease_agreement_document_mode", filterQuery.LeaseAgreementDocumentMode),
		leaseArrayFilterScope("unit_id", filterQuery.UnitIds),
		IDsFilterScope("leases", filterQuery.IDs),
		DateRangeScope("leases", filterQuery.DateRange),
		SearchScope("leases", filterQuery.Search),
	).Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func propertyLeasesScope(propertyID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyID == nil {
			return db
		}

		return db.Joins("LEFT JOIN units ON leases.unit_id = units.id").Where("units.property_id = ?", propertyID)
	}
}

func leaseFilterScope(field string, value *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if value == nil {
			return db
		}

		query := fmt.Sprintf("leases.%s = ?", field)
		return db.Where(query, value)
	}
}

func leaseArrayFilterScope(field string, value *[]string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if value == nil {
			return db
		}

		query := fmt.Sprintf("leases.%s IN (?)", field)
		return db.Where(query, *value)
	}
}
