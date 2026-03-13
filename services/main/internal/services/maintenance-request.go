package services

import (
	"context"
	"encoding/json"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	log "github.com/sirupsen/logrus"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type MaintenanceRequestService interface {
	CreateByTenant(ctx context.Context, input CreateMaintenanceRequestByTenantInput) (*models.MaintenanceRequest, error)
	CreateByAdmin(ctx context.Context, input CreateMaintenanceRequestByAdminInput) (*models.MaintenanceRequest, error)
	GetMaintenanceRequest(
		ctx context.Context,
		query repository.GetMaintenanceRequestQuery,
	) (*models.MaintenanceRequest, error)
	ListMaintenanceRequests(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListMaintenanceRequestsFilter,
	) ([]models.MaintenanceRequest, error)
	CountMaintenanceRequests(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListMaintenanceRequestsFilter,
	) (int64, error)
	UpdateMaintenanceRequest(
		ctx context.Context,
		input UpdateMaintenanceRequestInput,
	) (*models.MaintenanceRequest, error)
	AssignWorker(ctx context.Context, input AssignMaintenanceWorkerInput) error
	AssignManager(ctx context.Context, input AssignMaintenanceManagerInput) error
	UpdateStatus(ctx context.Context, input UpdateMaintenanceStatusInput) error
	ListActivityLogs(ctx context.Context, maintenanceRequestID string) ([]models.MaintenanceRequestActivityLog, error)
	AddExpense(ctx context.Context, input AddMaintenanceExpenseInput) (*models.Expense, error)
	ListExpenses(ctx context.Context, maintenanceRequestID string) ([]models.Expense, error)
	DeleteExpense(ctx context.Context, expenseID string) error
	GenerateExpenseInvoice(
		ctx context.Context,
		maintenanceRequestID string,
		actorClientID string,
	) (*models.Invoice, error)
}

type maintenanceRequestService struct {
	appCtx              pkg.AppContext
	repo                repository.MaintenanceRequestRepository
	tenantAccountRepo   repository.TenantAccountRepository
	notificationService NotificationService
	invoiceService      InvoiceService
}

type MaintenanceRequestServiceDeps struct {
	AppCtx              pkg.AppContext
	Repo                repository.MaintenanceRequestRepository
	TenantAccountRepo   repository.TenantAccountRepository
	NotificationService NotificationService
	InvoiceService      InvoiceService
}

func NewMaintenanceRequestService(deps MaintenanceRequestServiceDeps) MaintenanceRequestService {
	return &maintenanceRequestService{
		appCtx:              deps.AppCtx,
		repo:                deps.Repo,
		tenantAccountRepo:   deps.TenantAccountRepo,
		notificationService: deps.NotificationService,
		invoiceService:      deps.InvoiceService,
	}
}

// --- Input types ---

type CreateMaintenanceRequestByTenantInput struct {
	UnitID      string
	LeaseID     string
	TenantID    string
	Title       string
	Desc        string
	Priority    string
	Category    string
	Attachments []string
}

type CreateMaintenanceRequestByAdminInput struct {
	UnitID       string
	LeaseID      *string
	ClientUserID string
	Title        string
	Desc         string
	Priority     string
	Category     string
	Visibility   string // defaults to TENANT_VISIBLE if empty
	Attachments  []string
}

type UpdateMaintenanceRequestInput struct {
	ID          string
	Title       *string
	Desc        *string
	Priority    *string
	Category    *string
	Attachments *[]string
	Visibility  *string
}

type AssignMaintenanceWorkerInput struct {
	RequestID string
	WorkerID  string
	ActorID   string
}

type AssignMaintenanceManagerInput struct {
	RequestID string
	ManagerID string
	ActorID   string
}

type UpdateMaintenanceStatusInput struct {
	RequestID          string
	NewStatus          string
	ActorType          string // CLIENT_USER | TENANT
	ActorID            string
	CancellationReason *string
}

type AddMaintenanceExpenseInput struct {
	RequestID        string
	Description      string
	Amount           int64
	Currency         string
	PaidBy           string
	BillableToTenant bool
	ClientUserID     string
}

// --- Create ---

func (s *maintenanceRequestService) CreateByTenant(
	ctx context.Context,
	input CreateMaintenanceRequestByTenantInput,
) (*models.MaintenanceRequest, error) {
	mr := &models.MaintenanceRequest{
		UnitID:            input.UnitID,
		LeaseID:           &input.LeaseID,
		CreatedByTenantID: &input.TenantID,
		Title:             input.Title,
		Description:       input.Desc,
		Priority:          input.Priority,
		Category:          input.Category,
		Attachments:       input.Attachments,
		Status:            "NEW",
		Visibility:        "TENANT_VISIBLE",
	}

	if err := s.repo.Create(ctx, mr); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "CreateMaintenanceRequestByTenant"},
		})
	}

	_ = s.repo.CreateActivityLog(ctx, &models.MaintenanceRequestActivityLog{
		MaintenanceRequestID: mr.ID.String(),
		Action:               "CREATED",
		PerformedByTenantID:  &input.TenantID,
	})

	return mr, nil
}

