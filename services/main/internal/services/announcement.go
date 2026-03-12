package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	log "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// RentloopQueue is implemented by the queue client.
// Defined here to avoid a circular import between services and queue packages.
type RentloopQueue interface {
	EnqueueAnnouncementPublish(ctx context.Context, announcementID string, at time.Time) error
	EnqueueAnnouncementExpire(ctx context.Context, announcementID string, at time.Time) error
	CancelAnnouncementPublish(ctx context.Context, announcementID string) error
	RescheduleAnnouncementExpire(ctx context.Context, announcementID string, at time.Time) error
}

type AnnouncementService interface {
	Create(ctx context.Context, input CreateAnnouncementInput) (*models.Announcement, error)
	GetByIDWithPopulate(ctx context.Context, query repository.GetAnnouncementQuery) (*models.Announcement, error)
	List(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListAnnouncementsFilter,
	) ([]models.Announcement, error)
	Count(ctx context.Context, filterQuery lib.FilterQuery, filters repository.ListAnnouncementsFilter) (int64, error)
	Update(ctx context.Context, input UpdateAnnouncementInput) (*models.Announcement, error)
	Delete(ctx context.Context, id string) error
	Publish(ctx context.Context, id string) error
	Expire(ctx context.Context, id string) error
	Schedule(ctx context.Context, input ScheduleAnnouncementInput) (*models.Announcement, error)
	CancelSchedule(ctx context.Context, id string) error
	ExtendExpiry(ctx context.Context, id string, newExpiresAt time.Time) error
	MarkAsRead(ctx context.Context, announcementID, tenantAccountID string) error
}

type announcementService struct {
	appCtx              pkg.AppContext
	repo                repository.AnnouncementRepository
	tenantAccountRepo   repository.TenantAccountRepository
	notificationService NotificationService
	enqueuer            RentloopQueue
}

type AnnouncementServiceDeps struct {
	AppCtx              pkg.AppContext
	Repo                repository.AnnouncementRepository
	TenantAccountRepo   repository.TenantAccountRepository
	NotificationService NotificationService
	RentloopQueue       RentloopQueue
}

func NewAnnouncementService(deps AnnouncementServiceDeps) AnnouncementService {
	return &announcementService{
		appCtx:              deps.AppCtx,
		repo:                deps.Repo,
		tenantAccountRepo:   deps.TenantAccountRepo,
		notificationService: deps.NotificationService,
		enqueuer:            deps.RentloopQueue,
	}
}

type CreateAnnouncementInput struct {
	Title           string
	Content         string
	Type            string
	Priority        string
	ClientID        string
	CreatedByID     string
	PropertyID      *string
	PropertyBlockID *string
	TargetUnitIDs   *[]string
	ScheduledAt     *time.Time
	ExpiresAt       *time.Time
}

func (s *announcementService) Create(
	ctx context.Context,
	input CreateAnnouncementInput,
) (*models.Announcement, error) {
	targetUnitIDs := []string{}
	if input.TargetUnitIDs != nil {
		targetUnitIDs = *input.TargetUnitIDs
	}

	announcement := &models.Announcement{
		Title:           input.Title,
		Content:         input.Content,
		Type:            input.Type,
		Priority:        input.Priority,
		ClientID:        input.ClientID,
		CreatedById:     input.CreatedByID,
		PropertyID:      input.PropertyID,
		PropertyBlockID: input.PropertyBlockID,
		TargetUnitIDs:   targetUnitIDs,
		ScheduledAt:     input.ScheduledAt,
		ExpiresAt:       input.ExpiresAt,
	}

	if err := s.repo.Create(ctx, announcement); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateAnnouncement",
				"action":   "creating announcement record",
			},
		})
	}

	return announcement, nil
}

func (s *announcementService) GetByIDWithPopulate(
	ctx context.Context,
	query repository.GetAnnouncementQuery,
) (*models.Announcement, error) {
	announcement, err := s.repo.GetByIDWithPopulate(ctx, query)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("AnnouncementNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "GetAnnouncementByIDWithPopulate"},
		})
	}
	return announcement, nil
}

func (s *announcementService) List(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListAnnouncementsFilter,
) ([]models.Announcement, error) {
	announcements, err := s.repo.List(ctx, filterQuery, filters)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ListAnnouncements"},
		})
	}
	return *announcements, nil
}

