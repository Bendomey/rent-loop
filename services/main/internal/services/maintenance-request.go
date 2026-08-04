package services

import (
	"context"
	"encoding/json"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/lib/emailtemplates"
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
	CreateByAdmin(ctx context.Context, input CreateMaintenanceRequestByAdminInput) ([]models.MaintenanceRequest, error)
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
	PropertyID             string
	UnitIDs                []string
	BlockIDs               []string
	CreateSeparateRequests bool
	ClientUserID           string
	Title                  string
	Desc                   string
	Priority               string
	Category               string
	Visibility             string
	Attachments            []string
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

// --- Create ---

func (s *maintenanceRequestService) CreateByTenant(
	ctx context.Context,
	input CreateMaintenanceRequestByTenantInput,
) (*models.MaintenanceRequest, error) {
	lease, err := s.leaseRepo.GetOneWithPopulate(ctx, repository.GetLeaseQuery{
		ID:       input.LeaseID,
		Populate: &[]string{"ActivatedBy", "ActivatedBy.User", "Unit", "Tenant"},
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
		PropertyID: lease.Unit.PropertyID,
		Assets: []models.MaintenanceRequestAsset{
			{AssetType: MaintenanceAssetTypeUnit, UnitID: &lease.UnitId},
		},
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
		if lease.ActivatedById == nil || lease.ActivatedBy == nil || lease.ActivatedBy.User.Email == "" {
			return
		}
		htmlBody, textBody, renderErr := s.appCtx.EmailEngine.Render(
			"maintenance/request-created",
			emailtemplates.MaintenanceRequestCreatedData{
				TenantName: lease.Tenant.FirstName,
				UnitName:   lease.Unit.Name,
				Title:      mr.Title,
				Category:   mr.Category,
				Priority:   mr.Priority,
			},
		)
		if renderErr != nil {
			log.WithError(renderErr).Error("failed to render maintenance-request-created email template")
			return
		}
		pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
			Recipient: lease.ActivatedBy.User.Email,
			Subject:   lib.PM_MAINTENANCE_REQUEST_CREATED_SUBJECT,
			HtmlBody:  htmlBody,
			TextBody:  textBody,
		})
	}()

	return mr, nil
}

