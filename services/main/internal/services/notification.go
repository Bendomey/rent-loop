package services

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/fcm"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	log "github.com/sirupsen/logrus"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type NotificationService interface {
	// RegisterToken upserts an FCM device token for the given tenant account.
	RegisterToken(ctx context.Context, input RegisterFcmTokenInput) error
	// DeleteToken removes a specific FCM token, verifying it belongs to the given tenant account.
	DeleteToken(ctx context.Context, tenantAccountID, token string) error
	// SendToTenantAccount fans out a push notification to all tokens for the account.
	// Invalid tokens reported by FCM are automatically deleted.
	SendToTenantAccount(ctx context.Context, tenantAccountID, title, body string, data map[string]string) error

	// CreateNotification persists a new notification record and returns it.
	CreateNotification(ctx context.Context, input CreateNotificationInput) (*models.Notification, error)
	// ListInApp returns paginated IN_APP notifications for a recipient, newest first.
	ListInApp(
		ctx context.Context,
		recipientID, recipientType string,
		page, pageSize int,
	) ([]*models.Notification, int64, error)
	// MarkAsRead marks one notification as read, verifying ownership by recipientID.
	MarkAsRead(ctx context.Context, notificationID, recipientID string) error
	// MarkAllAsRead marks all unread IN_APP notifications as read for a recipient.
	MarkAllAsRead(ctx context.Context, recipientID, recipientType string) error
	// GetUnreadCount returns the count of unread IN_APP notifications for a recipient.
	GetUnreadCount(ctx context.Context, recipientID, recipientType string) (int64, error)
}

type notificationService struct {
	appCtx           pkg.AppContext
	fcmTokenRepo     repository.FcmTokenRepository
	notificationRepo repository.NotificationRepository
	enqueuer         RentloopQueue
}

func NewNotificationService(
	appCtx pkg.AppContext,
	fcmTokenRepo repository.FcmTokenRepository,
	notificationRepo repository.NotificationRepository,
	enqueuer RentloopQueue,
) NotificationService {
	return &notificationService{
		appCtx:           appCtx,
		fcmTokenRepo:     fcmTokenRepo,
		notificationRepo: notificationRepo,
		enqueuer:         enqueuer,
	}
}

type RegisterFcmTokenInput struct {
	TenantAccountID string
	Token           string
	Platform        string // "ios" or "android"
}

func (s *notificationService) RegisterToken(ctx context.Context, input RegisterFcmTokenInput) error {
	token := &models.FcmToken{
		TenantAccountID: input.TenantAccountID,
		Token:           input.Token,
		Platform:        input.Platform,
	}
	if err := s.fcmTokenRepo.Upsert(ctx, token); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "RegisterToken",
				"action":   "upserting FCM token",
			},
		})
	}
	return nil
}

func (s *notificationService) DeleteToken(ctx context.Context, tenantAccountID, token string) error {
	tokens, err := s.fcmTokenRepo.FindAllByTenantAccountID(ctx, tenantAccountID)
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "DeleteToken",
				"action":   "fetching FCM tokens for ownership check",
			},
		})
	}

	for _, t := range tokens {
		if t.Token == token {
			return s.fcmTokenRepo.Delete(ctx, token)
		}
	}

	// Token not found for this account — treat as a no-op (already removed or never registered).
	return nil
}

func (s *notificationService) SendToTenantAccount(
	ctx context.Context,
	tenantAccountID, title, body string,
	data map[string]string,
) error {
	tokens, err := s.fcmTokenRepo.FindAllByTenantAccountID(ctx, tenantAccountID)
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "SendToTenantAccount",
				"action":   "fetching FCM tokens",
			},
		})
	}

	fcmClient := s.appCtx.Clients.FCM

	for _, t := range tokens {
		sendErr := fcmClient.Send(ctx, t.Token, title, body, data)
		if sendErr != nil {
			if errors.Is(sendErr, fcm.ErrInvalidToken) {
				log.WithField("token", t.Token).Info("[FCM] removing invalid token")
				if delErr := s.fcmTokenRepo.Delete(ctx, t.Token); delErr != nil {
					log.WithError(delErr).Warn("[FCM] failed to delete invalid token")
				}
				continue
			}
			log.WithError(sendErr).WithField("tenantAccountID", tenantAccountID).
				Error("[FCM] failed to send push notification")
		}
	}

	return nil
}

