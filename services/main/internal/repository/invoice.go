package repository

import (
	"context"
	"time"

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
	TenantList(ctx context.Context, filter TenantListInvoicesFilter) (*[]models.Invoice, error)
	TenantCount(ctx context.Context, filter TenantListInvoicesFilter) (int64, error)
	TenantStatsByStatus(
		ctx context.Context,
		tenantID, leaseID string,
		tenantApplicationID *string,
	) ([]InvoiceStatusStat, error)
	Delete(context context.Context, invoiceID string) error
	CreateLineItem(context context.Context, lineItem *models.InvoiceLineItem) error
	GetLineItem(context context.Context, lineItemID string) (*models.InvoiceLineItem, error)
	GetLineItems(context context.Context, invoiceID string) ([]models.InvoiceLineItem, error)
	DeleteLineItem(context context.Context, lineItemID string) error
	ListForReminders(ctx context.Context) (*[]models.Invoice, error)
}

// InvoiceStatusStat holds the count and total amount for a single invoice status.
type InvoiceStatusStat struct {
	Status      string
	Count       int64
	TotalAmount int64
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
	db := lib.ResolveDB(ctx, r.DB).Where(query.Query)

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
	PayerType                  *string
	PayerClientID              *string
	PayerTenantID              *string
	PayeeType                  *string
	PayeeClientID              *string
	ContextType                *string
	Status                     *[]string
	Active                     *bool
	PropertyID                 *string
	ContextLeaseID             *string
	ContextTenantApplicationID *string
}

// TenantListInvoicesFilter is used exclusively by tenant-scoped invoice list
// endpoints. TENANT_APPLICATION invoices may not have payer_tenant_id set, so
// the ownership + context check is expressed as a single OR-aware clause rather
// than two independent AND conditions.
type TenantListInvoicesFilter struct {
	lib.FilterQuery
	TenantID            string
	LeaseID             string
	TenantApplicationID *string
	Status              *[]string
	Active              *bool
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
		invoicePropertyIDScope(filterQuery.PropertyID),
		invoiceLeaseContextScope(filterQuery.ContextLeaseID, filterQuery.ContextTenantApplicationID),

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
			invoicePropertyIDScope(filterQuery.PropertyID),
			invoiceLeaseContextScope(filterQuery.ContextLeaseID, filterQuery.ContextTenantApplicationID),

			DateRangeScope("invoices", filterQuery.DateRange),
			SearchScope("invoices", filterQuery.Search),
		).Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func (r *invoiceRepository) TenantList(
	ctx context.Context,
	filter TenantListInvoicesFilter,
) (*[]models.Invoice, error) {
	var invoices []models.Invoice

	db := r.DB.WithContext(ctx).Scopes(
		invoiceTenantOwnerContextScope(&filter.TenantID, &filter.LeaseID, filter.TenantApplicationID),
		invoiceStatusScope(filter.Status),
		invoiceActiveScope(filter.Active),
		PaginationScope(filter.Page, filter.PageSize),
		OrderScope("invoices", filter.OrderBy, filter.Order),
	)

	if filter.Populate != nil {
		for _, field := range *filter.Populate {
			db = db.Preload(field)
		}
	}

	result := db.Find(&invoices)
	if result.Error != nil {
		return nil, result.Error
	}

	return &invoices, nil
}

func (r *invoiceRepository) TenantCount(ctx context.Context, filter TenantListInvoicesFilter) (int64, error) {
	var count int64

	result := r.DB.WithContext(ctx).
		Model(&models.Invoice{}).
		Scopes(
			invoiceTenantOwnerContextScope(&filter.TenantID, &filter.LeaseID, filter.TenantApplicationID),
			invoiceStatusScope(filter.Status),
			invoiceActiveScope(filter.Active),
		).Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func (r *invoiceRepository) TenantStatsByStatus(
	ctx context.Context,
	tenantID, leaseID string,
	tenantApplicationID *string,
) ([]InvoiceStatusStat, error) {
	var results []InvoiceStatusStat

	err := r.DB.WithContext(ctx).
		Model(&models.Invoice{}).
		Select("status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total_amount").
		Scopes(invoiceTenantOwnerContextScope(&tenantID, &leaseID, tenantApplicationID)).
		Group("status").
		Find(&results).Error
	if err != nil {
		return nil, err
	}

	return results, nil
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

func invoiceStatusScope(statuses *[]string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if statuses == nil || len(*statuses) == 0 {
			return db
		}
		return db.Where("invoices.status IN ?", *statuses)
	}
}

func invoicePropertyIDScope(propertyID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyID == nil {
			return db
		}
		return db.Where(
			`(
				(invoices.context_type = 'TENANT_APPLICATION' AND EXISTS (
					SELECT 1 FROM tenant_applications ta
					JOIN units u ON u.id = ta.desired_unit_id
					WHERE ta.id = invoices.context_tenant_application_id AND u.property_id = ?
				))
				OR (invoices.context_type = 'LEASE_RENT' AND EXISTS (
					SELECT 1 FROM leases l
					JOIN units u ON u.id = l.unit_id
					WHERE l.id = invoices.context_lease_id AND u.property_id = ?
				))
				OR (invoices.context_type = 'MAINTENANCE' AND EXISTS (
					SELECT 1 FROM maintenance_requests mr
					JOIN units u ON u.id = mr.unit_id
					WHERE mr.id = invoices.context_maintenance_request_id AND u.property_id = ?
				))
				OR (invoices.context_type IN ('SAAS_FEE', 'GENERAL_EXPENSE') AND invoices.payer_property_id = ?)
			)`,
			*propertyID, *propertyID, *propertyID, *propertyID,
		)
	}
}

