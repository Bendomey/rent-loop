package services

import (
	"context"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services/expenses"
	"github.com/Bendomey/rent-loop/services/main/internal/services/financials"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"gorm.io/gorm"
)

// financialPopulate is what every read of a line must preload. Status and
// editability are derived from the link, so a line read without them reads as
// outstanding no matter what has actually happened to it.
var financialPopulate = []string{"ChargeInstance", "Expense", "Expense.Invoices"}

type MaintenanceRequestFinancialService interface {
	CreateFinancial(
		ctx context.Context,
		input CreateFinancialInput,
	) (*models.MaintenanceRequestFinancial, error)
	ListFinancials(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListMaintenanceRequestFinancialsFilter,
	) ([]models.MaintenanceRequestFinancial, error)
	CountFinancials(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListMaintenanceRequestFinancialsFilter,
	) (int64, error)
	UpdateFinancial(
		ctx context.Context,
		input UpdateFinancialInput,
	) (*models.MaintenanceRequestFinancial, error)
	VoidFinancial(ctx context.Context, financialID, reason string, clientUserID *string) error
}

type mrFinancialService struct {
	appCtx         pkg.AppContext
	repo           repository.MaintenanceRequestFinancialRepository
	mrRepo         repository.MaintenanceRequestRepository
	leaseRepo      repository.LeaseRepository
	expenseService ExpenseService
	charges        financials.ChargeService
}

type MaintenanceRequestFinancialServiceDeps struct {
	AppCtx         pkg.AppContext
	Repo           repository.MaintenanceRequestFinancialRepository
	MRRepo         repository.MaintenanceRequestRepository
	LeaseRepo      repository.LeaseRepository
	ExpenseService ExpenseService
	Charges        financials.ChargeService
}

func NewMaintenanceRequestFinancialService(
	deps MaintenanceRequestFinancialServiceDeps,
) MaintenanceRequestFinancialService {
	return &mrFinancialService{
		appCtx:         deps.AppCtx,
		repo:           deps.Repo,
		mrRepo:         deps.MRRepo,
		leaseRepo:      deps.LeaseRepo,
		expenseService: deps.ExpenseService,
		charges:        deps.Charges,
	}
}

// --- Input types ---

type CreateFinancialInput struct {
	MaintenanceRequestID string
	Description          string
	Amount               int64
	Currency             string
	SettlementType       string
	ClientUserID         string

	ChargeCategory string // MAINTENANCE_CHARGE | DAMAGE_CHARGE | UTILITY | OTHER
	ChargeDueDate  *time.Time

	ExpenseCategory  string
	VendorName       string
	VendorContact    *string
	DueDate          *time.Time
	AlreadyPaid      bool
	PaymentProvider  *string
	PaymentReference *string
}

type UpdateFinancialInput struct {
	FinancialID       string
	Description       *string
	NewSettlementType *string
	ClientUserID      string

	ChargeCategory  string
	ChargeDueDate   *time.Time
	ExpenseCategory string
	VendorName      string
	VendorContact   *string
}

// --- Implementations ---

// CreateFinancial records one costed line on a request and, if somebody is
// settling it, creates the obligation in the same transaction.
//
// The line itself posts nothing to the ledger. Money reaches the books through
// the charge or the expense it points at, and only when those are invoiced.
func (s *mrFinancialService) CreateFinancial(
	ctx context.Context,
	input CreateFinancialInput,
) (*models.MaintenanceRequestFinancial, error) {
	if input.Amount <= 0 {
		return nil, pkg.BadRequestError("FinancialAmountMustBePositive", nil)
	}

	request, err := s.mrRepo.GetOneWithPopulate(ctx, repository.GetMaintenanceRequestQuery{
		ID: input.MaintenanceRequestID,
	})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, pkg.NotFoundError("MaintenanceRequestNotFound", nil)
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "CreateFinancial", "action": "fetching request"},
		})
	}

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

	financial := &models.MaintenanceRequestFinancial{
		MaintenanceRequestID:  request.ID.String(),
		PropertyID:            request.PropertyID,
		Description:           input.Description,
		Amount:                input.Amount,
		Currency:              currency,
		SettlementType:        input.SettlementType,
		CreatedByClientUserID: input.ClientUserID,
	}

	if linkErr := s.buildLink(transCtx, request, input, currency, financial); linkErr != nil {
		rollback()
		return nil, linkErr
	}

	if createErr := s.repo.Create(transCtx, financial); createErr != nil {
		rollback()
		return nil, pkg.InternalServerError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err:      createErr,
			Metadata: map[string]string{"function": "CreateFinancial", "action": "creating line"},
		})
	}

	if !hasOuterTx {
		if commitErr := transaction.Commit().Error; commitErr != nil {
			return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
				Err:      commitErr,
				Metadata: map[string]string{"function": "CreateFinancial", "action": "committing"},
			})
		}
	}

	return s.getPopulated(ctx, financial.ID.String())
}

