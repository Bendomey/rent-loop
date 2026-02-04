package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/accounting"
	"github.com/Bendomey/rent-loop/services/main/internal/config"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/lib/pq"
	gonanoid "github.com/matoous/go-nanoid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type InvoiceService interface {
	CreateInvoice(context context.Context, input CreateInvoiceInput) (*models.Invoice, error)
	VoidInvoice(context context.Context, input VoidInvoiceInput) (*models.Invoice, error)
	UpdateInvoice(context context.Context, input UpdateInvoiceInput) (*models.Invoice, error)
	GetByID(context context.Context, query repository.GetInvoiceQuery) (*models.Invoice, error)
	ListInvoices(context context.Context, filterQuery repository.ListInvoicesFilter) (*[]models.Invoice, int64, error)
	AddLineItem(context context.Context, input AddLineItemInput) (*models.InvoiceLineItem, error)
	GetLineItems(context context.Context, invoiceID string) ([]models.InvoiceLineItem, error)
}

type invoiceService struct {
	appCtx            pkg.AppContext
	repo              repository.InvoiceRepository
	accountingService AccountingService
}

func NewInvoiceService(
	appCtx pkg.AppContext,
	repo repository.InvoiceRepository,
	accountingService AccountingService,
) InvoiceService {
	return &invoiceService{appCtx: appCtx, repo: repo, accountingService: accountingService}
}

type LineItemInput struct {
	Label       string
	Category    string
	Quantity    int64
	UnitAmount  int64
	TotalAmount int64
	Currency    string
	Metadata    *map[string]any
}

type CreateInvoiceInput struct {
	PayerType                   string
	PayerClientID               *string
	PayerPropertyID             *string
	PayerTenantID               *string
	PayeeType                   string
	PayeeClientID               *string
	ContextType                 string
	ContextTenantApplicationID  *string
	ContextLeaseID              *string
	ContextMaintenanceRequestID *string
	TotalAmount                 int64
	Taxes                       int64
	SubTotal                    int64
	Currency                    string
	Status                      string
	DueDate                     *time.Time
	AllowedPaymentRails         []string
	LineItems                   []LineItemInput
}

func (s *invoiceService) CreateInvoice(ctx context.Context, input CreateInvoiceInput) (*models.Invoice, error) {
	// Generate invoice code
	nanoID, err := gonanoid.Generate("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", 6)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateInvoice",
				"action":   "generating invoice code",
			},
		})
	}

	year, month, _ := time.Now().Date()
	code := fmt.Sprintf("INV-%02d%02d-%s", year%100, month, nanoID)

	// Build line items
	var lineItems []models.InvoiceLineItem
	for _, item := range input.LineItems {
		var metaJson *datatypes.JSON
		if item.Metadata != nil {
			json, err := lib.InterfaceToJSON(*item.Metadata)
			if err != nil {
				return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
					Err: err,
					Metadata: map[string]string{
						"function": "CreateInvoice",
						"action":   "marshalling line item metadata",
					},
				})
			}
			metaJson = json
		}

		lineItems = append(lineItems, models.InvoiceLineItem{
			Label:       item.Label,
			Category:    item.Category,
			Quantity:    item.Quantity,
			UnitAmount:  item.UnitAmount,
			TotalAmount: item.TotalAmount,
			Currency:    item.Currency,
			Metadata:    metaJson,
		})
	}

	invoice := models.Invoice{
		Code:                        code,
		Status:                      input.Status,
		PayerType:                   input.PayerType,
		PayerClientID:               input.PayerClientID,
		PayerPropertyID:             input.PayerPropertyID,
		PayerTenantID:               input.PayerTenantID,
		PayeeType:                   input.PayeeType,
		PayeeClientID:               input.PayeeClientID,
		ContextType:                 input.ContextType,
		ContextTenantApplicationID:  input.ContextTenantApplicationID,
		ContextLeaseID:              input.ContextLeaseID,
		ContextMaintenanceRequestID: input.ContextMaintenanceRequestID,
		TotalAmount:                 input.TotalAmount,
		Taxes:                       input.Taxes,
		SubTotal:                    input.SubTotal,
		Currency:                    input.Currency,
		DueDate:                     input.DueDate,
		// AllowedPaymentRails:         pq.StringArray(input.AllowedPaymentRails), // should always be defaulted on the DB for now.
		LineItems: lineItems,
	}

	if input.Status == "ISSUED" {
		now := time.Now()
		invoice.IssuedAt = &now
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	createErr := s.repo.Create(transCtx, &invoice)
	if createErr != nil {
		transaction.Rollback()
		return nil, pkg.BadRequestError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err: createErr,
			Metadata: map[string]string{
				"function": "CreateInvoice",
				"action":   "creating invoice",
			},
		})
	}

	if input.Status == "ISSUED" {
		// Build journal entry lines based on invoice context type
		journalLines := buildJournalEntryForInvoice(&invoice, s.appCtx.Config.ChartOfAccounts)

		if len(journalLines) > 0 {
			transactionDate := invoice.CreatedAt.Format(time.RFC3339)

			_, journalErr := s.accountingService.RecordInvoiceCreated(transCtx, accounting.CreateJournalEntryRequest{
				Status:          string(accounting.JournalEntryStatusPosted),
				Reference:       invoice.Code,
				TransactionDate: &transactionDate,
				Metadata: map[string]any{
					"invoice_id":   invoice.ID.String(),
					"invoice_code": invoice.Code,
					"context_type": invoice.ContextType,
					"payer_type":   invoice.PayerType,
					"payee_type":   invoice.PayeeType,
				},
				Lines: journalLines,
			})
			if journalErr != nil {
				transaction.Rollback()
				return nil, pkg.InternalServerError(
					"Failed to create journal entry for invoice",
					&pkg.RentLoopErrorParams{
						Err: journalErr,
						Metadata: map[string]string{
							"function":    "CreateInvoice",
							"action":      "creating journal entry",
							"invoiceCode": invoice.Code,
						},
					},
				)
			}
		}
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"function": "CreateInvoice",
				"action":   "committing transaction",
			},
		})
	}

	return &invoice, nil
}