func (s *announcementService) Count(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListAnnouncementsFilter,
) (int64, error) {
	count, err := s.repo.Count(ctx, filterQuery, filters)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "CountAnnouncements"},
		})
	}
	return count, nil
}

type UpdateAnnouncementInput struct {
	ID              string
	Title           *string
	Content         *string
	Type            *string
	Priority        *string
	PropertyID      lib.Optional[string]
	PropertyBlockID lib.Optional[string]
	TargetUnitIDs   *[]string
	ScheduledAt     lib.Optional[time.Time]
	ExpiresAt       lib.Optional[time.Time]
}

func (s *announcementService) Update(
	ctx context.Context,
	input UpdateAnnouncementInput,
) (*models.Announcement, error) {
	announcement, err := s.repo.GetByIDWithPopulate(ctx, repository.GetAnnouncementQuery{
		ID: input.ID,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("AnnouncementNotFound", &pkg.RentLoopErrorParams{Err: err})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "UpdateAnnouncement", "action": "fetching announcement"},
		})
	}

	if announcement.Status != "DRAFT" {
		return nil, pkg.BadRequestError("AnnouncementNotEditable", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{"reason": "only DRAFT announcements can be updated"},
		})
	}

	if input.Title != nil {
		announcement.Title = *input.Title
	}
	if input.Content != nil {
		announcement.Content = *input.Content
	}
	if input.Type != nil {
		announcement.Type = *input.Type
	}
	if input.Priority != nil {
		announcement.Priority = *input.Priority
	}
	if input.PropertyID.IsSet {
		announcement.PropertyID = input.PropertyID.Ptr()
	}
	if input.PropertyBlockID.IsSet {
		announcement.PropertyBlockID = input.PropertyBlockID.Ptr()
	}
	if input.TargetUnitIDs != nil {
		announcement.TargetUnitIDs = *input.TargetUnitIDs
	}
	if input.ScheduledAt.IsSet {
		announcement.ScheduledAt = input.ScheduledAt.Ptr()
	}
	if input.ExpiresAt.IsSet {
		announcement.ExpiresAt = input.ExpiresAt.Ptr()
	}

	if err := s.repo.Update(ctx, announcement); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "UpdateAnnouncement", "action": "saving announcement"},
		})
	}

	return announcement, nil
}

func (s *announcementService) Delete(ctx context.Context, id string) error {
	announcement, err := s.repo.GetByIDWithPopulate(ctx, repository.GetAnnouncementQuery{
		ID: id,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("AnnouncementNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "DeleteAnnouncement", "action": "fetching announcement"},
		})
	}

	if announcement.Status != "DRAFT" {
		return pkg.BadRequestError("AnnouncementNotDeletable", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{"reason": "only DRAFT announcements can be deleted"},
		})
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "DeleteAnnouncement", "action": "deleting announcement"},
		})
	}

	return nil
}

type ScheduleAnnouncementInput struct {
	ID          string
	ScheduledAt time.Time
}

func (s *announcementService) Schedule(
	ctx context.Context,
	input ScheduleAnnouncementInput,
) (*models.Announcement, error) {
	announcement, err := s.repo.GetByIDWithPopulate(ctx, repository.GetAnnouncementQuery{
		ID: input.ID,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("AnnouncementNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ScheduleAnnouncement", "action": "fetching announcement"},
		})
	}

	if announcement.Status != "DRAFT" {
		return nil, pkg.BadRequestError("AnnouncementNotSchedulable", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{"reason": "only DRAFT announcements can be scheduled"},
		})
	}

	announcement.Status = "SCHEDULED"
	announcement.ScheduledAt = &input.ScheduledAt

	if err := s.repo.Update(ctx, announcement); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ScheduleAnnouncement", "action": "saving announcement"},
		})
	}

	if err := s.enqueuer.EnqueueAnnouncementPublish(ctx, announcement.ID.String(), input.ScheduledAt); err != nil {
		log.WithError(err).WithField("announcementID", announcement.ID.String()).
			Error("[Announcement] failed to enqueue scheduled publish job")
	}

	return announcement, nil
}

