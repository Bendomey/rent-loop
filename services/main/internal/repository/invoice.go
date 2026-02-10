package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type InvoiceRepository interface {
	Create(context context.Context, invoice *models.Invoice) error
	GetByQuery(context context.Context, query GetInvoiceQuery) (*models.Invoice, error)
	Update(context context.Context, invoice *models.Invoice) error
	List(context context.Context, filterQuery ListInvoicesFilter) (*[]models.Invoice, error)
	Count(context context.Context, filterQuery ListInvoicesFilter) (int64, error)
	Delete(context context.Context, invoiceID string) error
	CreateLineItem(context context.Context, lineItem *models.InvoiceLineItem) error
	GetLineItem(context context.Context, lineItemID string) (*models.InvoiceLineItem, error)
	GetLineItems(context context.Context, invoiceID string) ([]models.InvoiceLineItem, error)
	DeleteLineItem(context context.Context, lineItemID string) error
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
	Query    map[string]any
	Populate *[]string
}

func (r *invoiceRepository) GetByQuery(ctx context.Context, query GetInvoiceQuery) (*models.Invoice, error) {
	var invoice models.Invoice
	db := r.DB.WithContext(ctx).Where(query.Query)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&invoice)
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
	Active        *bool
}

func (r *invoiceRepository) List(ctx context.Context, filterQuery ListInvoicesFilter) (*[]models.Invoice, error) {
	var invoices []models.Invoice

	db := r.DB.WithContext(ctx).Scopes(
		IDsFilterScope("invoices", filterQuery.IDs),
		invoicePayerTypeScope(filterQuery.PayerType),
		invoicePayerClientIDScope(filterQuery.PayerClientID),
		invoicePayerTenantIDScope(filterQuery.PayerTenantID),
		invoicePayeeTypeScope(filterQuery.PayeeType),
		invoicePayeeClientIDScope(filterQuery.PayeeClientID),
		invoiceContextTypeScope(filterQuery.ContextType),
		invoiceStatusScope(filterQuery.Status),
		DateRangeScope("invoices", filterQuery.DateRange),
		SearchScope("invoices", filterQuery.Search),
		invoiceActiveScope(filterQuery.Active),

		PaginationScope(filterQuery.Page, filterQuery.PageSize),
		OrderScope("invoices", filterQuery.OrderBy, filterQuery.Order),
	)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	result := db.Find(&invoices)
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
			invoicePayerTypeScope(filterQuery.PayerType),
			invoicePayerClientIDScope(filterQuery.PayerClientID),
			invoicePayerTenantIDScope(filterQuery.PayerTenantID),
			invoicePayeeTypeScope(filterQuery.PayeeType),
			invoicePayeeClientIDScope(filterQuery.PayeeClientID),
			invoiceContextTypeScope(filterQuery.ContextType),
			invoiceStatusScope(filterQuery.Status),
			invoiceActiveScope(filterQuery.Active),

			DateRangeScope("invoices", filterQuery.DateRange),
			SearchScope("invoices", filterQuery.Search),
		).Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

// Invoice filter scopes
func invoicePayerTypeScope(payerType *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if payerType == nil {
			return db
		}
		return db.Where("invoices.payer_type = ?", *payerType)
	}
}

func invoicePayerClientIDScope(payerClientID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if payerClientID == nil {
			return db
		}
		return db.Where("invoices.payer_client_id = ?", *payerClientID)
	}
}

func invoicePayerTenantIDScope(payerTenantID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if payerTenantID == nil {
			return db
		}
		return db.Where("invoices.payer_tenant_id = ?", *payerTenantID)
	}
}

func invoicePayeeTypeScope(payeeType *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if payeeType == nil {
			return db
		}
		return db.Where("invoices.payee_type = ?", *payeeType)
	}
}

func invoicePayeeClientIDScope(payeeClientID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if payeeClientID == nil {
			return db
		}
		return db.Where("invoices.payee_client_id = ?", *payeeClientID)
	}
}

func invoiceContextTypeScope(contextType *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if contextType == nil {
			return db
		}
		return db.Where("invoices.context_type = ?", *contextType)
	}
}

func invoiceStatusScope(status *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if status == nil {
			return db
		}
		return db.Where("invoices.status = ?", *status)
	}
}

func invoiceActiveScope(active *bool) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if active == nil {
			return db
		}

		// fetch invoices that are active (not VOID)
		if *active {
			return db.Where("invoices.status != ?", "VOID")
		}

		// fetch invoices that are VOID
		return db.Where("invoices.status = ?", "VOID")
	}
}

func (r *invoiceRepository) CreateLineItem(ctx context.Context, lineItem *models.InvoiceLineItem) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Create(lineItem).Error
}

func (r *invoiceRepository) GetLineItem(ctx context.Context, lineItemID string) (*models.InvoiceLineItem, error) {
	var lineItem models.InvoiceLineItem

	result := r.DB.WithContext(ctx).Where("id = ?", lineItemID).First(&lineItem)
	if result.Error != nil {
		return nil, result.Error
	}

	return &lineItem, nil
}

func (r *invoiceRepository) GetLineItems(ctx context.Context, invoiceID string) ([]models.InvoiceLineItem, error) {
	var lineItems []models.InvoiceLineItem

	result := r.DB.WithContext(ctx).Where("invoice_id = ?", invoiceID).Find(&lineItems)
	if result.Error != nil {
		return nil, result.Error
	}

	return lineItems, nil
}

func (r *invoiceRepository) DeleteLineItem(ctx context.Context, lineItemID string) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Delete(&models.InvoiceLineItem{}, "id = ?", lineItemID).Error
}