// invoiceLeaseContextScope filters invoices that belong to a given lease context.
// It returns invoices whose context_lease_id matches leaseID OR whose
// context_tenant_application_id matches tenantApplicationID (when provided).
// If both are nil, no filter is applied.
func invoiceLeaseContextScope(leaseID *string, tenantApplicationID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if leaseID == nil && tenantApplicationID == nil {
			return db
		}
		if leaseID != nil && tenantApplicationID != nil {
			return db.Where(
				"invoices.context_lease_id = ? OR invoices.context_tenant_application_id = ?",
				*leaseID, *tenantApplicationID,
			)
		}
		if leaseID != nil {
			return db.Where("invoices.context_lease_id = ?", *leaseID)
		}
		return db.Where("invoices.context_tenant_application_id = ?", *tenantApplicationID)
	}
}

// invoiceTenantOwnerContextScope handles the tenant-scoped invoice list query.
// TENANT_APPLICATION invoices may not have payer_tenant_id set, so a simple
// AND of payer_tenant_id + context would exclude them. Instead we emit:
//
//	(payer_tenant_id = ? AND context_lease_id = ?) OR context_tenant_application_id = ?
//
// When no application ID is provided it falls back to:
//
//	payer_tenant_id = ? AND context_lease_id = ?
//
// If any of tenantID or leaseID is nil, the scope is a no-op.
func invoiceTenantOwnerContextScope(tenantID, leaseID, applicationID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if tenantID == nil || leaseID == nil {
			return db
		}
		if applicationID != nil {
			return db.Where(
				"(invoices.payer_tenant_id = ? AND invoices.context_lease_id = ?) OR invoices.context_tenant_application_id = ?",
				*tenantID,
				*leaseID,
				*applicationID,
			)
		}
		return db.Where(
			"invoices.payer_tenant_id = ? AND invoices.context_lease_id = ?",
			*tenantID, *leaseID,
		)
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

func (r *invoiceRepository) ListForReminders(ctx context.Context) (*[]models.Invoice, error) {
	var invoices []models.Invoice
	// Fetch LEASE_RENT invoices that are unpaid and either:
	//   - due tomorrow (pre-due), or
	//   - already overdue within the supported reminder horizon (≤ 14 days).
	// We also exclude invoices where the terminal reminder ("overdue_14d") has already
	// been sent — there is nothing left to do for those.
	now := time.Now()
	startOfToday := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	startOfTomorrow := startOfToday.Add(24 * time.Hour) // start of tomorrow
	endOfTomorrow := startOfToday.Add(48 * time.Hour)   // start of the day after tomorrow
	overdueHorizon := startOfToday.AddDate(0, 0, -14)   // 14 days ago (inclusive lower bound)
	result := r.DB.WithContext(ctx).
		Where(
			"context_type = ? AND status IN ? AND due_date IS NOT NULL AND NOT ('overdue_14d' = ANY(reminders_sent))", "LEASE_RENT",
			[]string{"ISSUED", "PARTIALLY_PAID"},
		).
		Where(
			"(due_date >= ? AND due_date < ?) OR (due_date >= ? AND due_date < ?)",
			startOfTomorrow,
			endOfTomorrow,
			overdueHorizon,
			startOfToday,
		).
		Preload("PayerTenant.TenantAccount").
		Preload("ContextLease.Unit").
		Find(&invoices)
	if result.Error != nil {
		return nil, result.Error
	}
	return &invoices, nil
}