// CreateNotificationInput describes a notification event and its delivery channels.
//
// Channels drives both visibility and external delivery:
//   - "IN_APP" — stores the notification visibly in the recipient's notification centre (no delivery record)
//   - "EMAIL"  — creates a delivery record and queues an email dispatch; requires RecipientEmail
//   - "SMS"    — creates a delivery record and queues an SMS dispatch; requires RecipientPhone
//   - "PUSH"   — creates a delivery record and queues a push dispatch; FCM tokens resolved at delivery time
//
// Visibility is derived automatically: if "IN_APP" is present → IN_APP, otherwise → HIDDEN.
// Omit "IN_APP" to store the notification for audit/delivery only without showing it in the centre.
type CreateNotificationInput struct {
	OrganizationID string
	RecipientID    string
	RecipientType  string // "CLIENT_USER" | "TENANT_ACCOUNT"
	Event          string
	Category       *string
	Title          string
	Body           string
	Data           map[string]any
	// Channels to activate. "IN_APP" controls visibility; the rest create delivery records.
	Channels       []string // "IN_APP" | "EMAIL" | "SMS" | "PUSH"
	RecipientEmail *string  // required when "EMAIL" is in Channels
	RecipientPhone *string  // required when "SMS" is in Channels
}

func (s *notificationService) CreateNotification(
	ctx context.Context,
	input CreateNotificationInput,
) (*models.Notification, error) {
	var dataJSON datatypes.JSON
	if input.Data != nil {
		raw, err := json.Marshal(input.Data)
		if err != nil {
			return nil, pkg.InternalServerError(
				"failed to marshal notification data",
				&pkg.RentLoopErrorParams{Err: err},
			)
		}
		dataJSON = datatypes.JSON(raw)
	}

	visibility := models.NotificationVisibilityHidden
	for _, ch := range input.Channels {
		if ch == models.NotificationChannelInApp {
			visibility = models.NotificationVisibilityInApp
			break
		}
	}

	n := &models.Notification{
		OrganizationID: input.OrganizationID,
		RecipientID:    input.RecipientID,
		RecipientType:  input.RecipientType,
		Event:          input.Event,
		Category:       input.Category,
		Visibility:     visibility,
		Title:          &input.Title,
		Body:           &input.Body,
		Data:           dataJSON,
		Status:         models.NotificationStatusPending,
	}

	if err := s.notificationRepo.Create(ctx, n); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	// Create a delivery record for each external channel and enqueue a dispatch task.
	// IN_APP is handled via the visibility field above — no delivery record needed.
	now := time.Now()
	for _, channel := range input.Channels {
		if channel == models.NotificationChannelInApp {
			continue
		}

		var recipientAddress *string
		switch channel {
		case models.NotificationChannelEmail:
			recipientAddress = input.RecipientEmail
		case models.NotificationChannelSMS:
			recipientAddress = input.RecipientPhone
			// PUSH: address resolved from FCM token table at delivery time — no address needed here
		}

		delivery := &models.NotificationDelivery{
			NotificationID:   n.ID,
			Channel:          channel,
			RecipientAddress: recipientAddress,
			Status:           models.DeliveryStatusQueued,
			QueuedAt:         now,
		}
		if err := s.notificationRepo.CreateDelivery(ctx, delivery); err != nil {
			log.WithError(err).WithFields(log.Fields{
				"notification_id": n.ID,
				"channel":         channel,
			}).Error("[Notification] failed to create delivery record")
			continue
		}

		if s.enqueuer != nil {
			if err := s.enqueuer.EnqueueNotificationDeliver(ctx, delivery.ID.String()); err != nil {
				log.WithError(err).WithFields(log.Fields{
					"notification_id": n.ID,
					"delivery_id":     delivery.ID,
					"channel":         channel,
				}).Error("[Notification] failed to enqueue delivery task")
			}
		}
	}

	return n, nil
}

func (s *notificationService) ListInApp(
	ctx context.Context,
	recipientID, recipientType string,
	page, pageSize int,
) ([]*models.Notification, int64, error) {
	notifications, total, err := s.notificationRepo.ListInApp(ctx, recipientID, recipientType, page, pageSize)
	if err != nil {
		return nil, 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return notifications, total, nil
}

func (s *notificationService) MarkAsRead(ctx context.Context, notificationID, recipientID string) error {
	err := s.notificationRepo.MarkAsRead(ctx, notificationID, recipientID)
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return pkg.NotFoundError("notification not found", &pkg.RentLoopErrorParams{Err: err})
	}
	return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
}

func (s *notificationService) MarkAllAsRead(ctx context.Context, recipientID, recipientType string) error {
	if err := s.notificationRepo.MarkAllAsRead(ctx, recipientID, recipientType); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return nil
}

func (s *notificationService) GetUnreadCount(ctx context.Context, recipientID, recipientType string) (int64, error) {
	count, err := s.notificationRepo.GetUnreadCount(ctx, recipientID, recipientType)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return count, nil
}
