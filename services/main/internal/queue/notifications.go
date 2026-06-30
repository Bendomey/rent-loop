package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/fcm"
	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/lib/notificationtemplates"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/hibiken/asynq"
	log "github.com/sirupsen/logrus"
)

const TypeNotificationDeliver = "notification:deliver"

type NotificationDeliverPayload struct {
	DeliveryID string `json:"delivery_id"`
}

// ─── Client method ────────────────────────────────────────────────────────────

func (c *Client) EnqueueNotificationDeliver(ctx context.Context, deliveryID string) error {
	payload, err := json.Marshal(NotificationDeliverPayload{DeliveryID: deliveryID})
	if err != nil {
		return err
	}
	_, err = c.c.EnqueueContext(ctx,
		asynq.NewTask(TypeNotificationDeliver, payload),
		asynq.MaxRetry(5),
		asynq.Queue("notifications"),
	)
	return err
}

// ─── Worker handlers ──────────────────────────────────────────────────────────

// NotificationHandlers returns a HandlerRegistrar that wires up notification
// delivery task handlers onto the serve mux.
func NotificationHandlers(
	notificationRepo repository.NotificationRepository,
	fcmTokenRepo repository.FcmTokenRepository,
	appCtx pkg.AppContext,
) HandlerRegistrar {
	return func(mux *asynq.ServeMux) {
		mux.HandleFunc(TypeNotificationDeliver, handleNotificationDeliver(notificationRepo, fcmTokenRepo, appCtx))
	}
}

func handleNotificationDeliver(
	notificationRepo repository.NotificationRepository,
	fcmTokenRepo repository.FcmTokenRepository,
	appCtx pkg.AppContext,
) asynq.HandlerFunc {
	return func(ctx context.Context, t *asynq.Task) error {
		var p NotificationDeliverPayload
		if err := json.Unmarshal(t.Payload(), &p); err != nil {
			return fmt.Errorf("%w: %w", asynq.SkipRetry, err)
		}

		delivery, err := notificationRepo.GetDeliveryByID(ctx, p.DeliveryID)
		if err != nil {
			return fmt.Errorf("fetch delivery %s: %w", p.DeliveryID, err)
		}

		// Parse the notification data map for template resolution.
		var dataMap map[string]any
		if len(delivery.Notification.Data) > 0 {
			if err := json.Unmarshal(delivery.Notification.Data, &dataMap); err != nil {
				log.WithError(err).WithField("delivery_id", p.DeliveryID).
					Warn("[Notification] failed to unmarshal notification data — using empty map")
			}
		}
		if dataMap == nil {
			dataMap = map[string]any{}
		}

		delivery.Attempts++

		var dispatchErr error
		switch delivery.Channel {
		case models.NotificationChannelEmail:
			dispatchErr = dispatchEmail(ctx, delivery, dataMap, appCtx)
		case models.NotificationChannelSMS:
			dispatchErr = dispatchSMS(ctx, delivery, dataMap, appCtx)
		case models.NotificationChannelPush:
			dispatchErr = dispatchPush(ctx, delivery, dataMap, fcmTokenRepo, appCtx)
		default:
			errMsg := fmt.Sprintf("unknown channel: %s", delivery.Channel)
			delivery.Status = models.DeliveryStatusFailed
			delivery.ErrorMessage = &errMsg
			now := time.Now()
			delivery.FailedAt = &now
			_ = notificationRepo.UpdateDelivery(ctx, delivery)
			return fmt.Errorf("%w: %s", asynq.SkipRetry, errMsg)
		}

		if dispatchErr != nil {
			errMsg := dispatchErr.Error()
			delivery.ErrorMessage = &errMsg
			if delivery.Attempts >= delivery.MaxAttempts {
				delivery.Status = models.DeliveryStatusFailed
				now := time.Now()
				delivery.FailedAt = &now
			} else {
				delivery.Status = models.DeliveryStatusRetrying
			}
			log.WithError(dispatchErr).WithFields(log.Fields{
				"delivery_id": p.DeliveryID,
				"channel":     delivery.Channel,
				"attempt":     delivery.Attempts,
			}).Error("[Notification] delivery dispatch failed")
		} else {
			delivery.Status = models.DeliveryStatusSent
			now := time.Now()
			delivery.SentAt = &now
		}

		if updateErr := notificationRepo.UpdateDelivery(ctx, delivery); updateErr != nil {
			log.WithError(updateErr).WithField("delivery_id", p.DeliveryID).
				Error("[Notification] failed to update delivery record")
		}

		return dispatchErr
	}
}

