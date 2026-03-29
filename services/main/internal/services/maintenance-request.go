package services

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/getsentry/raven-go"
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
	ListActivityLogs(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListMaintenanceRequestActivityLogsFilter,
	) ([]models.MaintenanceRequestActivityLog, error)
	CountActivityLogs(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListMaintenanceRequestActivityLogsFilter,
	) (int64, error)
	AddExpense(ctx context.Context, input AddMaintenanceExpenseInput) (*models.Expense, error)
	ListExpenses(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListMaintenanceExpensesFilter,
	) ([]models.Expense, error)
	CountExpenses(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListMaintenanceExpensesFilter,
	) (int64, error)
	DeleteExpense(ctx context.Context, expenseID string) error
	CreateComment(ctx context.Context, input CreateMaintenanceCommentInput) (*models.MaintenanceRequestComment, error)
	ListComments(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListMaintenanceRequestCommentsFilter,
	) ([]models.MaintenanceRequestComment, error)
	CountComments(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListMaintenanceRequestCommentsFilter,
	) (int64, error)
	UpdateComment(ctx context.Context, input UpdateMaintenanceCommentInput) (*models.MaintenanceRequestComment, error)
	DeleteComment(ctx context.Context, id string) error
	GenerateExpenseInvoice(
		ctx context.Context,
		input GenerateExpenseInvoiceInput,
	) ([]models.Invoice, error)
	GetMaintenanceRequestStats(
		ctx context.Context,
		filters repository.ListMaintenanceRequestsFilter,
	) (map[string]int64, error)
}

type maintenanceRequestService struct {
	appCtx              pkg.AppContext
	repo                repository.MaintenanceRequestRepository
	leaseRepo           repository.LeaseRepository
	tenantAccountRepo   repository.TenantAccountRepository
	notificationService NotificationService
	invoiceService      InvoiceService
}

type MaintenanceRequestServiceDeps struct {
	AppCtx              pkg.AppContext
	Repo                repository.MaintenanceRequestRepository
	LeaseRepo           repository.LeaseRepository
	TenantAccountRepo   repository.TenantAccountRepository
	NotificationService NotificationService
	InvoiceService      InvoiceService
}

func NewMaintenanceRequestService(deps MaintenanceRequestServiceDeps) MaintenanceRequestService {
	return &maintenanceRequestService{
		appCtx:              deps.AppCtx,
		repo:                deps.Repo,
		leaseRepo:           deps.LeaseRepo,
		tenantAccountRepo:   deps.TenantAccountRepo,
		notificationService: deps.NotificationService,
		invoiceService:      deps.InvoiceService,
	}
}

// --- Input types ---

type CreateMaintenanceRequestByTenantInput struct {
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
	ClientUserID string
	Title        string
	Desc         string
	Priority     string
	Category     string
	Visibility   string
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

type CreateMaintenanceCommentInput struct {
	RequestID    string
	Content      string
	ClientUserID string
}

type UpdateMaintenanceCommentInput struct {
	ID      string
	Content string
}

type AddMaintenanceExpenseInput struct {
	RequestID    string
	Description  string
	Amount       int64
	Currency     string
	ClientUserID string
}

// --- Create ---

func (s *maintenanceRequestService) CreateByTenant(
	ctx context.Context,
	input CreateMaintenanceRequestByTenantInput,
) (*models.MaintenanceRequest, error) {
	lease, err := s.leaseRepo.GetOneWithPopulate(ctx, repository.GetLeaseQuery{
		ID:       input.LeaseID,
		Populate: &[]string{"ActivatedBy", "Unit", "Tenant"},
	})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, pkg.NotFoundError("lease not found", nil)
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateByTenant",
				"action":   "fetching lease to resolve tenant and unit",
			},
		})
	}

	mr := &models.MaintenanceRequest{
		UnitID:            lease.UnitId,
		LeaseID:           &input.LeaseID,
		CreatedByTenantID: &input.TenantID,
		Title:             input.Title,
		Description:       input.Desc,
		Priority:          input.Priority,
		Category:          input.Category,
		Attachments:       input.Attachments,
		Status:            "NEW",
		Visibility:        "TENANT_VISIBLE",
		ActivityLogs: []models.MaintenanceRequestActivityLog{
			{
				Action:              "CREATED",
				PerformedByTenantID: &input.TenantID,
			},
		},
	}

	if err := s.repo.Create(ctx, mr); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateByTenant",
				"action":   "creating maintenance request",
			},
		})
	}

	go func() {
		if lease.ActivatedById == nil || lease.ActivatedBy == nil || lease.ActivatedBy.Email == "" {
			return
		}
		message := strings.NewReplacer(
			"{{tenant_name}}", lease.Tenant.FirstName,
			"{{unit_name}}", lease.Unit.Name,
			"{{title}}", mr.Title,
			"{{category}}", mr.Category,
			"{{priority}}", mr.Priority,
		).Replace(lib.ApplyGlobalVariableTemplate(s.appCtx.Config, lib.PM_MAINTENANCE_REQUEST_CREATED_BODY))
		pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
			Recipient: lease.ActivatedBy.Email,
			Subject:   lib.PM_MAINTENANCE_REQUEST_CREATED_SUBJECT,
			TextBody:  message,
		})
	}()

	return mr, nil
}