func (s *announcementService) Publish(ctx context.Context, id string) error {
	announcement, err := s.repo.GetByIDWithPopulate(ctx, repository.GetAnnouncementQuery{
		ID: id,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("AnnouncementNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "PublishAnnouncement", "action": "fetching announcement"},
		})
	}

	if announcement.Status != "DRAFT" && announcement.Status != "SCHEDULED" {
		return pkg.BadRequestError("AnnouncementNotPublishable", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{"reason": "only DRAFT or SCHEDULED announcements can be published"},
		})
	}

	now := time.Now()
	announcement.Status = "PUBLISHED"
	announcement.PublishedAt = &now

	if err := s.repo.Update(ctx, announcement); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "PublishAnnouncement", "action": "saving announcement"},
		})
	}

	if announcement.ExpiresAt != nil {
		if err := s.enqueuer.EnqueueAnnouncementExpire(ctx, announcement.ID.String(), *announcement.ExpiresAt); err != nil {
			log.WithError(err).WithField("announcementID", announcement.ID.String()).
				Error("[Announcement] failed to enqueue expire job")
		}
	}

	go s.fanOutNotifications(context.Background(), announcement)

	return nil
}

func (s *announcementService) fanOutNotifications(ctx context.Context, a *models.Announcement) {
	accounts, err := s.resolveTargetAccounts(ctx, a)
	if err != nil {
		log.WithError(err).WithField("announcementID", a.ID.String()).
			Error("[Announcement] failed to resolve target tenant accounts")
		return
	}

	if len(*accounts) == 0 {
		return
	}

	tenantsByID := s.bulkFetchTenants(ctx, *accounts)

	title := a.Title
	body := a.Content
	if len(body) > 200 {
		body = body[:200] + "..."
	}

	data := map[string]string{
		"type":            "ANNOUNCEMENT",
		"announcement_id": a.ID.String(),
		"priority":        a.Priority,
	}

	emailBody := strings.ReplaceAll(lib.ANNOUNCEMENT_EMAIL_BODY, "{{announcement_title}}", a.Title)
	emailBody = strings.ReplaceAll(emailBody, "{{announcement_content}}", a.Content)
	emailBody = strings.ReplaceAll(emailBody, "{{announcement_type}}", a.Type)

	var emailRecipients []pkg.BulkEmailRecipient
	var smsRecipients []string

	smsMsg := strings.ReplaceAll(lib.ANNOUNCEMENT_SMS_BODY, "{{announcement_title}}", a.Title)
	smsMsg = strings.ReplaceAll(smsMsg, "{{announcement_content}}", a.Content)

	for _, account := range *accounts {
		accountID := account.ID.String()
		tenant := tenantsByID[account.TenantId]

		// All priorities → push notification
		go func(id string) {
			if sendErr := s.notificationService.SendToTenantAccount(ctx, id, title, body, data); sendErr != nil {
				log.WithError(sendErr).WithField("tenantAccountID", id).
					Warn("[Announcement] push notification failed")
			}
		}(accountID)

		if tenant == nil {
			continue
		}

		// URGENT → collect for bulk email
		if a.Priority == "URGENT" && tenant.Email != nil {
			emailRecipients = append(emailRecipients, pkg.BulkEmailRecipient{
				To:       *tenant.Email,
				Subject:  lib.ANNOUNCEMENT_EMAIL_SUBJECT,
				TextBody: emailBody,
			})
		}

		// IMPORTANT / URGENT → collect for bulk SMS
		if a.Priority == "IMPORTANT" || a.Priority == "URGENT" {
			smsRecipients = append(smsRecipients, tenant.Phone)
		}
	}

	if len(emailRecipients) > 0 {
		go func() {
			if sendErr := pkg.SendBulkEmail(ctx, s.appCtx.Config, emailRecipients); sendErr != nil {
				log.WithError(sendErr).WithField("announcementID", a.ID.String()).
					Warn("[Announcement] bulk email send failed")
			}
		}()
	}

	if len(smsRecipients) > 0 {
		go func() {
			if sendErr := s.appCtx.Clients.GatekeeperAPI.SendBulkSMS(ctx, gatekeeper.SendBulkSMSInput{
				Recipients: smsRecipients,
				Message:    smsMsg,
			}); sendErr != nil {
				log.WithError(sendErr).WithField("announcementID", a.ID.String()).
					Warn("[Announcement] bulk SMS send failed")
			}
		}()
	}
}

