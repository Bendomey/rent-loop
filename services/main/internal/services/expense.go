package services

import (
	"context"
	"fmt"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/accounting"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	gonanoid "github.com/matoous/go-nanoid"
	log "github.com/sirupsen/logrus"
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
}

type expenseService struct {
	appCtx            pkg.AppContext
	repo              repository.ExpenseRepository
	leaseRepo         repository.LeaseRepository
	mrRepo            repository.MaintenanceRequestRepository
	accountingService AccountingService
}

type ExpenseServiceDeps struct {
	AppCtx            pkg.AppContext
	Repo              repository.ExpenseRepository
	LeaseRepo         repository.LeaseRepository
	MRRepo            repository.MaintenanceRequestRepository
	AccountingService AccountingService
}

func NewExpenseService(deps ExpenseServiceDeps) ExpenseService {
	return &expenseService{
		appCtx:            deps.AppCtx,
		repo:              deps.Repo,
		leaseRepo:         deps.LeaseRepo,
		mrRepo:            deps.MRRepo,
		accountingService: deps.AccountingService,
	}
}

// --- Input types ---

type AddExpenseInput struct {
	PropertyID                  string
	ContextType                 string // "MAINTENANCE"
	ContextMaintenanceRequestID *string
	Description                 string
	Amount                      int64
	Currency                    string
	ClientUserID                string
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

	// Expenses used to reach Fincore by generating an invoice. Now that they
	// bill nobody, they must post themselves — otherwise they would vanish
	// from the landlord's books entirely and silently.
	if postErr := s.postExpenseJournalEntry(ctx, expense); postErr != nil {
		log.WithError(postErr).WithField("expense_code", expense.Code).
			Error("failed to post expense journal entry")
	}

	return expense, nil
}

// postExpenseJournalEntry records the cost directly:
//
//	Dr Maintenance Expense / Cr Cash
//
// An Expense is money leaving the landlord, so it never touches Accounts
// Receivable. Recharging a tenant for the same underlying event is a separate
// DAMAGE_CHARGE on their financial account, and deliberately not derived from
// this record — the landlord may recharge more, less, or nothing.
func (s *expenseService) postExpenseJournalEntry(ctx context.Context, expense *models.Expense) error {
	accounts := s.appCtx.Config.ChartOfAccounts
	transactionDate := time.Now().Format(time.RFC3339)

	_, err := s.accountingService.RecordInvoiceCreated(ctx, accounting.CreateJournalEntryRequest{
		Status:          string(accounting.JournalEntryStatusPosted),
		Reference:       expense.Code,
		TransactionDate: &transactionDate,
		Metadata: map[string]any{
			"expense_id":   expense.ID.String(),
			"expense_code": expense.Code,
			"property_id":  expense.PropertyID,
			"context_type": expense.ContextType,
		},
		Lines: []accounting.CreateJournalEntryLineRequest{
			{
				AccountID: accounts.MaintenanceExpenseID,
				Debit:     expense.Amount,
				Credit:    0,
				Notes:     lib.StringPointer(expense.Description),
			},
			{
				AccountID: accounts.CashBankAccountID,
				Debit:     0,
				Credit:    expense.Amount,
				Notes:     lib.StringPointer(expense.Description),
			},
		},
	})
	return err
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