func (s *maintenanceRequestService) CreateByAdmin(
	ctx context.Context,
	input CreateMaintenanceRequestByAdminInput,
) (*models.MaintenanceRequest, error) {
	var createdByTenantID *string = nil
	unitID := input.UnitID

	var leaseID *string = nil

	if input.Visibility == "TENANT_VISIBLE" {
		// try to find an active lease connected to unitId
		lease, err := s.leaseRepo.GetActiveLeaseByUnitID(ctx, input.UnitID)
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				// if there is no lease, then we should allow only internal admins to see it.
				input.Visibility = "INTERNAL_ONLY"
			}
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "CreateByAdmin",
					"action":   "fetching lease to resolve tenant and unit",
				},
			})
		} else {
			leaseIDString := lease.ID.String()
			leaseID = &leaseIDString
			createdByTenantID = &lease.TenantId
		}

	}

	mr := &models.MaintenanceRequest{
		UnitID:                unitID,
		LeaseID:               leaseID,
		CreatedByClientUserID: &input.ClientUserID,
		CreatedByTenantID:     createdByTenantID,
		Title:                 input.Title,
		Description:           input.Desc,
		Priority:              input.Priority,
		Category:              input.Category,
		Attachments:           input.Attachments,
		Status:                "NEW",
		Visibility:            input.Visibility,
		ActivityLogs: []models.MaintenanceRequestActivityLog{
			{
				Action:                  "CREATED",
				PerformedByClientUserID: &input.ClientUserID,
			},
		},
	}

	if err := s.repo.Create(ctx, mr); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateByAdmin",
				"action":   "creating maintenance request",
			},
		})
	}

	// lets send push notification to tenant that an MR was created on their behalf
	if createdByTenantID != nil && mr.LeaseID != nil {
		tenantAccount, err := s.tenantAccountRepo.FindOne(ctx, map[string]any{
			"tenant_id": *createdByTenantID,
		})

		if err != nil || tenantAccount == nil {
			log.WithError(err).WithField("tenantID", *createdByTenantID).
				Warn("[MaintenanceRequest] could not resolve tenant account for notification")
			raven.CaptureError(err, map[string]string{
				"function":               "CreateByAdmin",
				"action":                 "resolving tenant account for notification",
				"tenant_id":              *createdByTenantID,
				"maintenance_request_id": mr.ID.String(),
			})
		} else {
			tenantAccountID := tenantAccount.ID.String()
			if err := s.notificationService.SendToTenantAccount(ctx, tenantAccountID, "New maintenance request", "A new maintenance request has been created on your behalf: "+input.Title, map[string]string{
				"type":                   "MAINTENANCE",
				"maintenance_request_id": mr.ID.String(),
				"status":                 "NEW",
				"lease_id":               *mr.LeaseID,
			}); err != nil {
				log.WithError(err).WithField("tenantAccountID", tenantAccountID).
					Warn("[MaintenanceRequest] push notification failed")
				raven.CaptureError(err, map[string]string{
					"function":               "CreateByAdmin",
					"action":                 "sending push notification",
					"tenant_id":              *createdByTenantID,
					"maintenance_request_id": mr.ID.String(),
				})
			}
		}
	}

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
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetMaintenanceRequest",
				"action":   "fetching maintenance request",
			},
		})
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
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListMaintenanceRequests",
				"action":   "listing maintenance requests",
			},
		})
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
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountMaintenanceRequests",
				"action":   "counting maintenance requests",
			},
		})
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
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "UpdateMaintenanceRequest",
				"action":   "fetching maintenance request",
			},
		})
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
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "UpdateMaintenanceRequest",
				"action":   "updating maintenance request",
			},
		})
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
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "AssignWorker",
				"action":   "fetching maintenance request",
			},
		})
	}

	mr.AssignedWorkerID = &input.WorkerID

	if err := s.repo.Update(ctx, mr); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "AssignWorker",
				"action":   "updating maintenance request",
			},
		})
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
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "AssignManager",
				"action":   "fetching maintenance request",
			},
		})
	}

	mr.AssignedManagerID = &input.ManagerID

	if err := s.repo.Update(ctx, mr); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "AssignManager",
				"action":   "updating maintenance request",
			},
		})
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
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "UpdateStatus",
				"action":   "fetching maintenance request",
			},
		})
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
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "UpdateStatus",
				"action":   "updating maintenance request status",
			},
		})
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
	if mr.Visibility != "TENANT_VISIBLE" || mr.CreatedByTenantID == nil || mr.LeaseID == nil {
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
		"type":                   "MAINTENANCE",
		"maintenance_request_id": mr.ID.String(),
		"status":                 newStatus,
		"lease_id":               *mr.LeaseID,
	}); err != nil {
		log.WithError(err).WithField("tenantAccountID", tenantAccountID).
			Warn("[MaintenanceRequest] push notification failed")
	}
}