func (s *maintenanceRequestService) CreateByAdmin(
	ctx context.Context,
	input CreateMaintenanceRequestByAdminInput,
) (*models.MaintenanceRequest, error) {
	visibility := "TENANT_VISIBLE"
	if input.Visibility != "" {
		visibility = input.Visibility
	}

	mr := &models.MaintenanceRequest{
		UnitID:                input.UnitID,
		LeaseID:               input.LeaseID,
		CreatedByClientUserID: &input.ClientUserID,
		Title:                 input.Title,
		Description:           input.Desc,
		Priority:              input.Priority,
		Category:              input.Category,
		Attachments:           input.Attachments,
		Status:                "NEW",
		Visibility:            visibility,
	}

	if err := s.repo.Create(ctx, mr); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "CreateMaintenanceRequestByAdmin"},
		})
	}

	_ = s.repo.CreateActivityLog(ctx, &models.MaintenanceRequestActivityLog{
		MaintenanceRequestID:    mr.ID.String(),
		Action:                  "CREATED",
		PerformedByClientUserID: &input.ClientUserID,
	})

	return mr, nil
}

// --- Get / List ---

func (s *maintenanceRequestService) GetMaintenanceRequest(
	ctx context.Context,
	query repository.GetMaintenanceRequestQuery,
) (*models.MaintenanceRequest, error) {
	mr, err := s.repo.GetOneWithPopulate(ctx, query)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, pkg.NotFoundError("maintenance request not found", nil)
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return mr, nil
}

func (s *maintenanceRequestService) ListMaintenanceRequests(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListMaintenanceRequestsFilter,
) ([]models.MaintenanceRequest, error) {
	mrs, err := s.repo.List(ctx, filterQuery, filters)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return *mrs, nil
}

func (s *maintenanceRequestService) CountMaintenanceRequests(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListMaintenanceRequestsFilter,
) (int64, error) {
	count, err := s.repo.Count(ctx, filterQuery, filters)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return count, nil
}

// --- Update ---

func (s *maintenanceRequestService) UpdateMaintenanceRequest(
	ctx context.Context,
	input UpdateMaintenanceRequestInput,
) (*models.MaintenanceRequest, error) {
	mr, err := s.repo.GetOneWithPopulate(ctx, repository.GetMaintenanceRequestQuery{ID: input.ID})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, pkg.NotFoundError("maintenance request not found", nil)
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	if input.Title != nil {
		mr.Title = *input.Title
	}
	if input.Desc != nil {
		mr.Description = *input.Desc
	}
	if input.Priority != nil {
		mr.Priority = *input.Priority
	}
	if input.Category != nil {
		mr.Category = *input.Category
	}
	if input.Attachments != nil {
		mr.Attachments = *input.Attachments
	}
	if input.Visibility != nil {
		mr.Visibility = *input.Visibility
	}

	if err := s.repo.Update(ctx, mr); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return mr, nil
}

// --- Assign ---

func (s *maintenanceRequestService) AssignWorker(ctx context.Context, input AssignMaintenanceWorkerInput) error {
	mr, err := s.repo.GetOneWithPopulate(ctx, repository.GetMaintenanceRequestQuery{ID: input.RequestID})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return pkg.NotFoundError("maintenance request not found", nil)
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	mr.AssignedWorkerID = &input.WorkerID

	if err := s.repo.Update(ctx, mr); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	_ = s.repo.CreateActivityLog(ctx, &models.MaintenanceRequestActivityLog{
		MaintenanceRequestID:    mr.ID.String(),
		Action:                  "WORKER_ASSIGNED",
		PerformedByClientUserID: &input.ActorID,
	})

	return nil
}

