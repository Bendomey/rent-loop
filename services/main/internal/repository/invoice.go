package repository

import (
	"context"
	"fmt"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type InvoiceRepository interface {
	Create(context context.Context, invoice *models.Invoice) error
	GetByID(context context.Context, query GetInvoiceQuery) (*models.Invoice, error)
	Update(context context.Context, invoice *models.Invoice) error
	List(context context.Context, filterQuery ListInvoicesFilter) (*[]models.Invoice, error)
	Count(context context.Context, filterQuery ListInvoicesFilter) (int64, error)
	Delete(context context.Context, invoiceID string) error
	CreateLineItem(context context.Context, lineItem *models.InvoiceLineItem) error
	GetLineItems(context context.Context, invoiceID string) ([]models.InvoiceLineItem, error)
}

type invoiceRepository struct {
	DB *gorm.DB
}

func NewInvoiceRepository(db *gorm.DB) InvoiceRepository {
	return &invoiceRepository{DB: db}
}

func (r *invoiceRepository) Create(ctx context.Context, invoice *models.Invoice) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Create(invoice).Error
}

type GetInvoiceQuery struct {
	ID       string
	Code     string
	Populate *[]string
}

func (r *invoiceRepository) GetByID(ctx context.Context, query GetInvoiceQuery) (*models.Invoice, error) {
	var invoice models.Invoice
	db := r.DB.WithContext(ctx)

	if query.ID != "" {
		db = db.Where("id = ?", query.ID)
	}

	if query.Code != "" {
		db = db.Where("code = ?", query.Code)
	}

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.Preload("LineItems").First(&invoice)
	if result.Error != nil {
		return nil, result.Error
	}

	return &invoice, nil
}

func (r *invoiceRepository) Update(ctx context.Context, invoice *models.Invoice) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Save(invoice).Error
}

func (r *invoiceRepository) Delete(ctx context.Context, invoiceID string) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Delete(&models.Invoice{}, "id = ?", invoiceID).Error
}

type ListInvoicesFilter struct {
	lib.FilterQuery
	PayerType     *string
	PayerClientID *string
	PayerTenantID *string
	PayeeType     *string
	PayeeClientID *string
	ContextType   *string
	Status        *string
	IDs           *[]string
}

func (r *invoiceRepository) List(ctx context.Context, filterQuery ListInvoicesFilter) (*[]models.Invoice, error) {
	var invoices []models.Invoice

	db := r.DB.WithContext(ctx).Scopes(
		IDsFilterScope("invoices", filterQuery.IDs),
		invoicePayerTypeScope("invoices", filterQuery.PayerType),
		invoicePayerClientIDScope("invoices", filterQuery.PayerClientID),
		invoicePayerTenantIDScope("invoices", filterQuery.PayerTenantID),
		invoicePayeeTypeScope("invoices", filterQuery.PayeeType),
		invoicePayeeClientIDScope("invoices", filterQuery.PayeeClientID),
		invoiceContextTypeScope("invoices", filterQuery.ContextType),
		invoiceStatusScope("invoices", filterQuery.Status),
		DateRangeScope("invoices", filterQuery.DateRange),
		SearchScope("invoices", filterQuery.Search),

		PaginationScope(filterQuery.Page, filterQuery.PageSize),
		OrderScope("invoices", filterQuery.OrderBy, filterQuery.Order),
	)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	result := db.Preload("LineItems").Find(&invoices)
	if result.Error != nil {
		return nil, result.Error
	}

	return &invoices, nil
}

func (r *invoiceRepository) Count(ctx context.Context, filterQuery ListInvoicesFilter) (int64, error) {
	var count int64

	result := r.DB.WithContext(ctx).
		Model(&models.Invoice{}).
		Scopes(
			IDsFilterScope("invoices", filterQuery.IDs),
			invoicePayerTypeScope("invoices", filterQuery.PayerType),
			invoicePayerClientIDScope("invoices", filterQuery.PayerClientID),
			invoicePayerTenantIDScope("invoices", filterQuery.PayerTenantID),
			invoicePayeeTypeScope("invoices", filterQuery.PayeeType),
			invoicePayeeClientIDScope("invoices", filterQuery.PayeeClientID),
			invoiceContextTypeScope("invoices", filterQuery.ContextType),
			invoiceStatusScope("invoices", filterQuery.Status),
			DateRangeScope("invoices", filterQuery.DateRange),
			SearchScope("invoices", filterQuery.Search),
		).Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

// Invoice filter scopes
func invoicePayerTypeScope(tableName string, payerType *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if payerType == nil {
			return db
		}
		return db.Where(fmt.Sprintf("%s.payer_type = ?", tableName), *payerType)
	}
}

func invoicePayerClientIDScope(tableName string, payerClientID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if payerClientID == nil {
			return db
		}
		return db.Where(fmt.Sprintf("%s.payer_client_id = ?", tableName), *payerClientID)
	}
}

func invoicePayerTenantIDScope(tableName string, payerTenantID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if payerTenantID == nil {
			return db
		}
		return db.Where(fmt.Sprintf("%s.payer_tenant_id = ?", tableName), *payerTenantID)
	}
}

func invoicePayeeTypeScope(tableName string, payeeType *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if payeeType == nil {
			return db
		}
		return db.Where(fmt.Sprintf("%s.payee_type = ?", tableName), *payeeType)
	}
}

func invoicePayeeClientIDScope(tableName string, payeeClientID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if payeeClientID == nil {
			return db
		}
		return db.Where(fmt.Sprintf("%s.payee_client_id = ?", tableName), *payeeClientID)
	}
}

func invoiceContextTypeScope(tableName string, contextType *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if contextType == nil {
			return db
		}
		return db.Where(fmt.Sprintf("%s.context_type = ?", tableName), *contextType)
	}
}

func invoiceStatusScope(tableName string, status *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if status == nil {
			return db
		}
		return db.Where(fmt.Sprintf("%s.status = ?", tableName), *status)
	}
}

func (r *invoiceRepository) CreateLineItem(ctx context.Context, lineItem *models.InvoiceLineItem) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Create(lineItem).Error
}

func (r *invoiceRepository) GetLineItems(ctx context.Context, invoiceID string) ([]models.InvoiceLineItem, error) {
	var lineItems []models.InvoiceLineItem

	result := r.DB.WithContext(ctx).Where("invoice_id = ?", invoiceID).Find(&lineItems)
	if result.Error != nil {
		return nil, result.Error
	}

	return lineItems, nil
}
