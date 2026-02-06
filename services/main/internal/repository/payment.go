package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type PaymentRepository interface {
	CreatePayment(context context.Context, payment *models.Payment) error
	GetByIDWithQuery(context context.Context, query GetPaymentQuery) (*models.Payment, error)
	List(context context.Context, filterQuery ListPaymentsFilter) (*[]models.Payment, error)
	Count(context context.Context, filterQuery ListPaymentsFilter) (int64, error)
	Update(context context.Context, payment *models.Payment) error
	SumAmountByInvoice(context context.Context, invoiceID string, statuses []string) (int64, error)
}

type paymentRepository struct {
	DB *gorm.DB
}

func NewPaymentRepository(DB *gorm.DB) PaymentRepository {
	return &paymentRepository{DB}
}

func (r *paymentRepository) CreatePayment(ctx context.Context, payment *models.Payment) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.Create(payment).Error
}

type GetPaymentQuery struct {
	PaymentID string
	Populate  *[]string
}

func (r *paymentRepository) GetByIDWithQuery(
	ctx context.Context,
	query GetPaymentQuery,
) (*models.Payment, error) {
	var payment models.Payment

	db := r.DB.WithContext(ctx).Where("id = ?", query.PaymentID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&payment)

	if result.Error != nil {
		return nil, result.Error
	}
	return &payment, nil
}

func (r *paymentRepository) Update(ctx context.Context, payment *models.Payment) error {

	db := lib.ResolveDB(ctx, r.DB)
	return db.Save(payment).Error
}

type ListPaymentsFilter struct {
	lib.FilterQuery

	InvoiceID *string
	Statuses  *[]string
	Rail      *string
	Provider  *string
	IDs       *[]string
}

func (r *paymentRepository) List(ctx context.Context, filterQuery ListPaymentsFilter) (*[]models.Payment, error) {
	var payments []models.Payment

	db := r.DB.WithContext(ctx).Scopes(
		IDsFilterScope("payments", filterQuery.IDs),
		paymentInvoiceIDFilterScope(filterQuery.InvoiceID),
		paymentStatusesFilterScope(filterQuery.Statuses),
		paymentRailFilterScope(filterQuery.Rail),
		paymentProviderFilterScope(filterQuery.Provider),
		DateRangeScope("payments", filterQuery.DateRange),
		SearchScope("payments", filterQuery.Search),

		PaginationScope(filterQuery.Page, filterQuery.PageSize),
		OrderScope("payments", filterQuery.OrderBy, filterQuery.Order),
	)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	result := db.Find(&payments)

	if result.Error != nil {
		return nil, result.Error
	}
	return &payments, nil
}

func (r *paymentRepository) Count(ctx context.Context, filterQuery ListPaymentsFilter) (int64, error) {
	var count int64

	result := r.DB.WithContext(ctx).
		Model(&models.Payment{}).
		Scopes(
			IDsFilterScope("payments", filterQuery.IDs),
			paymentInvoiceIDFilterScope(filterQuery.InvoiceID),
			paymentStatusesFilterScope(filterQuery.Statuses),
			paymentRailFilterScope(filterQuery.Rail),
			paymentProviderFilterScope(filterQuery.Provider),
			DateRangeScope("payments", filterQuery.DateRange),
			SearchScope("payments", filterQuery.Search),
		).Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}
	return count, nil
}

func paymentInvoiceIDFilterScope(invoiceID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if invoiceID == nil {
			return db
		}

		return db.Where("payments.invoice_id = ?", *invoiceID)
	}
}

func paymentStatusesFilterScope(statuses *[]string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if statuses == nil {
			return db
		}
		return db.Where("payments.status IN ?", *statuses)
	}
}

func paymentRailFilterScope(rail *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if rail == nil {
			return db
		}
		return db.Where("payments.rail = ?", *rail)
	}
}

func paymentProviderFilterScope(provider *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if provider == nil {
			return db
		}
		return db.Where("payments.provider = ?", *provider)
	}
}

func (r *paymentRepository) SumAmountByInvoice(ctx context.Context, invoiceID string, statuses []string) (int64, error) {
	var total int64

	result := r.DB.WithContext(ctx).
		Model(&models.Payment{}).
		Select("COALESCE(SUM(amount), 0)").
		Where("invoice_id = ?", invoiceID).
		Where("status IN ?", statuses).
		Scan(&total)

	if result.Error != nil {
		return 0, result.Error
	}

	return total, nil
}
