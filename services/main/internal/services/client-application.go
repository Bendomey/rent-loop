package services

import (
	"context"
	"fmt"
	"strings"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/getsentry/raven-go"
	gonanoid "github.com/matoous/go-nanoid"
)

type ClientApplicationService interface {
	GetClientApplication(ctx context.Context, clientApplicationId string) (*models.ClientApplication, error)
	CreateClientApplication(ctx context.Context, input CreateClientApplicationInput) (*models.ClientApplication, error)
	ListClientApplications(ctx context.Context, filterQuery lib.FilterQuery, filters repository.ListClientApplicationsFilter) ([]models.ClientApplication, error)
	CountClientApplications(ctx context.Context, filterQuery lib.FilterQuery, filters repository.ListClientApplicationsFilter) (int64, error)
	ApproveClientApplication(ctx context.Context, clientApplicationId string, adminId string) (*models.ClientApplication, error)
	RejectClientApplication(ctx context.Context, input RejectClientApplicationInput) (*models.ClientApplication, error)
}

type clientApplicationService struct {
	appCtx pkg.AppContext
	repo   repository.ClientApplicationRepository
}

func NewClientApplicationService(appCtx pkg.AppContext, repo repository.ClientApplicationRepository) ClientApplicationService {
	return &clientApplicationService{appCtx, repo}
}

func (s *clientApplicationService) GetClientApplication(ctx context.Context, clientApplicationId string) (*models.ClientApplication, error) {
	return s.repo.GetByID(ctx, clientApplicationId)
}

type CreateClientApplicationInput struct {
	Type               string
	SubType            string
	Name               string
	Address            string
	Country            string
	Region             string
	City               string
	Latitude           float64
	Longitude          float64
	ContactName        string
	ContactPhoneNumber string
	ContactEmail       string
	Status             string
	DateOfBirth        string
	IDType             *string
	IDNumber           *string
	IDExpiry           *string
	IDDocumentURL      *string
	RegistrationNumber *string
	LogoURL            *string
	Description        *string
	WebsiteURL         *string
	SupportEmail       *string
	SupportPhone       *string
}

type CreateClientRequest struct {
	Type                string
	SubType             string
	Name                string
	Address             string
	Country             string
	Region              string
	City                string
	Latitude            float64
	Longitude           float64
	ClientApplicationId string
}

func (s *clientApplicationService) CreateClientApplication(ctx context.Context, input CreateClientApplicationInput) (*models.ClientApplication, error) {

	clientApplication := models.ClientApplication{
		Type:               input.Type,
		SubType:            input.SubType,
		Name:               input.Name,
		Address:            input.Address,
		Country:            input.Country,
		Region:             input.Region,
		City:               input.City,
		Latitude:           input.Latitude,
		Longitude:          input.Longitude,
		ContactName:        input.ContactName,
		ContactPhoneNumber: input.ContactPhoneNumber,
		ContactEmail:       input.ContactEmail,
		DateOfBirth:        lib.StringPointer(input.DateOfBirth),
		IDType:             (input.IDType),
		IDNumber:           input.IDNumber,
		IDExpiry:           input.IDExpiry,
		IDDocumentURL:      input.IDDocumentURL,
		RegistrationNumber: input.RegistrationNumber,
		LogoURL:            input.LogoURL,
		Description:        input.Description,
		WebsiteURL:         input.WebsiteURL,
		SupportEmail:       input.SupportEmail,
		SupportPhone:       input.SupportPhone,
	}

	if err := s.repo.Create(ctx, &clientApplication); err != nil {
		return nil, err
	}

	message := lib.CLIENT_APPLICATION_SUBMITTED_BODY
	message = strings.ReplaceAll(message, "{{owner_name}}", input.ContactName)

	go pkg.SendEmail(s.appCtx, pkg.SendEmailInput{
		Recipient: input.ContactEmail,
		Subject:   lib.CLIENT_APPLICATION_SUBMITTED_SUBJECT,
		TextBody:  message,
	})

	go pkg.SendSMS(s.appCtx, pkg.SendSMSInput{
		Recipient: input.ContactPhoneNumber,
		Message:   message,
	})

	return &clientApplication, nil
}

type RejectClientApplicationInput struct {
	ClientApplicationId string
	Reason              string
	AdminId             string
}