// buildLink writes whichever settlement the type calls for onto the line. It
// is the single place a link is created, so creation and conversion cannot
// drift apart.
func (s *mrFinancialService) buildLink(
	ctx context.Context,
	request *models.MaintenanceRequest,
	input CreateFinancialInput,
	currency string,
	financial *models.MaintenanceRequestFinancial,
) error {
	switch input.SettlementType {
	case expenses.SettlementRecordOnly:
		return nil

	case expenses.SettlementTenantCharge:
		charge, err := s.createTenantCharge(ctx, request, input, currency)
		if err != nil {
			return err
		}
		id := charge.ID.String()
		financial.ChargeInstanceID = &id
		return nil

	case expenses.SettlementVendorExpense:
		expense, err := s.expenseService.CreateExpense(ctx, CreateExpenseInput{
			PropertyID:       request.PropertyID,
			ContextType:      "MAINTENANCE",
			Category:         input.ExpenseCategory,
			VendorName:       input.VendorName,
			VendorContact:    input.VendorContact,
			Description:      input.Description,
			Amount:           input.Amount,
			Currency:         currency,
			DueDate:          input.DueDate,
			ClientUserID:     input.ClientUserID,
			AlreadyPaid:      input.AlreadyPaid,
			PaymentProvider:  input.PaymentProvider,
			PaymentReference: input.PaymentReference,
		})
		if err != nil {
			return err
		}
		id := expense.ID.String()
		financial.ExpenseID = &id
		return nil

	default:
		return pkg.BadRequestError("UnknownSettlementType", nil)
	}
}

// createTenantCharge refuses anything the request cannot support.
//
// A request with no lease has no tenant to charge, and that is settled here
// rather than resolved from the affected units: charging the tenant in a unit
// the request merely touches is not the same as charging the tenant who holds
// the lease it was raised under.
func (s *mrFinancialService) createTenantCharge(
	ctx context.Context,
	request *models.MaintenanceRequest,
	input CreateFinancialInput,
	currency string,
) (*models.ChargeInstance, error) {
	if request.LeaseID == nil {
		return nil, pkg.BadRequestError("MaintenanceRequestHasNoLease", nil)
	}

	lease, err := s.leaseRepo.GetOneWithPopulate(ctx, repository.GetLeaseQuery{ID: *request.LeaseID})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, pkg.NotFoundError("LeaseNotFound", nil)
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "createTenantCharge", "action": "fetching lease"},
		})
	}

	if lease.FinancialAccountID == nil {
		return nil, pkg.BadRequestError("LeaseHasNoFinancialAccount", nil)
	}

	dueDate := time.Now()
	if input.ChargeDueDate != nil {
		dueDate = *input.ChargeDueDate
	}

	category := input.ChargeCategory
	if category == "" {
		category = financials.CategoryMaintenanceCharge
	}

	// CreateAdHoc applies its own assertOpen, so a closed account refuses the
	// write without a second guard here.
	return s.charges.CreateAdHoc(ctx, financials.CreateAdHocChargeInput{
		FinancialAccountID: *lease.FinancialAccountID,
		LeaseID:            request.LeaseID,
		Name:               input.Description,
		Category:           category,
		Amount:             input.Amount,
		Currency:           currency,
		DueDate:            dueDate,
	})
}

// UpdateFinancial edits a line nobody has billed or paid yet. A change of
// settlement type is a conversion, not an edit — see convert.
func (s *mrFinancialService) UpdateFinancial(
	ctx context.Context,
	input UpdateFinancialInput,
) (*models.MaintenanceRequestFinancial, error) {
	financial, err := s.getPopulated(ctx, input.FinancialID)
	if err != nil {
		return nil, err
	}

	if !expenses.IsFinancialEditable(expenses.FinancialStatusView(financial)) {
		return nil, pkg.BadRequestError("FinancialIsSettledAndFrozen", nil)
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

	if input.Description != nil {
		financial.Description = *input.Description
	}

	if input.NewSettlementType != nil && *input.NewSettlementType != financial.SettlementType {
		if convertErr := s.convert(transCtx, financial, input); convertErr != nil {
			rollback()
			return nil, convertErr
		}
	}

	if saveErr := s.repo.Update(transCtx, financial); saveErr != nil {
		rollback()
		return nil, pkg.InternalServerError(saveErr.Error(), &pkg.RentLoopErrorParams{
			Err:      saveErr,
			Metadata: map[string]string{"function": "UpdateFinancial", "action": "saving line"},
		})
	}

	if !hasOuterTx {
		if commitErr := transaction.Commit().Error; commitErr != nil {
			return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
				Err:      commitErr,
				Metadata: map[string]string{"function": "UpdateFinancial", "action": "committing"},
			})
		}
	}

	return s.getPopulated(ctx, input.FinancialID)
}

