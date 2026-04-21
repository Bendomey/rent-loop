package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/lib/emailtemplates"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/lib/pq"
	log "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type LeaseChecklistService interface {
	CreateLeaseChecklist(ctx context.Context, input CreateLeaseChecklistInput) (*models.LeaseChecklist, error)
	GetOneLeaseChecklist(ctx context.Context, query repository.GetLeaseCheckListQuery) (*models.LeaseChecklist, error)
	UpdateLeaseChecklist(ctx context.Context, input UpdateLeaseChecklistInput) (*models.LeaseChecklist, error)
	DeleteLeaseChecklist(ctx context.Context, query repository.DeleteLeaseChecklistQuery) error
	ListLeaseChecklists(
		ctx context.Context,
		filters repository.ListLeaseChecklistsFilter,
	) (*[]models.LeaseChecklist, error)
	CountLeaseChecklists(ctx context.Context, filters repository.ListLeaseChecklistsFilter) (int64, error)
	SubmitLeaseChecklist(ctx context.Context, leaseID, checklistID string) (*models.LeaseChecklist, error)
	AcknowledgeLeaseChecklist(ctx context.Context, input AcknowledgeLeaseChecklistInput) (*models.LeaseChecklist, error)
	GetChecklistComparison(ctx context.Context, leaseID, checkoutChecklistID string) (*ChecklistComparisonResult, error)
}

type leaseChecklistService struct {
	appCtx               pkg.AppContext
	repo                 repository.LeaseChecklistRepository
	checklistItemService LeaseChecklistItemService
	acknowledgmentRepo   repository.LeaseChecklistAcknowledgmentRepository
	templateRepo         repository.ChecklistTemplateRepository
	leaseRepo            repository.LeaseRepository
	tenantAccountRepo    repository.TenantAccountRepository
	notificationService  NotificationService
}

type LeaseChecklistServiceDeps struct {
	AppCtx               pkg.AppContext
	Repo                 repository.LeaseChecklistRepository
	ChecklistItemService LeaseChecklistItemService
	AcknowledgmentRepo   repository.LeaseChecklistAcknowledgmentRepository
	TemplateRepo         repository.ChecklistTemplateRepository
	LeaseRepo            repository.LeaseRepository
	TenantAccountRepo    repository.TenantAccountRepository
	NotificationService  NotificationService
}

func NewLeaseChecklistService(deps LeaseChecklistServiceDeps) LeaseChecklistService {
	return &leaseChecklistService{
		appCtx:               deps.AppCtx,
		repo:                 deps.Repo,
		checklistItemService: deps.ChecklistItemService,
		acknowledgmentRepo:   deps.AcknowledgmentRepo,
		templateRepo:         deps.TemplateRepo,
		leaseRepo:            deps.LeaseRepo,
		tenantAccountRepo:    deps.TenantAccountRepo,
		notificationService:  deps.NotificationService,
	}
}

type CreateLeaseChecklistInput struct {
	LeaseId        string
	Type           string
	TemplateId     *string
	CreatedById    string
	ChecklistItems []CreateLeaseChecklistItemInput
}

