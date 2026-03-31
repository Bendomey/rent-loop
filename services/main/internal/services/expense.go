package services

import (
	"context"
	"fmt"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	gonanoid "github.com/matoous/go-nanoid"
	"gorm.io/gorm"
)

type ExpenseService interface {
	AddExpense(ctx context.Context, input AddExpenseInput) (*models.Expense, error)
	GetExpense(ctx context.Context, id string) (*models.Expense, error)
	ListExpenses(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListExpensesFilter,
	) ([]models.Expense, error)
	CountExpenses(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListExpensesFilter,
	) (int64, error)
	DeleteExpense(ctx context.Context, expenseID string) error
	GenerateExpenseInvoice(ctx context.Context, input GenerateExpenseInvoiceInput) ([]models.Invoice, error)
}

type expenseService struct {
	appCtx         pkg.AppContext
	repo           repository.ExpenseRepository
	leaseRepo      repository.LeaseRepository
	mrRepo         repository.MaintenanceRequestRepository
	invoiceService InvoiceService
}

type ExpenseServiceDeps struct {
	AppCtx         pkg.AppContext
	Repo           repository.ExpenseRepository
	LeaseRepo      repository.LeaseRepository
	MRRepo         repository.MaintenanceRequestRepository
	InvoiceService InvoiceService
}

func NewExpenseService(deps ExpenseServiceDeps) ExpenseService {
	return &expenseService{
		appCtx:         deps.AppCtx,
		repo:           deps.Repo,
		leaseRepo:      deps.LeaseRepo,
		mrRepo:         deps.MRRepo,
		invoiceService: deps.InvoiceService,
	}
}

// --- Input types ---

type AddExpenseInput struct {
	PropertyID                  string
	ContextType                 string // "MAINTENANCE" | "LEASE"
	ContextLeaseID              *string
	ContextMaintenanceRequestID *string
	Description                 string
	Amount                      int64
	Currency                    string
	ClientUserID                string
}

type GenerateExpenseInvoicePayerInput struct {
	Amount    int64
	PayeeType string // "TENANT" | "PROPERTY_OWNER" | "EXTERNAL"
	PayerType string // "TENANT" | "PROPERTY_OWNER" | "EXTERNAL"
}

type GenerateExpenseInvoiceInput struct {
	ExpenseID string
	ClientID  string
	Payers    []GenerateExpenseInvoicePayerInput
}

// --- Implementations ---

func (s *expenseService) AddExpense(ctx context.Context, input AddExpenseInput) (*models.Expense, error) {
	nanoID, err := gonanoid.Generate("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", 6)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "AddExpense",
				"action":   "generating expense code",
			},
		})
	}

	year, month, _ := time.Now().Date()
	code := fmt.Sprintf("EXP-%02d%02d-%s", year%100, month, nanoID)

	currency := input.Currency
	if currency == "" {
		currency = "GHS"
	}

	expense := &models.Expense{
		Code:                        code,
		PropertyID:                  input.PropertyID,
		ContextType:                 input.ContextType,
		ContextLeaseID:              input.ContextLeaseID,
		ContextMaintenanceRequestID: input.ContextMaintenanceRequestID,
		Description:                 input.Description,
		Amount:                      input.Amount,
		Currency:                    currency,
		CreatedByClientUserID:       input.ClientUserID,
	}

	if err := s.repo.Create(ctx, expense); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "AddExpense",
				"action":   "creating expense",
			},
		})
	}

	return expense, nil
}

func (s *expenseService) GetExpense(ctx context.Context, id string) (*models.Expense, error) {
	populate := []string{"Invoices"}
	expense, err := s.repo.GetOne(ctx, repository.GetExpenseQuery{
		ID:       id,
		Populate: &populate,
	})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, pkg.NotFoundError("expense not found", nil)
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetExpense",
				"action":   "fetching expense",
			},
		})
	}
	return expense, nil
}

func (s *expenseService) ListExpenses(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListExpensesFilter,
) ([]models.Expense, error) {
	expenses, err := s.repo.List(ctx, filterQuery, filters)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListExpenses",
				"action":   "listing expenses",
			},
		})
	}
	return *expenses, nil
}

