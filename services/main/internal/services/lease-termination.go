package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/lib/emailtemplates"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/jackc/pgx/v5/pgconn"
	log "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type LeaseTerminationService interface {
	Create(ctx context.Context, input CreateLeaseTerminationInput) (*models.LeaseTermination, error)
	GetOne(ctx context.Context, query repository.GetTerminatedLeaseQuery) (*models.LeaseTermination, error)
	List(ctx context.Context, filter repository.ListLeaseTerminationsFilter) ([]models.LeaseTermination, error)
	Count(ctx context.Context, filter repository.ListLeaseTerminationsFilter) (int64, error)
	Update(ctx context.Context, input UpdateLeaseTerminationInput) (*models.LeaseTermination, error)
	Complete(ctx context.Context, input CompleteLeaseTerminationInput) error
	Cancel(ctx context.Context, input CancelLeaseTerminationInput) error
}

type leaseTerminationService struct {
	appCtx              pkg.AppContext
	repo                repository.LeaseTerminationRepository
	leaseRepo           repository.LeaseRepository
	unitService         UnitService
	notificationService NotificationService
}

type LeaseTerminationServiceDeps struct {
	AppCtx              pkg.AppContext
	Repo                repository.LeaseTerminationRepository
	LeaseRepo           repository.LeaseRepository
	UnitService         UnitService
	NotificationService NotificationService
}

func NewLeaseTerminationService(deps LeaseTerminationServiceDeps) LeaseTerminationService {
	return &leaseTerminationService{
		appCtx:              deps.AppCtx,
		repo:                deps.Repo,
		leaseRepo:           deps.LeaseRepo,
		unitService:         deps.UnitService,
		notificationService: deps.NotificationService,
	}
}

type CreateLeaseTerminationInput struct {
	LeaseID       string
	Type          string
	Reason        string
	InitiatedById string
}

func (s *leaseTerminationService) Create(
	ctx context.Context,
	input CreateLeaseTerminationInput,
) (*models.LeaseTermination, error) {
	lease, err := s.leaseRepo.GetOneWithPopulate(ctx, repository.GetLeaseQuery{ID: input.LeaseID})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "Create", "action": "fetching lease"},
		})
	}

	if lease.Status != "Lease.Status.Active" {
		return nil, pkg.BadRequestError("LeaseIsNotActive", nil)
	}

	// Guard: no other InProgress termination may exist for this lease
	inProgressStatus := "LeaseTermination.Status.InProgress"
	existingCount, countErr := s.repo.Count(ctx, repository.ListLeaseTerminationsFilter{
		LeaseID: &input.LeaseID,
		Status:  &inProgressStatus,
	})
	if countErr != nil {
		return nil, pkg.InternalServerError(countErr.Error(), &pkg.RentLoopErrorParams{
			Err:      countErr,
			Metadata: map[string]string{"function": "Create", "action": "counting existing terminations"},
		})
	}
	if existingCount > 0 {
		return nil, pkg.BadRequestError("TerminationAlreadyInProgress", nil)
	}

	termination := &models.LeaseTermination{
		LeaseID:       input.LeaseID,
		Type:          input.Type,
		Reason:        input.Reason,
		Status:        "LeaseTermination.Status.InProgress",
		InitiatedById: input.InitiatedById,
	}

	if createErr := s.repo.Create(ctx, termination); createErr != nil {
		var pgErr *pgconn.PgError
		if errors.As(createErr, &pgErr) && pgErr.Code == "23505" {
			return nil, pkg.BadRequestError("TerminationAlreadyInProgress", nil)
		}
		return nil, pkg.InternalServerError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err:      createErr,
			Metadata: map[string]string{"function": "Create", "action": "creating termination"},
		})
	}

	return termination, nil
}

func (s *leaseTerminationService) GetOne(
	ctx context.Context,
	query repository.GetTerminatedLeaseQuery,
) (*models.LeaseTermination, error) {
	termination, err := s.repo.GetOne(ctx, query)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseTerminationNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "GetOne", "action": "fetching termination"},
		})
	}
	return termination, nil
}