func (s *maintenanceRequestService) AssignManager(ctx context.Context, input AssignMaintenanceManagerInput) error {
	mr, err := s.repo.GetOneWithPopulate(ctx, repository.GetMaintenanceRequestQuery{ID: input.RequestID})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return pkg.NotFoundError("maintenance request not found", nil)
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	mr.AssignedManagerID = &input.ManagerID

	if err := s.repo.Update(ctx, mr); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	_ = s.repo.CreateActivityLog(ctx, &models.MaintenanceRequestActivityLog{
		MaintenanceRequestID:    mr.ID.String(),
		Action:                  "MANAGER_ASSIGNED",
		PerformedByClientUserID: &input.ActorID,
	})

	return nil
}

// --- Status transitions ---

func (s *maintenanceRequestService) UpdateStatus(ctx context.Context, input UpdateMaintenanceStatusInput) error {
	if input.NewStatus == "CANCELED" && (input.CancellationReason == nil || *input.CancellationReason == "") {
		return pkg.BadRequestError("cancellation_reason is required when canceling a request", nil)
	}

	mr, err := s.repo.GetOneWithPopulate(ctx, repository.GetMaintenanceRequestQuery{ID: input.RequestID})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return pkg.NotFoundError("maintenance request not found", nil)
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	oldStatus := mr.Status
	mr.Status = input.NewStatus

	now := time.Now()
	switch input.NewStatus {
	case "IN_PROGRESS":
		if mr.StartedAt == nil {
			mr.StartedAt = &now
		}
	case "IN_REVIEW":
		if mr.ReviewedAt == nil {
			mr.ReviewedAt = &now
		}
	case "RESOLVED":
		mr.ResolvedAt = &now
	case "CANCELED":
		mr.CanceledAt = &now
		mr.CancellationReason = input.CancellationReason
	default:
		// Moving back (e.g. RESOLVED → IN_PROGRESS): clear ResolvedAt
		mr.ResolvedAt = nil
	}

	if err := s.repo.Update(ctx, mr); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	// Build metadata with old/new status
	meta := map[string]string{"from": oldStatus, "to": input.NewStatus}
	metaBytes, _ := json.Marshal(meta)
	metaJSON := datatypes.JSON(metaBytes)

	logEntry := &models.MaintenanceRequestActivityLog{
		MaintenanceRequestID: mr.ID.String(),
		Action:               "STATUS_CHANGED",
		Metadata:             &metaJSON,
	}
	if input.ActorType == "TENANT" {
		logEntry.PerformedByTenantID = &input.ActorID
	} else {
		logEntry.PerformedByClientUserID = &input.ActorID
	}
	_ = s.repo.CreateActivityLog(ctx, logEntry)

	go s.fireStatusNotifications(context.Background(), mr, input.NewStatus)

	return nil
}

// fireStatusNotifications sends push notifications to relevant parties after a status change.
func (s *maintenanceRequestService) fireStatusNotifications(
	ctx context.Context,
	mr *models.MaintenanceRequest,
	newStatus string,
) {
	if mr.Visibility != "TENANT_VISIBLE" || mr.CreatedByTenantID == nil {
		return
	}

	tenantAccount, err := s.tenantAccountRepo.FindOne(ctx, map[string]any{
		"tenant_id": *mr.CreatedByTenantID,
	})
	if err != nil || tenantAccount == nil {
		log.WithError(err).WithField("tenantID", *mr.CreatedByTenantID).
			Warn("[MaintenanceRequest] could not resolve tenant account for notification")
		return
	}

	tenantAccountID := tenantAccount.ID.String()

	var title, body string
	switch newStatus {
	case "IN_PROGRESS":
		title = "Work has started"
		body = "Work has started on your maintenance request: " + mr.Title
	case "RESOLVED":
		title = "Request resolved"
		body = "Your maintenance request has been resolved: " + mr.Title
	case "CANCELED":
		title = "Request canceled"
		body = "Your maintenance request has been canceled: " + mr.Title
	default:
		return
	}

	if err := s.notificationService.SendToTenantAccount(ctx, tenantAccountID, title, body, map[string]string{
		"type":                   "MAINTENANCE_REQUEST_STATUS_CHANGED",
		"maintenance_request_id": mr.ID.String(),
		"status":                 newStatus,
	}); err != nil {
		log.WithError(err).WithField("tenantAccountID", tenantAccountID).
			Warn("[MaintenanceRequest] push notification failed")
	}
}