func (s *leaseChecklistService) CreateLeaseChecklist(
	ctx context.Context,
	input CreateLeaseChecklistInput,
) (*models.LeaseChecklist, error) {
	leaseChecklist := models.LeaseChecklist{
		LeaseId:     input.LeaseId,
		Type:        input.Type,
		CreatedById: input.CreatedById,
		Status:      "DRAFT",
		Round:       1,
	}

	// For CHECK_OUT: link to existing CHECK_IN checklist and copy its items
	if input.Type == "CHECK_OUT" {
		checkIn, err := s.repo.GetCheckInChecklist(ctx, input.LeaseId)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
		}
		if checkIn != nil {
			checkInID := checkIn.ID.String()
			leaseChecklist.CheckInChecklistId = &checkInID
			// Pre-fill items from CHECK_IN if caller didn't provide items
			if len(input.ChecklistItems) == 0 {
				for _, item := range checkIn.Items {
					input.ChecklistItems = append(input.ChecklistItems, CreateLeaseChecklistItemInput{
						Description: item.Description,
						Status:      item.Status,
						Notes:       nil,
						Photos:      []string{},
					})
				}
			}
		}
	}

	// Template resolution (only for CHECK_IN)
	if input.Type == "CHECK_IN" && len(input.ChecklistItems) == 0 {
		var tmpl *models.ChecklistTemplate

		if input.TemplateId != nil {
			t, err := s.templateRepo.GetByID(ctx, *input.TemplateId)
			if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
			}
			tmpl = t
		} else {
			// Auto-lookup by unit type
			lease, err := s.leaseRepo.GetOneWithPopulate(ctx, repository.GetLeaseQuery{
				ID:       input.LeaseId,
				Populate: &[]string{"Unit"},
			})
			if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
			}
			if lease != nil {
				t, err := s.templateRepo.GetByUnitType(ctx, lease.Unit.Type)
				if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
					return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
				}
				tmpl = t
			}
		}

		if tmpl != nil {
			for _, item := range tmpl.Items {
				input.ChecklistItems = append(input.ChecklistItems, CreateLeaseChecklistItemInput{
					Description: fmt.Sprintf("%s - %s", item.Category, item.Description),
					Status:      "PENDING",
					Notes:       nil,
					Photos:      []string{},
				})
			}
		}
	}

	if len(input.ChecklistItems) > 0 {
		checklistItems := make([]models.LeaseChecklistItem, 0, len(input.ChecklistItems))
		for _, item := range input.ChecklistItems {
			checklistItems = append(checklistItems, models.LeaseChecklistItem{
				Description: item.Description,
				Status:      item.Status,
				Notes:       item.Notes,
				Photos:      pq.StringArray(item.Photos),
			})
		}

		leaseChecklist.Items = checklistItems
	}

	err := s.repo.Create(ctx, &leaseChecklist)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateLeaseChecklist",
				"action":   "creating lease checklist",
			},
		})
	}

	return &leaseChecklist, nil
}

func (s *leaseChecklistService) GetOneLeaseChecklist(
	ctx context.Context,
	query repository.GetLeaseCheckListQuery,
) (*models.LeaseChecklist, error) {
	leaseChecklist, err := s.repo.GetOneWithPopulate(ctx, query)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseChecklistNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetOneLeaseChecklist",
				"action":   "fetching lease checklist",
			},
		})
	}

	return leaseChecklist, nil
}

type UpdateLeaseChecklistInput struct {
	LeaseChecklistID string
	LeaseID          string
	Type             *string
}

func (s *leaseChecklistService) UpdateLeaseChecklist(
	ctx context.Context,
	input UpdateLeaseChecklistInput,
) (*models.LeaseChecklist, error) {
	leaseChecklist, err := s.repo.GetOneWithPopulate(ctx, repository.GetLeaseCheckListQuery{
		ID:      input.LeaseChecklistID,
		LeaseID: input.LeaseID,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseChecklistNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "UpdateLeaseChecklist",
				"action":   "fetching lease checklist",
			},
		})
	}

	if leaseChecklist.Status != "DRAFT" && leaseChecklist.Status != "DISPUTED" {
		return nil, pkg.BadRequestError("ChecklistNotEditable", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{"status": leaseChecklist.Status},
		})
	}

	if input.Type != nil {
		leaseChecklist.Type = *input.Type
	}

	updateErr := s.repo.Update(ctx, leaseChecklist)
	if updateErr != nil {
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateErr,
			Metadata: map[string]string{
				"function": "UpdateLeaseChecklist",
				"action":   "updating lease checklist",
			},
		})
	}

	return leaseChecklist, nil
}

func (s *leaseChecklistService) DeleteLeaseChecklist(
	ctx context.Context,
	query repository.DeleteLeaseChecklistQuery,
) error {
	checklist, err := s.repo.GetOneWithPopulate(ctx, repository.GetLeaseCheckListQuery{
		ID:      query.LeaseChecklistID,
		LeaseID: query.LeaseID,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("LeaseChecklistNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "DeleteLeaseChecklist",
				"action":   "fetching lease checklist",
			},
		})
	}

	if checklist.Status != "DRAFT" && checklist.Status != "DISPUTED" {
		return pkg.BadRequestError("ChecklistNotEditable", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{"status": checklist.Status},
		})
	}

	err = s.repo.Delete(ctx, query)
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "DeleteLeaseChecklist",
				"action":   "deleting lease checklist",
			},
		})
	}

	return nil
}