type UpdateInvoiceInput struct {
	InvoiceID           string
	Status              *string
	TotalAmount         *int64
	Taxes               *int64
	SubTotal            *int64
	DueDate             *time.Time
	IssuedAt            *time.Time
	PaidAt              *time.Time
	VoidedAt            *time.Time
	AllowedPaymentRails *[]string
}

func (s *invoiceService) UpdateInvoice(ctx context.Context, input UpdateInvoiceInput) (*models.Invoice, error) {
	invoice, getErr := s.repo.GetByID(ctx, repository.GetInvoiceQuery{
		ID: input.InvoiceID,
	})
	if getErr != nil {
		if errors.Is(getErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("InvoiceNotFound", &pkg.RentLoopErrorParams{
				Err: getErr,
			})
		}
		return nil, pkg.InternalServerError(getErr.Error(), &pkg.RentLoopErrorParams{
			Err: getErr,
			Metadata: map[string]string{
				"function": "UpdateInvoice",
				"action":   "getting invoice",
			},
		})
	}

	if input.Status != nil {
		invoice.Status = *input.Status
	}

	if input.TotalAmount != nil {
		invoice.TotalAmount = *input.TotalAmount
	}

	if input.Taxes != nil {
		invoice.Taxes = *input.Taxes
	}

	if input.SubTotal != nil {
		invoice.SubTotal = *input.SubTotal
	}

	if input.DueDate != nil {
		invoice.DueDate = input.DueDate
	}

	if input.IssuedAt != nil {
		invoice.IssuedAt = input.IssuedAt
	}

	if input.PaidAt != nil {
		invoice.PaidAt = input.PaidAt
	}

	if input.VoidedAt != nil {
		invoice.VoidedAt = input.VoidedAt
	}

	if input.AllowedPaymentRails != nil {
		invoice.AllowedPaymentRails = pq.StringArray(*input.AllowedPaymentRails)
	}

	updateErr := s.repo.Update(ctx, invoice)
	if updateErr != nil {
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateErr,
			Metadata: map[string]string{
				"function": "UpdateInvoice",
				"action":   "updating invoice",
			},
		})
	}

	return invoice, nil
}

type VoidInvoiceInput struct {
	InvoiceID string
}

