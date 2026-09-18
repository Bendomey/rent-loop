package services

import (
	"context"
	"fmt"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services/expenses"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	gonanoid "github.com/matoous/go-nanoid"
	"gorm.io/gorm"
)

type ExpenseService interface {
	CreateExpense(ctx context.Context, input CreateExpenseInput) (*models.Expense, error)
	UpdateExpense(ctx context.Context, input UpdateExpenseInput) (*models.Expense, error)
	VoidExpense(ctx context.Context, expenseID, reason string, voidedBy *string) error
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
}

type expenseService struct {
	appCtx         pkg.AppContext
	repo           repository.ExpenseRepository
	invoiceService InvoiceService
	paymentService PaymentService
}

type ExpenseServiceDeps struct {
	AppCtx         pkg.AppContext
	Repo           repository.ExpenseRepository
	InvoiceService InvoiceService
	PaymentService PaymentService
}

func NewExpenseService(deps ExpenseServiceDeps) ExpenseService {
	return &expenseService{
		appCtx:         deps.AppCtx,
		repo:           deps.Repo,
		invoiceService: deps.InvoiceService,
		paymentService: deps.PaymentService,
	}
}

// --- Input types ---

type CreateExpenseInput struct {
	PropertyID    string
	ClientID      *string
	ContextType   string // GENERAL from a handler; MAINTENANCE only from the MRF service
	Category      string
	VendorName    string
	VendorContact *string
	Description   string
	Amount        int64
	Currency      string
	DueDate       *time.Time
	ClientUserID  string

	// AlreadyPaid folds "I paid this last week" into one step: the offline
	// payment is recorded in the same transaction, so the expense lands
	// settled and both journal entries post together. Most general expenses
	// are entered after the money has left.
	AlreadyPaid      bool
	PaymentProvider  *string
	PaymentReference *string
}

type UpdateExpenseInput struct {
	ExpenseID     string
	Description   *string
	Category      *string
	VendorName    *string
	VendorContact *string
	Amount        *int64
}

// --- Implementations ---

// CreateExpense records a debt to a vendor and raises the bill for it in one
// transaction. The invoice is not optional: it is the only thing that posts to
// the ledger, so an expense without one would leave the cost off the books.
func (s *expenseService) CreateExpense(
	ctx context.Context,
	input CreateExpenseInput,
) (*models.Expense, error) {
	if input.Amount <= 0 {
		return nil, pkg.BadRequestError("ExpenseAmountMustBePositive", nil)
	}
	if input.VendorName == "" {
		return nil, pkg.BadRequestError("VendorNameRequired", nil)
	}

	nanoID, err := gonanoid.Generate("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", 6)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateExpense",
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

	outerTx, hasOuterTx := lib.TransactionFromContext(ctx)
	hasOuterTx = hasOuterTx && outerTx != nil
	transaction := outerTx
	if !hasOuterTx {
		transaction = s.appCtx.DB.Begin()
	}
	transCtx := lib.WithTransaction(ctx, transaction)

	rollback := func() {
		if !hasOuterTx {
			transaction.Rollback()
		}
	}

	vendorName := input.VendorName
	expense := &models.Expense{
		Code:                  code,
		ContextType:           input.ContextType,
		PropertyID:            input.PropertyID,
		Category:              input.Category,
		VendorName:            &vendorName,
		VendorContact:         input.VendorContact,
		Description:           input.Description,
		Amount:                input.Amount,
		Currency:              currency,
		CreatedByClientUserID: input.ClientUserID,
	}

	if createErr := s.repo.Create(transCtx, expense); createErr != nil {
		rollback()
		return nil, pkg.InternalServerError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err: createErr,
			Metadata: map[string]string{
				"function": "CreateExpense",
				"action":   "creating expense",
			},
		})
	}

	invoice, invoiceErr := s.invoiceService.CreateExpenseInvoice(transCtx, CreateExpenseInvoiceInput{
		ExpenseID:   expense.ID.String(),
		PropertyID:  input.PropertyID,
		ClientID:    input.ClientID,
		Category:    input.Category,
		VendorName:  vendorName,
		Description: input.Description,
		Amount:      input.Amount,
		Currency:    currency,
		DueDate:     input.DueDate,
	})
	if invoiceErr != nil {
		rollback()
		return nil, invoiceErr
	}

	if input.AlreadyPaid {
		_, payErr := s.paymentService.RecordExpensePayment(transCtx, RecordExpensePaymentInput{
			InvoiceID:    invoice.ID.String(),
			Amount:       input.Amount,
			Provider:     input.PaymentProvider,
			Reference:    input.PaymentReference,
			ClientUserID: input.ClientUserID,
		})
		if payErr != nil {
			rollback()
			return nil, payErr
		}
	}

	if !hasOuterTx {
		if commitErr := transaction.Commit().Error; commitErr != nil {
			return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
				Err: commitErr,
				Metadata: map[string]string{
					"function": "CreateExpense",
					"action":   "committing",
				},
			})
		}
	}

	return s.GetExpense(ctx, expense.ID.String())
}

