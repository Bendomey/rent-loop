package services

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/fcm"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	log "github.com/sirupsen/logrus"
)

type NotificationService interface {
	// RegisterToken upserts an FCM device token for the given tenant account.
	RegisterToken(ctx context.Context, input RegisterFcmTokenInput) error
	// SendToTenantAccount fans out a push notification to all tokens for the account.
	// Invalid tokens reported by FCM are automatically deleted.
	SendToTenantAccount(ctx context.Context, tenantAccountID, title, body string, data map[string]string) error
}

type notificationService struct {
	appCtx       pkg.AppContext
	fcmTokenRepo repository.FcmTokenRepository
}

func NewNotificationService(appCtx pkg.AppContext, fcmTokenRepo repository.FcmTokenRepository) NotificationService {
	return &notificationService{
		appCtx:       appCtx,
		fcmTokenRepo: fcmTokenRepo,
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