func (s *maintenanceRequestService) CreateByAdmin(
	ctx context.Context,
	input CreateMaintenanceRequestByAdminInput,
) ([]models.MaintenanceRequest, error) {
	planned, err := PlanMaintenanceRequests(
		input.UnitIDs, input.BlockIDs, input.Visibility, input.CreateSeparateRequests,
	)
	if err != nil {
		return nil, err
	}

	// Validate the full selection once, before creating anything.
	for _, plan := range planned {
		if err := s.validateAssetsBelongToProperty(ctx, input.PropertyID, plan.Assets); err != nil {
			return nil, err
		}
	}

	created := make([]models.MaintenanceRequest, 0, len(planned))

	for _, plan := range planned {
		mr := &models.MaintenanceRequest{
			PropertyID:            input.PropertyID,
			CreatedByClientUserID: &input.ClientUserID,
			Title:                 input.Title,
			Description:           input.Desc,
			Priority:              input.Priority,
			Category:              input.Category,
			Attachments:           input.Attachments,
			Status:                "NEW",
			Visibility:            plan.Visibility,
			Assets:                buildAssetRows(plan.Assets),
			ActivityLogs: []models.MaintenanceRequestActivityLog{
				{
					Action:                  "CREATED",
					PerformedByClientUserID: &input.ClientUserID,
				},
			},
		}

		// Only a single-unit request has one lease to resolve and one tenant to
		// notify. Anything broader was already forced to INTERNAL_ONLY by the
		// planner, so there is nothing to resolve.
		if mr.Visibility == MaintenanceVisibilityTenantVisible {
			lease, leaseErr := s.leaseRepo.GetActiveLeaseByUnitID(ctx, plan.Assets[0].ID)
			switch {
			case leaseErr == gorm.ErrRecordNotFound:
				// No tenant to show it to, so keep it internal.
				mr.Visibility = MaintenanceVisibilityInternalOnly
			case leaseErr != nil:
				return nil, pkg.InternalServerError(leaseErr.Error(), &pkg.RentLoopErrorParams{
					Err: leaseErr,
					Metadata: map[string]string{
						"function": "CreateByAdmin",
						"action":   "fetching lease to resolve tenant and unit",
					},
				})
			default:
				leaseID := lease.ID.String()
				mr.LeaseID = &leaseID
				mr.CreatedByTenantID = &lease.TenantId
			}
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

		s.notifyTenantOfNewRequest(ctx, mr, input.Title)

		created = append(created, *mr)
	}

	return created, nil
}

// notifyTenantOfNewRequest pushes to the tenant when a request was created on
// their behalf. No-op unless the request resolved to a single tenant's lease.
func (s *maintenanceRequestService) notifyTenantOfNewRequest(
	ctx context.Context,
	mr *models.MaintenanceRequest,
	title string,
) {
	if mr.CreatedByTenantID == nil || mr.LeaseID == nil {
		return
	}

	tenantAccount, err := s.tenantAccountRepo.FindOne(ctx, map[string]any{
		"tenant_id": *mr.CreatedByTenantID,
	})
	if err != nil || tenantAccount == nil {
		log.WithError(err).WithField("tenantID", *mr.CreatedByTenantID).
			Warn("[MaintenanceRequest] could not resolve tenant account for notification")
		raven.CaptureError(err, map[string]string{
			"function":               "CreateByAdmin",
			"action":                 "resolving tenant account for notification",
			"tenant_id":              *mr.CreatedByTenantID,
			"maintenance_request_id": mr.ID.String(),
		})
		return
	}

	tenantAccountID := tenantAccount.ID.String()
	if err := s.notificationService.SendToTenantAccount(
		ctx,
		tenantAccountID,
		"New maintenance request",
		"A new maintenance request has been created on your behalf: "+title,
		map[string]string{
			"type":                   "MAINTENANCE",
			"maintenance_request_id": mr.ID.String(),
			"status":                 "NEW",
			"lease_id":               *mr.LeaseID,
		},
	); err != nil {
		log.WithError(err).WithField("tenantAccountID", tenantAccountID).
			Warn("[MaintenanceRequest] push notification failed")
		raven.CaptureError(err, map[string]string{
			"function":               "CreateByAdmin",
			"action":                 "sending push notification",
			"tenant_id":              *mr.CreatedByTenantID,
			"maintenance_request_id": mr.ID.String(),
		})
	}
}

// validateAssetsBelongToProperty rejects any unit or block that is not part of
// the property the request is being created under. Without this a caller could
// attach another client's unit to their own request.
func (s *maintenanceRequestService) validateAssetsBelongToProperty(
	ctx context.Context,
	propertyID string,
	assets []MaintenanceAssetRef,
) error {
	db := lib.ResolveDB(ctx, s.appCtx.DB).WithContext(ctx)

	for _, asset := range assets {
		var count int64
		var err error

		switch asset.Type {
		case MaintenanceAssetTypeUnit:
			err = db.Table("units").
				Where("id = ? AND property_id = ? AND deleted_at IS NULL", asset.ID, propertyID).
				Count(&count).Error
		case MaintenanceAssetTypeBlock:
			err = db.Table("property_blocks").
				Where("id = ? AND property_id = ? AND deleted_at IS NULL", asset.ID, propertyID).
				Count(&count).Error
		default:
			return pkg.BadRequestError("unknown asset type "+asset.Type, nil)
		}

		if err != nil {
			return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "validateAssetsBelongToProperty",
					"action":   "verifying asset belongs to property",
				},
			})
		}

		if count == 0 {
			return pkg.BadRequestError(
				asset.Type+" "+asset.ID+" does not belong to this property",
				nil,
			)
		}
	}

	return nil
}

// buildAssetRows converts planned asset references into model rows.
func buildAssetRows(assets []MaintenanceAssetRef) []models.MaintenanceRequestAsset {
	rows := make([]models.MaintenanceRequestAsset, 0, len(assets))
	for _, asset := range assets {
		id := asset.ID
		row := models.MaintenanceRequestAsset{AssetType: asset.Type}
		if asset.Type == MaintenanceAssetTypeUnit {
			row.UnitID = &id
		} else {
			row.PropertyBlockID = &id
		}
		rows = append(rows, row)
	}
	return rows
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

func (s *maintenanceRequestService) GetMaintenanceRequestStats(
	ctx context.Context,
	filters repository.ListMaintenanceRequestsFilter,
) (map[string]int64, error) {
	return s.repo.CountByStatus(ctx, filters)
}