// --- Activity logs ---

func (s *maintenanceRequestService) ListActivityLogs(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListMaintenanceRequestActivityLogsFilter,
) ([]models.MaintenanceRequestActivityLog, error) {
	logs, err := s.repo.ListActivityLogs(ctx, filterQuery, filters)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListActivityLogs",
				"action":   "listing activity logs",
			},
		})
	}
	return *logs, nil
}

func (s *maintenanceRequestService) CountActivityLogs(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListMaintenanceRequestActivityLogsFilter,
) (int64, error) {
	count, err := s.repo.CountActivityLogs(ctx, filterQuery, filters)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountActivityLogs",
				"action":   "counting activity logs",
			},
		})
	}
	return count, nil
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
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "AddExpense",
				"action":   "fetching maintenance request",
			},
		})
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
		CreatedByClientUserID:       input.ClientUserID,
	}

	if err := s.repo.CreateExpense(ctx, expense); err != nil {
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

func (s *maintenanceRequestService) ListExpenses(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListMaintenanceExpensesFilter,
) ([]models.Expense, error) {
	expenses, err := s.repo.ListExpenses(ctx, filterQuery, filters)
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

func (s *maintenanceRequestService) CountExpenses(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListMaintenanceExpensesFilter,
) (int64, error) {
	count, err := s.repo.CountExpenses(ctx, filterQuery, filters)
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

func (s *maintenanceRequestService) DeleteExpense(ctx context.Context, expenseID string) error {
	if err := s.repo.DeleteExpense(ctx, expenseID); err != nil {
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

// --- Comments ---

func (s *maintenanceRequestService) CreateComment(
	ctx context.Context,
	input CreateMaintenanceCommentInput,
) (*models.MaintenanceRequestComment, error) {
	if _, err := s.repo.GetOneWithPopulate(ctx, repository.GetMaintenanceRequestQuery{ID: input.RequestID}); err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, pkg.NotFoundError("maintenance request not found", nil)
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateComment",
				"action":   "fetching maintenance request",
			},
		})
	}

	comment := &models.MaintenanceRequestComment{
		MaintenanceRequestID:  input.RequestID,
		Content:               input.Content,
		CreatedByClientUserID: input.ClientUserID,
	}

	if err := s.repo.CreateComment(ctx, comment); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateComment",
				"action":   "creating comment",
			},
		})
	}
	return comment, nil
}

func (s *maintenanceRequestService) ListComments(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListMaintenanceRequestCommentsFilter,
) ([]models.MaintenanceRequestComment, error) {
	comments, err := s.repo.ListComments(ctx, filterQuery, filters)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListComments",
				"action":   "listing comments",
			},
		})
	}
	return *comments, nil
}

func (s *maintenanceRequestService) CountComments(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListMaintenanceRequestCommentsFilter,
) (int64, error) {
	count, err := s.repo.CountComments(ctx, filterQuery, filters)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountComments",
				"action":   "counting comments",
			},
		})
	}
	return count, nil
}

func (s *maintenanceRequestService) UpdateComment(
	ctx context.Context,
	input UpdateMaintenanceCommentInput,
) (*models.MaintenanceRequestComment, error) {
	comment, err := s.repo.GetComment(ctx, input.ID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, pkg.NotFoundError("comment not found", nil)
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "UpdateComment",
				"action":   "fetching comment",
			},
		})
	}

	comment.Content = input.Content

	if err := s.repo.UpdateComment(ctx, comment); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "UpdateComment",
				"action":   "updating comment",
			},
		})
	}
	return comment, nil
}