// convert voids the old link and creates the new one. It is not an update: a
// charge and an expense are obligations to different parties, and pretending
// one can become the other in place would leave the ledger holding a posting
// that no longer describes anything.
func (s *mrFinancialService) convert(
	ctx context.Context,
	financial *models.MaintenanceRequestFinancial,
	input UpdateFinancialInput,
) error {
	newType := *input.NewSettlementType

	if err := s.releaseLink(ctx, financial, "Converted to "+newType, &input.ClientUserID); err != nil {
		return err
	}

	request, err := s.mrRepo.GetOneWithPopulate(ctx, repository.GetMaintenanceRequestQuery{
		ID: financial.MaintenanceRequestID,
	})
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "convert", "action": "fetching request"},
		})
	}

	financial.ChargeInstanceID = nil
	financial.ExpenseID = nil
	financial.SettlementType = newType

	return s.buildLink(ctx, request, CreateFinancialInput{
		MaintenanceRequestID: financial.MaintenanceRequestID,
		Description:          financial.Description,
		Amount:               financial.Amount,
		Currency:             financial.Currency,
		SettlementType:       newType,
		ClientUserID:         input.ClientUserID,
		ChargeCategory:       input.ChargeCategory,
		ChargeDueDate:        input.ChargeDueDate,
		ExpenseCategory:      input.ExpenseCategory,
		VendorName:           input.VendorName,
		VendorContact:        input.VendorContact,
	}, financial.Currency, financial)
}

// releaseLink undoes whatever the line currently settles through.
func (s *mrFinancialService) releaseLink(
	ctx context.Context,
	financial *models.MaintenanceRequestFinancial,
	reason string,
	clientUserID *string,
) error {
	switch {
	case financial.ChargeInstanceID != nil:
		return s.charges.VoidInstance(ctx, financials.VoidChargeInput{
			ChargeInstanceID: *financial.ChargeInstanceID,
			Reason:           reason,
		})
	case financial.ExpenseID != nil:
		return s.expenseService.VoidExpense(ctx, *financial.ExpenseID, reason, clientUserID)
	default:
		return nil
	}
}

// VoidFinancial withdraws a line and whatever obligation it created.
func (s *mrFinancialService) VoidFinancial(
	ctx context.Context,
	financialID, reason string,
	clientUserID *string,
) error {
	financial, err := s.getPopulated(ctx, financialID)
	if err != nil {
		return err
	}

	if !expenses.IsFinancialEditable(expenses.FinancialStatusView(financial)) {
		return pkg.BadRequestError("FinancialIsSettledAndFrozen", nil)
	}

	outerTx, hasOuterTx := lib.TransactionFromContext(ctx)
	hasOuterTx = hasOuterTx && outerTx != nil
	transaction := outerTx
	if !hasOuterTx {
		transaction = s.appCtx.DB.Begin()
	}
	transCtx := lib.WithTransaction(ctx, transaction)

	if releaseErr := s.releaseLink(transCtx, financial, reason, clientUserID); releaseErr != nil {
		if !hasOuterTx {
			transaction.Rollback()
		}
		return releaseErr
	}

	if deleteErr := s.repo.Delete(transCtx, financialID); deleteErr != nil {
		if !hasOuterTx {
			transaction.Rollback()
		}
		return pkg.InternalServerError(deleteErr.Error(), &pkg.RentLoopErrorParams{
			Err:      deleteErr,
			Metadata: map[string]string{"function": "VoidFinancial", "action": "deleting line"},
		})
	}

	if !hasOuterTx {
		return transaction.Commit().Error
	}
	return nil
}

func (s *mrFinancialService) ListFinancials(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListMaintenanceRequestFinancialsFilter,
) ([]models.MaintenanceRequestFinancial, error) {
	if filterQuery.Populate == nil {
		filterQuery.Populate = &financialPopulate
	}

	results, err := s.repo.List(ctx, filterQuery, filters)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ListFinancials", "action": "listing lines"},
		})
	}
	return *results, nil
}

func (s *mrFinancialService) CountFinancials(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListMaintenanceRequestFinancialsFilter,
) (int64, error) {
	count, err := s.repo.Count(ctx, filterQuery, filters)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "CountFinancials", "action": "counting lines"},
		})
	}
	return count, nil
}

func (s *mrFinancialService) getPopulated(
	ctx context.Context,
	financialID string,
) (*models.MaintenanceRequestFinancial, error) {
	financial, err := s.repo.GetOne(ctx, repository.GetMaintenanceRequestFinancialQuery{
		ID:       financialID,
		Populate: &financialPopulate,
	})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, pkg.NotFoundError("FinancialNotFound", nil)
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "getPopulated", "action": "fetching line"},
		})
	}
	return financial, nil
}