func (s *invoiceService) VoidInvoice(ctx context.Context, input VoidInvoiceInput) (*models.Invoice, error) {
	populate := []string{"LineItems"}
	invoice, getErr := s.repo.GetByID(ctx, repository.GetInvoiceQuery{
		ID:       input.InvoiceID,
		Populate: &populate,
	})

	if getErr != nil {
		if errors.Is(getErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("InvoiceNotFound", &pkg.RentLoopErrorParams{
				Err: getErr,
			})
		}
		return nil, pkg.InternalServerError(getErr.Error(), &pkg.RentLoopErrorParams{
			Err: getErr,
			Metadata: map[string]string{
				"function": "VoidInvoice",
				"action":   "getting invoice",
			},
		})
	}

	if invoice.Status == "VOID" {
		return nil, pkg.BadRequestError("Invoice is already voided", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{
				"function": "VoidInvoice",
				"action":   "checking invoice status",
			},
		})
	}

	if invoice.Status == "PARTIALLY_PAID" || invoice.Status == "PAID" {
		return nil, pkg.BadRequestError("Cannot void a partially paid or paid invoice", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{
				"function": "VoidInvoice",
				"action":   "checking invoice status",
			},
		})
	}

	invoice.Status = "VOID"
	now := time.Now()
	invoice.VoidedAt = &now

	if invoice.Status == "DRAFT" {

		updateErr := s.repo.Update(ctx, invoice)
		if updateErr != nil {
			return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
				Err: updateErr,
				Metadata: map[string]string{
					"function": "VoidInvoice",
					"scenario": "Invoice is in DRAFT status",
					"action":   "updating invoice status to VOID",
				},
			})
		}

		return invoice, nil
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	updateErr := s.repo.Update(transCtx, invoice)
	if updateErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateErr,
			Metadata: map[string]string{
				"function": "VoidInvoice",
				"scenario": "Invoice is in ISSUED status",
				"action":   "updating invoice status to VOID",
			},
		})
	}

	// Create reversing journal entry to undo the original accounting entries
	originalLines := buildJournalEntryForInvoice(invoice, s.appCtx.Config.ChartOfAccounts)
	if len(originalLines) > 0 {
		reversedLines := buildReversingJournalEntry(originalLines)
		transactionDate := now.Format(time.RFC3339)
		reversalReference := fmt.Sprintf("VOID-%s", invoice.Code)

		_, journalErr := s.accountingService.RecordInvoiceCreated(transCtx, accounting.CreateJournalEntryRequest{
			Status:          string(accounting.JournalEntryStatusPosted),
			Reference:       reversalReference,
			TransactionDate: &transactionDate,
			Metadata: map[string]any{
				"invoice_id":      invoice.ID.String(),
				"invoice_code":    invoice.Code,
				"context_type":    invoice.ContextType,
				"payer_type":      invoice.PayerType,
				"payee_type":      invoice.PayeeType,
				"is_reversal":     true,
				"reversal_reason": "INVOICE_VOIDED",
				"original_ref":    invoice.Code,
			},
			Lines: reversedLines,
		})
		if journalErr != nil {
			transaction.Rollback()
			return nil, pkg.InternalServerError("Failed to create reversing journal entry", &pkg.RentLoopErrorParams{
				Err: journalErr,
				Metadata: map[string]string{
					"function":    "VoidInvoice",
					"action":      "creating reversing journal entry",
					"invoiceCode": invoice.Code,
				},
			})
		}
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"function": "VoidInvoice",
				"action":   "committing transaction",
			},
		})
	}

	return invoice, nil
}

func (s *invoiceService) GetByID(ctx context.Context, query repository.GetInvoiceQuery) (*models.Invoice, error) {
	invoice, err := s.repo.GetByID(ctx, query)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("InvoiceNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetByID",
				"action":   "getting invoice",
			},
		})
	}

	return invoice, nil
}

func (s *invoiceService) ListInvoices(
	ctx context.Context,
	filterQuery repository.ListInvoicesFilter,
) (*[]models.Invoice, int64, error) {
	invoices, err := s.repo.List(ctx, filterQuery)
	if err != nil {
		return nil, 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListInvoices",
				"action":   "listing invoices",
			},
		})
	}

	count, countErr := s.repo.Count(ctx, filterQuery)
	if countErr != nil {
		return nil, 0, pkg.InternalServerError(countErr.Error(), &pkg.RentLoopErrorParams{
			Err: countErr,
			Metadata: map[string]string{
				"function": "ListInvoices",
				"action":   "counting invoices",
			},
		})
	}

	return invoices, count, nil
}

type AddLineItemInput struct {
	InvoiceID   string
	Label       string
	Category    string
	Quantity    int64
	UnitAmount  int64
	TotalAmount int64
	Currency    string
	Metadata    *map[string]any
}