func (s *leaseChecklistService) ListLeaseChecklists(
	ctx context.Context,
	filters repository.ListLeaseChecklistsFilter,
) (*[]models.LeaseChecklist, error) {
	leaseChecklists, err := s.repo.List(ctx, filters)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListLeaseChecklists",
				"action":   "listing lease checklists",
			},
		})
	}

	return leaseChecklists, nil
}

func (s *leaseChecklistService) CountLeaseChecklists(
	ctx context.Context,
	filters repository.ListLeaseChecklistsFilter,
) (int64, error) {
	count, err := s.repo.Count(ctx, filters)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountLeaseChecklists",
				"action":   "counting lease checklists",
			},
		})
	}

	return count, nil
}

// SubmitLeaseChecklist transitions a DRAFT or DISPUTED checklist to SUBMITTED
// and sends a push notification to the tenant.
func (s *leaseChecklistService) SubmitLeaseChecklist(
	ctx context.Context,
	leaseID, checklistID string,
) (*models.LeaseChecklist, error) {
	checklist, err := s.repo.GetOneWithPopulate(ctx, repository.GetLeaseCheckListQuery{
		ID:       checklistID,
		LeaseID:  leaseID,
		Populate: &[]string{"Items"},
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseChecklistNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	if checklist.Status != "DRAFT" && checklist.Status != "DISPUTED" {
		return nil, pkg.BadRequestError("ChecklistCannotBeSubmitted", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{"status": checklist.Status},
		})
	}

	// Ensure all items have been reviewed (no PENDING status)
	for _, item := range checklist.Items {
		if item.Status == "PENDING" {
			return nil, pkg.BadRequestError("ChecklistItemsNotFilled", &pkg.RentLoopErrorParams{
				Metadata: map[string]string{"item_id": item.ID.String()},
			})
		}
	}

	// Link CHECK_OUT to CHECK_IN if not already linked
	if checklist.Type == "CHECK_OUT" && checklist.CheckInChecklistId == nil {
		checkIn, checkInErr := s.repo.GetCheckInChecklist(ctx, leaseID)
		if checkInErr == nil && checkIn != nil {
			checkInID := checkIn.ID.String()
			checklist.CheckInChecklistId = &checkInID
		}
	}

	// Increment round on re-submit from DISPUTED
	if checklist.Status == "DISPUTED" {
		checklist.Round++
	}

	now := time.Now()
	checklist.Status = "SUBMITTED"
	checklist.SubmittedAt = &now

	if err := s.repo.Update(ctx, checklist); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "SubmitLeaseChecklist",
				"action":   "updating checklist status",
			},
		})
	}

	// Send push notification to tenant (fire-and-forget)
	go func() {
		lease, leaseErr := s.leaseRepo.GetOneWithPopulate(context.Background(), repository.GetLeaseQuery{
			ID:       leaseID,
			Populate: &[]string{"Tenant"},
		})
		if leaseErr != nil {
			return
		}

		tenantAccount, taErr := s.tenantAccountRepo.FindOne(context.Background(), map[string]any{
			"tenant_id": lease.TenantId,
		})
		if taErr != nil {
			return
		}

		_ = s.notificationService.SendToTenantAccount(
			context.Background(),
			tenantAccount.ID.String(),
			"Report submitted for review",
			fmt.Sprintf(
				"Your landlord has submitted a %s report for your review. Please review and respond.",
				lib.LeaseChecklistTypeLabel(checklist.Type),
			),
			map[string]string{
				"type":           "CHECKLIST_SUBMITTED",
				"checklist_id":   checklistID,
				"lease_id":       leaseID,
				"checklist_type": checklist.Type,
			},
		)
	}()

	return checklist, nil
}

type AcknowledgeLeaseChecklistInput struct {
	LeaseID         string
	ChecklistID     string
	TenantAccountID string
	Action          string // ACKNOWLEDGED or DISPUTED
	Comment         *string
}