// --- Activity logs ---

func (s *maintenanceRequestService) ListActivityLogs(
	ctx context.Context,
	maintenanceRequestID string,
) ([]models.MaintenanceRequestActivityLog, error) {
	logs, err := s.repo.ListActivityLogs(ctx, maintenanceRequestID)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return *logs, nil
}

// --- Expenses ---

func (s *maintenanceRequestService) AddExpense(
	ctx context.Context,
	input AddMaintenanceExpenseInput,
) (*models.Expense, error) {
	// Ensure the request exists
	if _, err := s.repo.GetOneWithPopulate(ctx, repository.GetMaintenanceRequestQuery{ID: input.RequestID}); err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, pkg.NotFoundError("maintenance request not found", nil)
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	currency := input.Currency
	if currency == "" {
		currency = "GHS"
	}

	expense := &models.Expense{
		ContextType:                 "MAINTENANCE",
		ContextMaintenanceRequestID: &input.RequestID,
		Description:                 input.Description,
		Amount:                      input.Amount,
		Currency:                    currency,
		PaidBy:                      input.PaidBy,
		BillableToTenant:            input.BillableToTenant,
		CreatedByClientUserID:       input.ClientUserID,
	}

	if err := s.repo.CreateExpense(ctx, expense); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return expense, nil
}

func (s *maintenanceRequestService) ListExpenses(
	ctx context.Context,
	maintenanceRequestID string,
) ([]models.Expense, error) {
	expenses, err := s.repo.ListExpenses(ctx, maintenanceRequestID)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return *expenses, nil
}

func (s *maintenanceRequestService) DeleteExpense(ctx context.Context, expenseID string) error {
	if err := s.repo.DeleteExpense(ctx, expenseID); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return nil
}

// --- Invoice generation from expenses ---

func (s *maintenanceRequestService) GenerateExpenseInvoice(
	ctx context.Context,
	maintenanceRequestID string,
	actorClientID string,
) (*models.Invoice, error) {
	mr, err := s.repo.GetOneWithPopulate(ctx, repository.GetMaintenanceRequestQuery{
		ID:       maintenanceRequestID,
		Populate: &[]string{"Lease", "Lease.Tenant"},
	})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, pkg.NotFoundError("maintenance request not found", nil)
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	expenses, err := s.repo.GetUnbilledExpenses(ctx, maintenanceRequestID)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	if len(*expenses) == 0 {
		return nil, pkg.BadRequestError("no unbilled billable expenses found for this maintenance request", nil)
	}

	var lineItems []LineItemInput
	var totalAmount int64
	for _, exp := range *expenses {
		lineItems = append(lineItems, LineItemInput{
			Label:       exp.Description,
			Category:    "EXPENSE",
			Quantity:    1,
			UnitAmount:  exp.Amount,
			TotalAmount: exp.Amount,
			Currency:    exp.Currency,
		})
		totalAmount += exp.Amount
	}

	tenantID := ""
	if mr.CreatedByTenantID != nil {
		tenantID = *mr.CreatedByTenantID
	}

	mrID := mr.ID.String()
	invoice, err := s.invoiceService.CreateInvoice(ctx, CreateInvoiceInput{
		PayerType:                   "TENANT",
		PayerTenantID:               &tenantID,
		PayeeType:                   "PROPERTY_OWNER",
		PayeeClientID:               &actorClientID,
		ContextType:                 "MAINTENANCE",
		ContextMaintenanceRequestID: &mrID,
		TotalAmount:                 totalAmount,
		Currency:                    "GHS",
		LineItems:                   lineItems,
	})
	if err != nil {
		return nil, err
	}

	// Link each expense to the generated invoice
	invoiceID := invoice.ID.String()
	for i := range *expenses {
		exp := &(*expenses)[i]
		exp.InvoiceID = &invoiceID
		_ = s.repo.UpdateExpense(ctx, exp)
	}

	return invoice, nil
}