func (s *leaseTerminationService) List(
	ctx context.Context,
	filter repository.ListLeaseTerminationsFilter,
) ([]models.LeaseTermination, error) {
	result, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "List", "action": "listing terminations"},
		})
	}
	return *result, nil
}

func (s *leaseTerminationService) Count(
	ctx context.Context,
	filter repository.ListLeaseTerminationsFilter,
) (int64, error) {
	count, err := s.repo.Count(ctx, filter)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "Count", "action": "counting terminations"},
		})
	}
	return count, nil
}

type UpdateLeaseTerminationInput struct {
	ID      string
	LeaseID string

	Type             *string
	Reason           *string
	DocumentMode     lib.Optional[string]
	DocumentUrl      lib.Optional[string]
	DocumentId       lib.Optional[string]
	LeaseChecklistID lib.Optional[string]
}

func (s *leaseTerminationService) Update(
	ctx context.Context,
	input UpdateLeaseTerminationInput,
) (*models.LeaseTermination, error) {
	termination, err := s.repo.GetOne(ctx, repository.GetTerminatedLeaseQuery{ID: input.ID, LeaseID: input.LeaseID})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseTerminationNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "Update", "action": "fetching termination"},
		})
	}

	if termination.Status != "LeaseTermination.Status.InProgress" {
		return nil, pkg.BadRequestError("LeaseTerminationIsNotInProgress", nil)
	}

	if input.Type != nil {
		termination.Type = *input.Type
	}
	if input.Reason != nil {
		termination.Reason = *input.Reason
	}
	if input.DocumentMode.IsSet {
		termination.DocumentMode = input.DocumentMode.Ptr()
	}
	if input.DocumentUrl.IsSet {
		termination.DocumentUrl = input.DocumentUrl.Ptr()
	}
	if input.DocumentId.IsSet {
		termination.DocumentID = input.DocumentId.Ptr()
	}
	if input.LeaseChecklistID.IsSet {
		termination.LeaseChecklistID = input.LeaseChecklistID.Ptr()
	}

	if updateErr := s.repo.Update(ctx, termination); updateErr != nil {
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "Update", "action": "saving termination"},
		})
	}

	return termination, nil
}

type CompleteLeaseTerminationInput struct {
	ID           string
	LeaseID      string
	ClientUserID string
}