// UpdateExpense changes the descriptive fields of a bill nobody has paid yet.
//
// Amount and category are deliberately not among them. Both decide what the
// already-posted journal entry says — the amount is its value, the category
// picks which expense account it debits — so changing either here would leave
// the expense and the ledger disagreeing. Voiding and recreating is the honest
// correction, and it is one action either way.
func (s *expenseService) UpdateExpense(
	ctx context.Context,
	input UpdateExpenseInput,
) (*models.Expense, error) {
	expense, err := s.GetExpense(ctx, input.ExpenseID)
	if err != nil {
		return nil, err
	}

	if !expenses.IsExpenseClean(expenses.ExpenseStatusView(expense)) {
		return nil, pkg.BadRequestError("ExpenseIsSettledAndFrozen", nil)
	}

	if input.Amount != nil {
		return nil, pkg.BadRequestError("VoidAndRecreateToChangeAmount", nil)
	}

	if input.Category != nil && *input.Category != expense.Category {
		return nil, pkg.BadRequestError("VoidAndRecreateToChangeCategory", nil)
	}

	if input.Description != nil {
		expense.Description = *input.Description
	}
	if input.VendorName != nil {
		expense.VendorName = input.VendorName
	}
	if input.VendorContact != nil {
		expense.VendorContact = input.VendorContact
	}

	if saveErr := s.repo.Update(ctx, expense); saveErr != nil {
		return nil, pkg.InternalServerError(saveErr.Error(), &pkg.RentLoopErrorParams{
			Err: saveErr,
			Metadata: map[string]string{
				"function": "UpdateExpense",
				"action":   "saving expense",
			},
		})
	}

	return s.GetExpense(ctx, input.ExpenseID)
}

// VoidExpense withdraws a bill and the debt it created. Voiding the invoice is
// what reverses the journal entry, so the two must move together.
func (s *expenseService) VoidExpense(
	ctx context.Context,
	expenseID, reason string,
	voidedBy *string,
) error {
	expense, err := s.GetExpense(ctx, expenseID)
	if err != nil {
		return err
	}

	if !expenses.IsExpenseClean(expenses.ExpenseStatusView(expense)) {
		return pkg.BadRequestError("ExpenseIsSettledAndFrozen", nil)
	}

	outerTx, hasOuterTx := lib.TransactionFromContext(ctx)
	hasOuterTx = hasOuterTx && outerTx != nil
	transaction := outerTx
	if !hasOuterTx {
		transaction = s.appCtx.DB.Begin()
	}
	transCtx := lib.WithTransaction(ctx, transaction)

	rollback := func() {
		if !hasOuterTx {
			transaction.Rollback()
		}
	}

	for i := range expense.Invoices {
		if expense.Invoices[i].Status == "VOID" {
			continue
		}
		_, voidErr := s.invoiceService.VoidInvoice(transCtx, VoidInvoiceInput{
			InvoiceID:            expense.Invoices[i].ID.String(),
			VoidedReason:         &reason,
			VoidedByClientUserID: voidedBy,
		})
		if voidErr != nil {
			rollback()
			return voidErr
		}
	}

	now := time.Now()
	expense.VoidedAt = &now
	expense.VoidedReason = &reason

	if saveErr := s.repo.Update(transCtx, expense); saveErr != nil {
		rollback()
		return pkg.InternalServerError(saveErr.Error(), &pkg.RentLoopErrorParams{
			Err: saveErr,
			Metadata: map[string]string{
				"function": "VoidExpense",
				"action":   "saving expense",
			},
		})
	}

	if !hasOuterTx {
		return transaction.Commit().Error
	}
	return nil
}

func (s *expenseService) GetExpense(ctx context.Context, id string) (*models.Expense, error) {
	populate := []string{"Invoices", "Financials"}
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
	results, err := s.repo.List(ctx, filterQuery, filters)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListExpenses",
				"action":   "listing expenses",
			},
		})
	}
	return *results, nil
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