func (s *clientApplicationService) RejectClientApplication(ctx context.Context, input RejectClientApplicationInput) (*models.ClientApplication, error) {
	clientApplication, err := s.repo.GetByID(ctx, input.ClientApplicationId)
	if err != nil {
		return nil, err
	}

	clientApplication.Status = "ClientApplication.Status.Rejected"
	clientApplication.RejectedBecause = lib.StringPointer(input.Reason)
	clientApplication.RejectedById = lib.StringPointer(input.AdminId)

	if err := s.repo.UpdateClientApplication(ctx, clientApplication); err != nil {
		return nil, err
	}

	message := lib.CLIENT_APPLICATION_REJECTED_BODY
	message = strings.ReplaceAll(message, "{{owner_name}}", clientApplication.ContactName)
	message = strings.ReplaceAll(message, "{{rejection_reason}}", input.Reason)

	go pkg.SendEmail(s.appCtx, pkg.SendEmailInput{
		Recipient: clientApplication.ContactEmail,
		Subject:   lib.CLIENT_APPLICATION_REJECTED_SUBJECT,
		TextBody:  message,
	})

	go pkg.SendSMS(s.appCtx, pkg.SendSMSInput{
		Recipient: clientApplication.ContactPhoneNumber,
		Message:   message,
	})

	return clientApplication, nil
}

func (s *clientApplicationService) ApproveClientApplication(ctx context.Context, id string, adminId string) (*models.ClientApplication, error) {
	clientApplication, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if clientApplication.Status != "ClientApplication.Status.Pending" {
		return nil, fmt.Errorf("application is already approved")
	}

	transaction := s.appCtx.DB.Begin()

	clientApplication.Status = "ClientApplication.Status.Approved"
	clientApplication.ApprovedById = &adminId

	if err := s.repo.UpdateClientApplication(ctx, clientApplication); err != nil {
		transaction.Rollback()
		return nil, err
	}

	client := models.Client{
		Name:                clientApplication.Name,
		Type:                clientApplication.Type,
		SubType:             clientApplication.SubType,
		Address:             clientApplication.Address,
		Region:              clientApplication.Region,
		Country:             clientApplication.Country,
		City:                clientApplication.City,
		Longitude:           clientApplication.Longitude,
		Latitude:            clientApplication.Latitude,
		ClientApplicationId: clientApplication.ID.String(),
	}

	if err := transaction.WithContext(ctx).Create(&client).Error; err != nil {
		transaction.Rollback()
		return nil, err
	}

	// generate password
	password, err := gonanoid.Generate("abcdefghijklmnopqrstuvwxyz1234567890", 10)
	if err != nil {
		raven.CaptureError(err, map[string]string{
			"function": "ApproveClientApplication",
			"action":   "generating random password for OWNER client user",
		})
		return nil, err
	}

	user := models.ClientUser{
		ClientID:    client.ID.String(),
		Name:        clientApplication.ContactName,
		PhoneNumber: clientApplication.ContactPhoneNumber,
		Email:       clientApplication.ContactEmail,
		Password:    password,
		Role:        "OWNER",
	}

	if err := transaction.Create(&user).Error; err != nil {
		transaction.Rollback()
		return nil, err
	}

	if err := transaction.Commit().Error; err != nil {
		transaction.Rollback()
		return nil, err
	}

	message := lib.CLIENT_APPLICATION_ACCEPTED_BODY
	message = strings.ReplaceAll(message, "{{email}}", clientApplication.ContactEmail)
	message = strings.ReplaceAll(message, "{{password}}", password)

	go pkg.SendEmail(s.appCtx, pkg.SendEmailInput{
		Recipient: clientApplication.ContactEmail,
		Subject:   lib.CLIENT_APPLICATION_ACCEPTED_SUBJECT,
		TextBody:  message,
	})

	go pkg.SendSMS(s.appCtx, pkg.SendSMSInput{
		Recipient: clientApplication.ContactPhoneNumber,
		Message:   message,
	})

	return clientApplication, nil
}

func (s *clientApplicationService) ListClientApplications(ctx context.Context, filterQuery lib.FilterQuery, filters repository.ListClientApplicationsFilter) ([]models.ClientApplication, error) {
	clientApplications, err := s.repo.List(ctx, filterQuery, filters)
	if err != nil {
		return nil, err
	}

	return *clientApplications, nil
}

func (s *clientApplicationService) CountClientApplications(ctx context.Context, filterQuery lib.FilterQuery, filters repository.ListClientApplicationsFilter) (int64, error) {
	return s.repo.Count(ctx, filterQuery, filters)
}