// AcknowledgeLeaseChecklist records a tenant's acknowledgment or dispute of a SUBMITTED checklist.
func (s *leaseChecklistService) AcknowledgeLeaseChecklist(
	ctx context.Context,
	input AcknowledgeLeaseChecklistInput,
) (*models.LeaseChecklist, error) {
	checklist, err := s.repo.GetOneWithPopulate(ctx, repository.GetLeaseCheckListQuery{
		ID:       input.ChecklistID,
		LeaseID:  input.LeaseID,
		Populate: &[]string{"CreatedBy", "CreatedBy.User"},
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseChecklistNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	if checklist.Status != "SUBMITTED" {
		return nil, pkg.BadRequestError("ChecklistNotSubmitted", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{"status": checklist.Status},
		})
	}

	// Check if tenant already responded in this round
	existing, existErr := s.acknowledgmentRepo.GetByChecklistTenantAndRound(
		ctx,
		input.ChecklistID,
		input.TenantAccountID,
		checklist.Round,
	)
	if existErr != nil && !errors.Is(existErr, gorm.ErrRecordNotFound) {
		return nil, pkg.InternalServerError(existErr.Error(), &pkg.RentLoopErrorParams{Err: existErr})
	}
	if existing != nil {
		return nil, pkg.ConflictError("AlreadyAcknowledgedThisRound", nil)
	}

	submittedAt := time.Now()
	if checklist.SubmittedAt != nil {
		submittedAt = *checklist.SubmittedAt
	}

	ack := &models.LeaseChecklistAcknowledgment{
		LeaseChecklistId: input.ChecklistID,
		TenantAccountId:  input.TenantAccountID,
		Round:            checklist.Round,
		SubmittedAt:      submittedAt,
		Action:           input.Action,
		Comment:          input.Comment,
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	if err := s.acknowledgmentRepo.Create(transCtx, ack); err != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "AcknowledgeLeaseChecklist",
				"action":   "creating acknowledgment",
			},
		})
	}

	checklist.Status = input.Action // ACKNOWLEDGED or DISPUTED
	if err := s.repo.Update(transCtx, checklist); err != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "AcknowledgeLeaseChecklist",
				"action":   "updating checklist status",
			},
		})
	}

	if err := transaction.Commit().Error; err != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "AcknowledgeLeaseChecklist",
				"action":   "committing transaction",
			},
		})
	}

	go func() {
		if checklist.CreatedBy.User.Email == "" {
			return
		}
		bgCtx := context.Background()
		lease, leaseErr := s.leaseRepo.GetOneWithPopulate(bgCtx, repository.GetLeaseQuery{
			ID:       input.LeaseID,
			Populate: &[]string{"Unit", "Tenant"},
		})
		if leaseErr != nil {
			return
		}
		htmlBody, textBody, renderErr := s.appCtx.EmailEngine.Render(
			"payment/checklist-acknowledged",
			emailtemplates.ChecklistAcknowledgedData{
				TenantName:    lease.Tenant.FirstName,
				UnitName:      lease.Unit.Name,
				ChecklistType: checklist.Type,
				Action:        input.Action,
			},
		)
		if renderErr != nil {
			log.WithError(renderErr).Error("failed to render checklist-acknowledged email template")
			return
		}
		pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
			Recipient: checklist.CreatedBy.User.Email,
			Subject:   lib.PM_CHECKLIST_ACKNOWLEDGED_SUBJECT,
			HtmlBody:  htmlBody,
			TextBody:  textBody,
		})
	}()

	return checklist, nil
}

type ChecklistComparisonResult struct {
	CheckInChecklist  *models.LeaseChecklist
	CheckOutChecklist *models.LeaseChecklist
}

// GetChecklistComparison returns both CHECK_IN and CHECK_OUT checklists for side-by-side comparison.
func (s *leaseChecklistService) GetChecklistComparison(
	ctx context.Context,
	leaseID, checkoutChecklistID string,
) (*ChecklistComparisonResult, error) {
	checkOut, err := s.repo.GetOneWithPopulate(ctx, repository.GetLeaseCheckListQuery{
		ID:       checkoutChecklistID,
		LeaseID:  leaseID,
		Populate: &[]string{"Items"},
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseChecklistNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	var checkIn *models.LeaseChecklist

	if checkOut.CheckInChecklistId != nil {
		ci, err := s.repo.GetOneWithPopulate(ctx, repository.GetLeaseCheckListQuery{
			ID:       *checkOut.CheckInChecklistId,
			LeaseID:  leaseID,
			Populate: &[]string{"Items"},
		})
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
		}
		checkIn = ci
	} else {
		ci, err := s.repo.GetCheckInChecklist(ctx, leaseID)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
		}
		checkIn = ci
	}

	return &ChecklistComparisonResult{
		CheckInChecklist:  checkIn,
		CheckOutChecklist: checkOut,
	}, nil
}