func (s *invoiceService) AddLineItem(ctx context.Context, input AddLineItemInput) (*models.InvoiceLineItem, error) {
	// Verify invoice exists
	_, getErr := s.repo.GetByID(ctx, repository.GetInvoiceQuery{
		ID: input.InvoiceID,
	})
	if getErr != nil {
		if errors.Is(getErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("InvoiceNotFound", &pkg.RentLoopErrorParams{
				Err: getErr,
			})
		}
		return nil, pkg.InternalServerError(getErr.Error(), &pkg.RentLoopErrorParams{
			Err: getErr,
			Metadata: map[string]string{
				"function": "AddLineItem",
				"action":   "getting invoice",
			},
		})
	}

	var metaJson *datatypes.JSON
	if input.Metadata != nil {
		json, err := lib.InterfaceToJSON(*input.Metadata)
		if err != nil {
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "AddLineItem",
					"action":   "marshalling metadata",
				},
			})
		}
		metaJson = json
	}

	lineItem := models.InvoiceLineItem{
		InvoiceID:   &input.InvoiceID,
		Label:       input.Label,
		Category:    input.Category,
		Quantity:    input.Quantity,
		UnitAmount:  input.UnitAmount,
		TotalAmount: input.TotalAmount,
		Currency:    input.Currency,
		Metadata:    metaJson,
	}

	createErr := s.repo.CreateLineItem(ctx, &lineItem)
	if createErr != nil {
		return nil, pkg.BadRequestError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err: createErr,
			Metadata: map[string]string{
				"function": "AddLineItem",
				"action":   "creating line item",
			},
		})
	}

	return &lineItem, nil
}

func (s *invoiceService) GetLineItems(ctx context.Context, invoiceID string) ([]models.InvoiceLineItem, error) {
	lineItems, err := s.repo.GetLineItems(ctx, invoiceID)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetLineItems",
				"action":   "getting line items",
			},
		})
	}

	return lineItems, nil
}

// ============================================================================
// Invoice Accounting Utilities
// ============================================================================

// buildTenantApplicationJournalEntry builds journal entry lines for tenant application invoices.
// Line items can include: SECURITY_DEPOSIT, INITIAL_DEPOSIT
// Accounting:
//   - Debit: Accounts Receivable (total amount)
//   - Credit: Security Deposits Held (if security deposit line exists)
//   - Credit: Rental Income (if initial deposit line exists)
func buildTenantApplicationJournalEntry(
	invoice *models.Invoice,
	accounts config.IChartOfAccounts,
) []accounting.CreateJournalEntryLineRequest {
	lines := []accounting.CreateJournalEntryLineRequest{}

	// Always debit Accounts Receivable for the total amount
	lines = append(lines, accounting.CreateJournalEntryLineRequest{
		AccountID: accounts.AccountsReceivableID,
		Debit:     invoice.SubTotal,
		Credit:    0,
		Notes: lib.StringPointer(
			fmt.Sprintf("Accounts receivable for tenant application invoice %s", invoice.Code),
		),
	})

	// Credit appropriate accounts based on line items
	for _, lineItem := range invoice.LineItems {
		switch lineItem.Category {
		case "SECURITY_DEPOSIT":
			lines = append(lines, accounting.CreateJournalEntryLineRequest{
				AccountID: accounts.SecurityDepositsHeldID,
				Debit:     0,
				Credit:    lineItem.TotalAmount,
				Notes:     lib.StringPointer(lineItem.Label),
			})
		case "INITIAL_DEPOSIT":
			lines = append(lines, accounting.CreateJournalEntryLineRequest{
				AccountID: accounts.RentalIncomeID,
				Debit:     0,
				Credit:    lineItem.TotalAmount,
				Notes:     lib.StringPointer(lineItem.Label),
			})
		}
	}

	return lines
}

// buildLeaseRentJournalEntry builds journal entry lines for lease rent invoices.
// Line items can include: RENT, MAINTENANCE_FEE
// Accounting:
//   - Debit: Accounts Receivable (total amount)
//   - Credit: Rental Income (for rent portion)
//   - Credit: Maintenance Reimbursement (for maintenance fee portion)
func buildLeaseRentJournalEntry(
	invoice *models.Invoice,
	accounts config.IChartOfAccounts,
) []accounting.CreateJournalEntryLineRequest {
	lines := []accounting.CreateJournalEntryLineRequest{}

	// Always debit Accounts Receivable for the total amount
	lines = append(lines, accounting.CreateJournalEntryLineRequest{
		AccountID: accounts.AccountsReceivableID,
		Debit:     invoice.SubTotal,
		Credit:    0,
		Notes:     lib.StringPointer(fmt.Sprintf("Accounts receivable for lease rent invoice %s", invoice.Code)),
	})

	// Credit appropriate accounts based on line items
	for _, lineItem := range invoice.LineItems {
		switch lineItem.Category {
		case "RENT":
			lines = append(lines, accounting.CreateJournalEntryLineRequest{
				AccountID: accounts.RentalIncomeID,
				Debit:     0,
				Credit:    lineItem.TotalAmount,
				Notes:     lib.StringPointer(lineItem.Label),
			})
		case "MAINTENANCE_FEE":
			lines = append(lines, accounting.CreateJournalEntryLineRequest{
				AccountID: accounts.MaintenanceReimbursementID,
				Debit:     0,
				Credit:    lineItem.TotalAmount,
				Notes:     lib.StringPointer(lineItem.Label),
			})
		}
	}

	return lines
}