func (s *announcementService) resolveTargetAccounts(
	ctx context.Context,
	a *models.Announcement,
) (*[]models.TenantAccount, error) {
	if len(a.TargetUnitIDs) > 0 {
		return s.tenantAccountRepo.GetByUnitIDs(ctx, a.TargetUnitIDs)
	}

	if a.PropertyBlockID != nil {
		return s.tenantAccountRepo.GetByBlockID(ctx, *a.PropertyBlockID)
	}

	if a.PropertyID != nil {
		return s.tenantAccountRepo.GetByPropertyID(ctx, *a.PropertyID)
	}

	// All tenants for this client's properties
	return s.tenantAccountRepo.GetByClientID(ctx, a.ClientID)
}

func (s *announcementService) bulkFetchTenants(
	ctx context.Context,
	accounts []models.TenantAccount,
) map[string]*models.Tenant {
	tenantIDs := make([]string, 0, len(accounts))
	for _, a := range accounts {
		tenantIDs = append(tenantIDs, a.TenantId)
	}

	var tenants []models.Tenant
	if err := s.appCtx.DB.WithContext(ctx).Where("id IN ?", tenantIDs).Find(&tenants).Error; err != nil {
		log.WithError(err).Error("[Announcement] failed to bulk fetch tenants")
		return nil
	}

	m := make(map[string]*models.Tenant, len(tenants))
	for i := range tenants {
		m[tenants[i].ID.String()] = &tenants[i]
	}
	return m
}

func (s *announcementService) CancelSchedule(ctx context.Context, id string) error {
	announcement, err := s.repo.GetByIDWithPopulate(ctx, repository.GetAnnouncementQuery{ID: id})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("AnnouncementNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "CancelScheduleAnnouncement", "action": "fetching announcement"},
		})
	}

	if announcement.Status != "SCHEDULED" {
		return pkg.BadRequestError("AnnouncementNotScheduled", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{"reason": "only SCHEDULED announcements can have their schedule cancelled"},
		})
	}

	announcement.Status = "DRAFT"
	announcement.ScheduledAt = nil
	if err := s.repo.Update(ctx, announcement); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "CancelScheduleAnnouncement", "action": "saving announcement"},
		})
	}

	if err := s.enqueuer.CancelAnnouncementPublish(ctx, id); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "CancelScheduleAnnouncement", "action": "cancelling queue task"},
		})
	}

	return nil
}

func (s *announcementService) ExtendExpiry(ctx context.Context, id string, newExpiresAt time.Time) error {
	announcement, err := s.repo.GetByIDWithPopulate(ctx, repository.GetAnnouncementQuery{ID: id})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("AnnouncementNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ExtendAnnouncementExpiry", "action": "fetching announcement"},
		})
	}

	if announcement.Status != "PUBLISHED" {
		return pkg.BadRequestError("AnnouncementNotPublished", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{"reason": "only PUBLISHED announcements can have their expiry extended"},
		})
	}

	if !newExpiresAt.After(time.Now()) {
		return pkg.BadRequestError("ExpiryMustBeInFuture", nil)
	}

	if err := s.enqueuer.RescheduleAnnouncementExpire(ctx, id, newExpiresAt); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ExtendAnnouncementExpiry", "action": "rescheduling expire task"},
		})
	}

	announcement.ExpiresAt = &newExpiresAt
	if err := s.repo.Update(ctx, announcement); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ExtendAnnouncementExpiry", "action": "saving announcement"},
		})
	}

	return nil
}

func (s *announcementService) Expire(ctx context.Context, id string) error {
	announcement, err := s.repo.GetByIDWithPopulate(ctx, repository.GetAnnouncementQuery{ID: id})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("AnnouncementNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ExpireAnnouncement", "action": "fetching announcement"},
		})
	}

	if announcement.Status != "PUBLISHED" {
		return pkg.BadRequestError("AnnouncementNotExpirable", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{"reason": "only PUBLISHED announcements can be expired"},
		})
	}

	announcement.Status = "EXPIRED"
	if err := s.repo.Update(ctx, announcement); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ExpireAnnouncement", "action": "saving announcement"},
		})
	}

	return nil
}

func (s *announcementService) MarkAsRead(ctx context.Context, announcementID, tenantAccountID string) error {
	alreadyRead, err := s.repo.HasRead(ctx, announcementID, tenantAccountID)
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "MarkAsRead", "action": "checking existing read"},
		})
	}

	if alreadyRead {
		return nil
	}

	read := &models.AnnouncementRead{
		AnnouncementID:  announcementID,
		TenantAccountID: tenantAccountID,
	}

	if err := s.repo.CreateRead(ctx, read); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "MarkAsRead", "action": "creating read record"},
		})
	}

	return nil
}