func (s *expenseService) CountExpenses(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListExpensesFilter,
) (int64, error) {
	count, err := s.repo.Count(ctx, filterQuery, filters)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountExpenses",
				"action":   "counting expenses",
			},
		})
	}
	return count, nil
}

func (s *expenseService) DeleteExpense(ctx context.Context, expenseID string) error {
	if err := s.repo.Delete(ctx, expenseID); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "DeleteExpense",
				"action":   "deleting expense",
			},
		})
	}
	return nil
}

func (s *expenseService) GenerateExpenseInvoice(
	ctx context.Context,
	input GenerateExpenseInvoiceInput,
) ([]models.Invoice, error) {
	if len(input.Payers) == 0 {
		return nil, pkg.BadRequestError("at least one payer is required to generate an invoice", nil)
	}

	// Load expense with invoices
	populate := []string{"Invoices"}
	expense, err := s.repo.GetOne(ctx, repository.GetExpenseQuery{
		ID:       input.ExpenseID,
		Populate: &populate,
	})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, pkg.NotFoundError("expense not found", nil)
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GenerateExpenseInvoice",
				"action":   "fetching expense",
			},
		})
	}

	// Validate total payer coverage
	var totalPayerAmount int64
	for _, payer := range input.Payers {
		totalPayerAmount += payer.Amount
	}
	if totalPayerAmount < expense.Amount {
		return nil, pkg.BadRequestError("total payer amount must cover the full expense amount", nil)
	}

	lineItem := LineItemInput{
		Label:       expense.Description,
		Category:    "EXPENSE",
		Quantity:    1,
		UnitAmount:  expense.Amount,
		TotalAmount: expense.Amount,
		Currency:    expense.Currency,
	}

	tx := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, tx)

	var invoices []models.Invoice
	expenseID := expense.ID.String()

	switch expense.ContextType {
	case "LEASE":
		if expense.ContextLeaseID == nil {
			tx.Rollback()
			return nil, pkg.BadRequestError("expense has no associated lease", nil)
		}

		lease, leaseErr := s.leaseRepo.GetOneWithPopulate(ctx, repository.GetLeaseQuery{
			ID:       *expense.ContextLeaseID,
			Populate: &[]string{"Tenant", "Unit"},
		})
		if leaseErr != nil {
			tx.Rollback()
			if leaseErr == gorm.ErrRecordNotFound {
				return nil, pkg.NotFoundError("lease not found", nil)
			}
			return nil, pkg.InternalServerError(leaseErr.Error(), &pkg.RentLoopErrorParams{
				Err: leaseErr,
				Metadata: map[string]string{
					"function": "GenerateExpenseInvoice",
					"action":   "fetching lease",
				},
			})
		}

		leaseID := lease.ID.String()
		propertyID := lease.Unit.PropertyID
		lineItem.Metadata = &map[string]any{"lease_id": leaseID}

		for _, payer := range input.Payers {
			if payer.PayerType != "TENANT" && payer.PayerType != "PROPERTY_OWNER" {
				tx.Rollback()
				return nil, pkg.BadRequestError("invalid payer type: "+payer.PayerType, nil)
			}

			inv := CreateInvoiceInput{
				ClientID:          &input.ClientID,
				PropertyID:        &propertyID,
				PayerType:         payer.PayerType,
				PayeeType:         payer.PayeeType,
				ContextType:       "GENERAL_EXPENSE",
				ContextLeaseID:    &leaseID,
				ContextExpenseID:  &expenseID,
				TotalAmount:       payer.Amount,
				SubTotal:          payer.Amount,
				Currency:          expense.Currency,
				LineItems:         []LineItemInput{lineItem},
				Status:            "ISSUED",
				SendNotifications: true,
			}

			if payer.PayerType == "TENANT" || payer.PayeeType == "TENANT" {
				if lease.TenantId == "" {
					tx.Rollback()
					return nil, pkg.BadRequestError(
						"cannot generate invoice: no tenant associated with this lease",
						nil,
					)
				}
				tenantID := lease.TenantId
				if inv.PayerType == "TENANT" {
					inv.PayerTenantID = &tenantID
				}
				if inv.PayeeType == "TENANT" {
					inv.PayeeTenantID = &tenantID
				}
			}
			if inv.PayerType == "PROPERTY_OWNER" {
				inv.PayerClientID = &input.ClientID
			}
			if inv.PayeeType == "PROPERTY_OWNER" {
				inv.PayeeClientID = &input.ClientID
			}

			invoice, invoiceErr := s.invoiceService.CreateInvoice(transCtx, inv)
			if invoiceErr != nil {
				tx.Rollback()
				return nil, invoiceErr
			}
			invoices = append(invoices, *invoice)
		}

	case "MAINTENANCE":
		if expense.ContextMaintenanceRequestID == nil {
			tx.Rollback()
			return nil, pkg.BadRequestError("expense has no associated maintenance request", nil)
		}

		mr, mrErr := s.mrRepo.GetOneWithPopulate(ctx, repository.GetMaintenanceRequestQuery{
			ID:       *expense.ContextMaintenanceRequestID,
			Populate: &[]string{"Lease", "Lease.Tenant", "Unit"},
		})
		if mrErr != nil {
			tx.Rollback()
			if mrErr == gorm.ErrRecordNotFound {
				return nil, pkg.NotFoundError("maintenance request not found", nil)
			}
			return nil, pkg.InternalServerError(mrErr.Error(), &pkg.RentLoopErrorParams{
				Err: mrErr,
				Metadata: map[string]string{
					"function": "GenerateExpenseInvoice",
					"action":   "fetching maintenance request",
				},
			})
		}

		propertyID := mr.Unit.PropertyID
		lineItem.Metadata = &map[string]any{"mr": mr.ID.String()}

		for _, payer := range input.Payers {
			if payer.PayerType != "TENANT" && payer.PayerType != "PROPERTY_OWNER" {
				tx.Rollback()
				return nil, pkg.BadRequestError("invalid payer type: "+payer.PayerType, nil)
			}

			inv := CreateInvoiceInput{
				ClientID:          &input.ClientID,
				PropertyID:        &propertyID,
				PayerType:         payer.PayerType,
				PayeeType:         payer.PayeeType,
				ContextType:       "MAINTENANCE_EXPENSE",
				ContextExpenseID:  &expenseID,
				TotalAmount:       payer.Amount,
				SubTotal:          payer.Amount,
				Currency:          expense.Currency,
				LineItems:         []LineItemInput{lineItem},
				Status:            "ISSUED",
				SendNotifications: true,
			}

			if payer.PayerType == "TENANT" || payer.PayeeType == "TENANT" {
				var tenantID string
				if mr.Lease != nil && mr.Lease.TenantId != "" {
					tenantID = mr.Lease.TenantId
				} else if mr.CreatedByTenantID != nil {
					tenantID = *mr.CreatedByTenantID
				} else {
					tx.Rollback()
					return nil, pkg.BadRequestError("cannot generate invoice: no tenant associated with this maintenance request", nil)
				}
				if inv.PayerType == "TENANT" {
					inv.PayerTenantID = &tenantID
				}
				if inv.PayeeType == "TENANT" {
					inv.PayeeTenantID = &tenantID
				}
			}
			if inv.PayerType == "PROPERTY_OWNER" {
				inv.PayerClientID = &input.ClientID
			}
			if inv.PayeeType == "PROPERTY_OWNER" {
				inv.PayeeClientID = &input.ClientID
			}

			invoice, invoiceErr := s.invoiceService.CreateInvoice(transCtx, inv)
			if invoiceErr != nil {
				tx.Rollback()
				return nil, invoiceErr
			}
			invoices = append(invoices, *invoice)
		}

	default:
		tx.Rollback()
		return nil, pkg.BadRequestError("unsupported expense context type: "+expense.ContextType, nil)
	}

	if commitErr := tx.Commit().Error; commitErr != nil {
		tx.Rollback()
		return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"function": "GenerateExpenseInvoice",
				"action":   "committing transaction",
			},
		})
	}

	return invoices, nil
}