func dispatchEmail(
	ctx context.Context,
	delivery *models.NotificationDelivery,
	dataMap map[string]any,
	appCtx pkg.AppContext,
) error {
	_ = ctx

	if delivery.RecipientAddress == nil || *delivery.RecipientAddress == "" {
		return fmt.Errorf("email delivery has no recipient address")
	}

	resolution, err := notificationtemplates.ResolveEmail(delivery.Notification.Event, dataMap)
	if err != nil {
		return fmt.Errorf("%w: %w", asynq.SkipRetry, err)
	}

	htmlBody, textBody, renderErr := appCtx.EmailEngine.Render(resolution.TemplateName, resolution.TemplateData)
	if renderErr != nil {
		return fmt.Errorf("render email template %q: %w", resolution.TemplateName, renderErr)
	}

	return pkg.SendEmail(appCtx.Config, pkg.SendEmailInput{
		Recipient: *delivery.RecipientAddress,
		Subject:   resolution.Subject,
		HtmlBody:  htmlBody,
		TextBody:  textBody,
	})
}

func dispatchSMS(
	ctx context.Context,
	delivery *models.NotificationDelivery,
	dataMap map[string]any,
	appCtx pkg.AppContext,
) error {
	if delivery.RecipientAddress == nil || *delivery.RecipientAddress == "" {
		return fmt.Errorf("sms delivery has no recipient address")
	}

	body, err := notificationtemplates.ResolveSMS(delivery.Notification.Event, dataMap)
	if err != nil {
		return fmt.Errorf("%w: %w", asynq.SkipRetry, err)
	}

	return appCtx.Clients.GatekeeperAPI.SendSMS(ctx, gatekeeper.SendSMSInput{
		Recipient: *delivery.RecipientAddress,
		Message:   body,
	})
}

func dispatchPush(
	ctx context.Context,
	delivery *models.NotificationDelivery,
	dataMap map[string]any,
	fcmTokenRepo repository.FcmTokenRepository,
	appCtx pkg.AppContext,
) error {
	tokens, err := fcmTokenRepo.FindAllByTenantAccountID(ctx, delivery.Notification.RecipientID)
	if err != nil {
		return fmt.Errorf("fetch FCM tokens: %w", err)
	}
	if len(tokens) == 0 {
		// No devices registered — treat as a silent success (no-op, not an error).
		return nil
	}

	title := ""
	if delivery.Notification.Title != nil {
		title = *delivery.Notification.Title
	}
	body := ""
	if delivery.Notification.Body != nil {
		body = *delivery.Notification.Body
	}

	// Convert data map to map[string]string for FCM.
	fcmData := make(map[string]string, len(dataMap))
	for k, v := range dataMap {
		fcmData[k] = fmt.Sprintf("%v", v)
	}
	fcmData["event"] = delivery.Notification.Event

	fcmClient := appCtx.Clients.FCM
	var lastErr error
	for _, token := range tokens {
		if sendErr := fcmClient.Send(ctx, token.Token, title, body, fcmData); sendErr != nil {
			if sendErr == fcm.ErrInvalidToken {
				log.WithField("token", token.Token).Info("[FCM] removing stale token from notification delivery")
				if delErr := fcmTokenRepo.Delete(ctx, token.Token); delErr != nil {
					log.WithError(delErr).Warn("[FCM] failed to delete stale token")
				}
				continue
			}
			log.WithError(sendErr).WithField("delivery_id", delivery.ID).
				Error("[Notification] push send failed for token")
			lastErr = sendErr
		}
	}
	return lastErr
}