func (s *leaseTerminationService) Complete(ctx context.Context, input CompleteLeaseTerminationInput) error {
	termination, err := s.repo.GetOne(ctx, repository.GetTerminatedLeaseQuery{ID: input.ID, LeaseID: input.LeaseID})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("LeaseTerminationNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "Complete", "action": "fetching termination"},
		})
	}

	if termination.Status != "LeaseTermination.Status.InProgress" {
		return pkg.BadRequestError("LeaseTerminationIsNotInProgress", nil)
	}

	lease, leaseErr := s.leaseRepo.GetOneWithPopulate(
		ctx,
		repository.GetLeaseQuery{ID: input.LeaseID, Populate: &[]string{"Unit", "Tenant"}},
	)
	if leaseErr != nil {
		if errors.Is(leaseErr, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("LeaseNotFound", &pkg.RentLoopErrorParams{Err: leaseErr})
		}
		return pkg.InternalServerError(leaseErr.Error(), &pkg.RentLoopErrorParams{
			Err:      leaseErr,
			Metadata: map[string]string{"function": "Complete", "action": "fetching lease"},
		})
	}

	tx := s.appCtx.DB.Begin()
	txCtx := lib.WithTransaction(ctx, tx)

	now := time.Now()

	termination.Status = "LeaseTermination.Status.Completed"
	termination.CompletedAt = &now
	termination.CompletedById = &input.ClientUserID

	if updateErr := s.repo.Update(txCtx, termination); updateErr != nil {
		tx.Rollback()
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "Complete", "action": "updating termination status"},
		})
	}

	lease.Status = "Lease.Status.Terminated"
	lease.TerminatedAt = &now
	lease.TerminatedById = &input.ClientUserID
	lease.NextBillingDate = nil

	// Copy termination document URL to the lease if set
	if termination.DocumentUrl != nil {
		lease.TerminationAgreementDocumentUrl = termination.DocumentUrl
	}

	if leaseUpdateErr := s.leaseRepo.Update(txCtx, lease); leaseUpdateErr != nil {
		tx.Rollback()
		return pkg.InternalServerError(leaseUpdateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      leaseUpdateErr,
			Metadata: map[string]string{"function": "Complete", "action": "updating lease status"},
		})
	}

	// Check remaining active leases for this unit before reverting status
	activeCount, countErr := s.leaseRepo.CountActiveByUnitID(txCtx, lease.UnitId)
	if countErr != nil {
		tx.Rollback()
		return pkg.InternalServerError(countErr.Error(), &pkg.RentLoopErrorParams{
			Err:      countErr,
			Metadata: map[string]string{"function": "Complete", "action": "counting active leases for unit"},
		})
	}

	if commitErr := tx.Commit().Error; commitErr != nil {
		return pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err:      commitErr,
			Metadata: map[string]string{"function": "Complete", "action": "committing transaction"},
		})
	}

	// Release unit if no remaining active leases
	if activeCount == 0 {
		go func() {
			if err := s.unitService.SetSystemUnitStatus(context.Background(), UpdateUnitStatusInput{
				UnitID:     lease.UnitId,
				PropertyID: lease.Unit.PropertyID,
				Status:     "Unit.Status.Available",
			}); err != nil {
				log.WithError(err).WithFields(log.Fields{
					"unit_id":        lease.UnitId,
					"termination_id": input.ID,
				}).Error("failed to set unit status to Available after lease termination")
			}
		}()
	}

	// Fire-and-forget: email + SMS to tenant
	tenantName := lease.Tenant.FirstName
	unitName := lease.Unit.Name
	reason := termination.Reason

	smsMessage := strings.NewReplacer(
		"{{tenant_name}}", tenantName,
		"{{unit_name}}", unitName,
		"{{termination_reason}}", reason,
	).Replace(lib.LEASE_TERMINATED_SMS_BODY)

	if lease.Tenant.Email != nil {
		if htmlBody, textBody, renderErr := s.appCtx.EmailEngine.Render(
			"lease/terminated",
			emailtemplates.LeaseTerminatedData{
				TenantName:        tenantName,
				UnitName:          unitName,
				TerminationReason: reason,
			},
		); renderErr != nil {
			log.WithError(renderErr).Error("failed to render lease/terminated email template")
		} else {
			go pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
				Recipient: *lease.Tenant.Email,
				Subject:   lib.LEASE_TERMINATED_SUBJECT,
				HtmlBody:  htmlBody,
				TextBody:  textBody,
			})
		}
	}

	go s.appCtx.Clients.GatekeeperAPI.SendSMS(
		context.Background(),
		gatekeeper.SendSMSInput{
			Recipient: lease.Tenant.Phone,
			Message:   smsMessage,
		},
	)

	return nil
}

type CancelLeaseTerminationInput struct {
	ID           string
	LeaseID      string
	ClientUserID string
}

func (s *leaseTerminationService) Cancel(ctx context.Context, input CancelLeaseTerminationInput) error {
	termination, err := s.repo.GetOne(ctx, repository.GetTerminatedLeaseQuery{ID: input.ID, LeaseID: input.LeaseID})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("LeaseTerminationNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "Cancel", "action": "fetching termination"},
		})
	}

	if termination.Status != "LeaseTermination.Status.InProgress" {
		return pkg.BadRequestError("LeaseTerminationIsNotInProgress", nil)
	}

	now := time.Now()
	termination.Status = "LeaseTermination.Status.Cancelled"
	termination.CancelledAt = &now
	termination.CancelledById = &input.ClientUserID

	if updateErr := s.repo.Update(ctx, termination); updateErr != nil {
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "Cancel", "action": "saving termination"},
		})
	}

	return nil
}