func (s *maintenanceRequestService) DeleteComment(ctx context.Context, id string) error {
	if err := s.repo.DeleteComment(ctx, id); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "DeleteComment",
				"action":   "deleting comment",
			},
		})
	}
	return nil
}

// --- Invoice generation from expenses ---

type GenerateExpenseInvoicePayerInput struct {
	Amount    int64
	PayeeType string // "TENANT" | "PROPERTY_OWNER" | "EXTERNAL"
	PayerType string // "TENANT" | "PROPERTY_OWNER" | "EXTERNAL"
}

type GenerateExpenseInvoiceInput struct {
	MaintenanceRequestID string
	ExpenseID            string
	ClientID             string
	Payers               []GenerateExpenseInvoicePayerInput
}

func (s *maintenanceRequestService) GenerateExpenseInvoice(
	ctx context.Context,
	input GenerateExpenseInvoiceInput,
) ([]models.Invoice, error) {
	if len(input.Payers) == 0 {
		return nil, pkg.BadRequestError("at least one payer is required to generate an invoice", nil)
	}

	mr, err := s.repo.GetOneWithPopulate(ctx, repository.GetMaintenanceRequestQuery{
		ID:       input.MaintenanceRequestID,
		Populate: &[]string{"Lease", "Lease.Tenant", "Unit", "Expenses"},
	})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, pkg.NotFoundError("maintenance request not found", nil)
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GenerateExpenseInvoice",
				"action":   "fetching maintenance request",
			},
		})
	}

	// find expense to be invoiced
	var expense *models.Expense
	for _, exp := range mr.Expenses {
		if exp.ID.String() == input.ExpenseID {
			expense = &exp
			break
		}
	}

	if expense == nil {
		return nil, pkg.NotFoundError("expense not found for this maintenance request", nil)
	}

	// make sure full amount is covered by payers
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
		Metadata: &map[string]any{
			"mr": mr.ID.String(),
		},
	}

	// Single transaction: invoice creation + expense linking are fully atomic
	tx := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, tx)

	var invoices []models.Invoice

	for _, payer := range input.Payers {

		if payer.PayeeType != "TENANT" && payer.PayeeType != "PROPERTY_OWNER" {
			return nil, pkg.BadRequestError("invalid payee type: "+payer.PayeeType, nil)
		}

		createInvoiceInput := CreateInvoiceInput{
			ClientID:         &input.ClientID,
			PropertyID:       &mr.Unit.PropertyID,
			PayerType:        payer.PayerType,
			PayeeType:        payer.PayeeType,
			ContextType:      "MAINTENANCE_EXPENSE",
			ContextExpenseID: &input.ExpenseID,
			TotalAmount:      payer.Amount,
			SubTotal:         payer.Amount,
			Currency:         expense.Currency,
			LineItems:        []LineItemInput{lineItem},
			Status:           "ISSUED",
		}

		if payer.PayeeType == "TENANT" || payer.PayerType == "TENANT" {
			var tenantID string

			// Resolve payer tenant: prefer preloaded Lease.Tenant, fall back to CreatedByTenantID.
			// Reject invoice generation when no tenant can be resolved.
			if mr.Lease != nil && mr.Lease.TenantId != "" {
				tenantID = mr.Lease.TenantId
			} else if mr.CreatedByTenantID != nil {
				tenantID = *mr.CreatedByTenantID
			} else {
				return nil, pkg.BadRequestError(
					"cannot generate invoice: no tenant associated with this maintenance request",
					nil,
				)
			}

			if createInvoiceInput.PayerType == "TENANT" && tenantID != "" {
				createInvoiceInput.PayerTenantID = &tenantID
			}
			if createInvoiceInput.PayeeType == "TENANT" && tenantID != "" {
				createInvoiceInput.PayeeTenantID = &tenantID
			}

		}

		if createInvoiceInput.PayerType == "PROPERTY_OWNER" {
			createInvoiceInput.PayerClientID = &input.ClientID
		}

		if createInvoiceInput.PayeeType == "PROPERTY_OWNER" {
			createInvoiceInput.PayeeClientID = &input.ClientID
		}

		invoice, err := s.invoiceService.CreateInvoice(transCtx, createInvoiceInput)
		if err != nil {
			tx.Rollback()
			return nil, err
		}

		invoices = append(invoices, *invoice)
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

func (s *maintenanceRequestService) GetMaintenanceRequestStats(
	ctx context.Context,
	filters repository.ListMaintenanceRequestsFilter,
) (map[string]int64, error) {
	return s.repo.CountByStatus(ctx, filters)
}