// buildSaasJournalEntry builds journal entry lines for SAAS fee invoices.
// Accounting:
//   - Debit: Accounts Receivable (total amount)
//   - Credit: Subscription Revenue (total amount)
func buildSaasJournalEntry(
	invoice *models.Invoice,
	accounts config.IChartOfAccounts,
) []accounting.CreateJournalEntryLineRequest {
	return []accounting.CreateJournalEntryLineRequest{
		{
			AccountID: accounts.AccountsReceivableID,
			Debit:     invoice.TotalAmount,
			Credit:    0,
			Notes:     lib.StringPointer(fmt.Sprintf("Accounts receivable for SAAS invoice %s", invoice.Code)),
		},
		{
			AccountID: accounts.SubscriptionRevenueID,
			Debit:     0,
			Credit:    invoice.TotalAmount,
			Notes:     lib.StringPointer(fmt.Sprintf("Subscription revenue - %s", invoice.Code)),
		},
	}
}

// buildMaintenanceJournalEntry builds journal entry lines for maintenance invoices.
// TODO: Implement when requirements are clarified
func buildMaintenanceJournalEntry(
	invoice *models.Invoice,
	accounts config.IChartOfAccounts,
) []accounting.CreateJournalEntryLineRequest {
	// TODO: Implement maintenance invoice accounting
	return []accounting.CreateJournalEntryLineRequest{}
}

// buildGeneralExpenseJournalEntry builds journal entry lines for general expense invoices.
// TODO: Implement when requirements are clarified
func buildGeneralExpenseJournalEntry(
	invoice *models.Invoice,
	accounts config.IChartOfAccounts,
) []accounting.CreateJournalEntryLineRequest {
	// TODO: Implement general expense invoice accounting
	return []accounting.CreateJournalEntryLineRequest{}
}

// buildJournalEntryForInvoice routes to the appropriate journal entry builder based on context type.
func buildJournalEntryForInvoice(
	invoice *models.Invoice,
	accounts config.IChartOfAccounts,
) []accounting.CreateJournalEntryLineRequest {
	switch invoice.ContextType {
	case "TENANT_APPLICATION":
		return buildTenantApplicationJournalEntry(invoice, accounts)
	case "LEASE_RENT":
		return buildLeaseRentJournalEntry(invoice, accounts)
	case "SAAS_FEE":
		return buildSaasJournalEntry(invoice, accounts)
	case "MAINTENANCE":
		return buildMaintenanceJournalEntry(invoice, accounts)
	case "GENERAL_EXPENSE":
		return buildGeneralExpenseJournalEntry(invoice, accounts)
	default:
		return []accounting.CreateJournalEntryLineRequest{}
	}
}

// buildReversingJournalEntry creates reversing journal entry lines by swapping debits and credits.
// This is used when voiding an invoice to reverse the original accounting entries.
func buildReversingJournalEntry(
	originalLines []accounting.CreateJournalEntryLineRequest,
) []accounting.CreateJournalEntryLineRequest {
	reversedLines := make([]accounting.CreateJournalEntryLineRequest, len(originalLines))

	for i, line := range originalLines {
		// Swap debit and credit to reverse the entry
		reversedLines[i] = accounting.CreateJournalEntryLineRequest{
			AccountID: line.AccountID,
			Debit:     line.Credit, // Original credit becomes debit
			Credit:    line.Debit,  // Original debit becomes credit
			Notes:     line.Notes,
		}

		// Update notes to indicate this is a reversal
		if line.Notes != nil {
			reversalNote := fmt.Sprintf("[REVERSAL] %s", *line.Notes)
			reversedLines[i].Notes = &reversalNote
		}
	}

	return reversedLines
}
