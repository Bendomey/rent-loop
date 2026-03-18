package services

import (
	"context"
	"strings"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type WaitlistService interface {
	CreateWaitlistEntry(ctx context.Context, input CreateWaitlistEntryInput) (*models.Waitlist, error)
}

type CreateWaitlistEntryInput struct {
	FullName    string
	PhoneNumber string
	Email       *string
}

type waitlistService struct {
	appCtx pkg.AppContext
	repo   repository.WaitlistRepository
}

func NewWaitlistService(appCtx pkg.AppContext, repo repository.WaitlistRepository) WaitlistService {
	return &waitlistService{appCtx, repo}
}

func (s *waitlistService) CreateWaitlistEntry(
	ctx context.Context,
	input CreateWaitlistEntryInput,
) (*models.Waitlist, error) {
	entry := &models.Waitlist{
		FullName:    input.FullName,
		PhoneNumber: input.PhoneNumber,
		Email:       input.Email,
	}
	if err := s.repo.CreateWaitlistEntry(ctx, entry); err != nil {
		return nil, err
	}

	message := strings.ReplaceAll(lib.WAITLIST_JOINED_BODY, "{{full_name}}", input.FullName)

	if input.Email != nil && *input.Email != "" {
		go pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
			Recipient: *input.Email,
			Subject:   lib.WAITLIST_JOINED_SUBJECT,
			TextBody:  message,
		})
	}

	smsMessage := strings.ReplaceAll(lib.WAITLIST_JOINED_SMS_BODY, "{{full_name}}", input.FullName)
	go s.appCtx.Clients.GatekeeperAPI.SendSMS(context.Background(), gatekeeper.SendSMSInput{
		Recipient: input.PhoneNumber,
		Message:   smsMessage,
	})

	return entry, nil
}
