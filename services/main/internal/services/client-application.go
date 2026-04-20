package services

import (
	"context"
	"errors"
	"strings"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	gonanoid "github.com/matoous/go-nanoid"
	"gorm.io/gorm"
)

type ClientApplicationService interface {
	GetClientApplication(ctx context.Context, clientApplicationId string) (*models.ClientApplication, error)
	CreateClientApplication(ctx context.Context, input CreateClientApplicationInput) (*models.ClientApplication, error)
	ListClientApplications(
		ctx context.Context,
		filters repository.ListClientApplicationsFilter,
	) ([]models.ClientApplication, error)
	CountClientApplications(ctx context.Context, filters repository.ListClientApplicationsFilter) (int64, error)
	ApproveClientApplication(
		ctx context.Context,
		input ApproveClientApplicationInput,
	) (*models.ClientApplication, error)
	RejectClientApplication(ctx context.Context, input RejectClientApplicationInput) (*models.ClientApplication, error)
}

type clientApplicationService struct {
	appCtx            pkg.AppContext
	repo              repository.ClientApplicationRepository
	clientService     ClientService
	clientUserService ClientUserService
	userService       UserService
}

type ClientApplicationServiceDeps struct {
	AppCtx            pkg.AppContext
	Repo              repository.ClientApplicationRepository
	ClientService     ClientService
	ClientUserService ClientUserService
	UserService       UserService
}

func NewClientApplicationService(deps ClientApplicationServiceDeps) ClientApplicationService {
	return &clientApplicationService{
		appCtx:            deps.AppCtx,
		repo:              deps.Repo,
		clientService:     deps.ClientService,
		clientUserService: deps.ClientUserService,
		userService:       deps.UserService,
	}
}

func (s *clientApplicationService) GetClientApplication(
	ctx context.Context,
	clientApplicationId string,
) (*models.ClientApplication, error) {
	clientApplication, err := s.repo.GetByID(ctx, clientApplicationId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("ClientApplicationNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetClientApplication",
				"action":   "fetching client application by ID",
			},
		})
	}

	return clientApplication, nil
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
	DateOfBirth        *string
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

func (s *clientApplicationService) CreateClientApplication(
	ctx context.Context,
	input CreateClientApplicationInput,
) (*models.ClientApplication, error) {
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
		DateOfBirth:        input.DateOfBirth,
		IDType:             input.IDType,
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
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateClientApplication",
				"action":   "creating new client application",
			},
		})
	}

	message := lib.CLIENT_APPLICATION_SUBMITTED_BODY
	message = strings.ReplaceAll(message, "{{owner_name}}", input.ContactName)

	smsMessage := lib.CLIENT_APPLICATION_SUBMITTED_SMS_BODY
	smsMessage = strings.ReplaceAll(smsMessage, "{{owner_name}}", input.ContactName)

	go pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
		Recipient: input.ContactEmail,
		Subject:   lib.CLIENT_APPLICATION_SUBMITTED_SUBJECT,
		TextBody:  message,
	})

	adminMessage := lib.CLIENT_APPLICATION_ADMIN_NOTIFICATION_BODY
	adminMessage = strings.ReplaceAll(adminMessage, "{{applicant_name}}", input.ContactName)
	adminMessage = strings.ReplaceAll(adminMessage, "{{applicant_email}}", input.ContactEmail)
	adminMessage = strings.ReplaceAll(adminMessage, "{{applicant_phone}}", input.ContactPhoneNumber)
	adminMessage = strings.ReplaceAll(adminMessage, "{{applicant_type}}", input.Type)
	adminMessage = strings.ReplaceAll(adminMessage, "{{applicant_sub_type}}", input.SubType)
	adminMessage = strings.ReplaceAll(adminMessage, "{{applicant_city}}", input.City)
	adminMessage = strings.ReplaceAll(adminMessage, "{{applicant_region}}", input.Region)

	go pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
		Recipient: "rentloopapp@gmail.com",
		Subject:   lib.CLIENT_APPLICATION_ADMIN_NOTIFICATION_SUBJECT,
		TextBody:  adminMessage,
	})

	go s.appCtx.Clients.GatekeeperAPI.SendSMS(ctx, gatekeeper.SendSMSInput{
		Recipient: input.ContactPhoneNumber,
		Message:   smsMessage,
	})

	return &clientApplication, nil
}

type RejectClientApplicationInput struct {
	ClientApplicationId string
	Reason              string
	AdminId             string
}

func (s *clientApplicationService) RejectClientApplication(
	ctx context.Context,
	input RejectClientApplicationInput,
) (*models.ClientApplication, error) {
	clientApplication, err := s.repo.GetByID(ctx, input.ClientApplicationId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("ClientApplicationNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "RejectClientApplication",
				"action":   "fetching client application by ID",
			},
		})
	}

	clientApplication.Status = "ClientApplication.Status.Rejected"
	clientApplication.RejectedBecause = &input.Reason
	clientApplication.RejectedById = &input.AdminId

	if err := s.repo.UpdateClientApplication(ctx, clientApplication); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "RejectClientApplication",
				"action":   "rejecting client application",
			},
		})
	}

	r := strings.NewReplacer(
		"{{owner_name}}", clientApplication.ContactName,
		"{{rejection_reason}}", input.Reason,
	)
	message := r.Replace(lib.CLIENT_APPLICATION_REJECTED_BODY)
	smsMessage := r.Replace(lib.CLIENT_APPLICATION_REJECTED_SMS_BODY)

	go pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
		Recipient: clientApplication.ContactEmail,
		Subject:   lib.CLIENT_APPLICATION_REJECTED_SUBJECT,
		TextBody:  message,
	})

	go s.appCtx.Clients.GatekeeperAPI.SendSMS(ctx, gatekeeper.SendSMSInput{
		Recipient: clientApplication.ContactPhoneNumber,
		Message:   smsMessage,
	})

	return clientApplication, nil
}

type ApproveClientApplicationInput struct {
	ID      string
	AdminID string
}

func (s *clientApplicationService) ApproveClientApplication(
	ctx context.Context,
	input ApproveClientApplicationInput,
) (*models.ClientApplication, error) {
	clientApplication, err := s.repo.GetByID(ctx, input.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("ClientApplicationNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ApproveClientApplication",
				"action":   "fetching client application by ID",
			},
		})
	}

	if clientApplication.Status != "ClientApplication.Status.Pending" {
		return nil, pkg.BadRequestError("ApplicationAlreadyApproved", nil)
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)
	defer transaction.Rollback()

	clientApplication.Status = "ClientApplication.Status.Approved"
	clientApplication.ApprovedById = &input.AdminID

	if err := s.repo.UpdateClientApplication(transCtx, clientApplication); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ApproveClientApplication",
				"action":   "approving client application",
			},
		})
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
		WebsiteUrl:          clientApplication.WebsiteURL,
		SupportPhone:        clientApplication.SupportPhone,
		SupportEmail:        clientApplication.SupportEmail,
		IDType:              clientApplication.IDType,
		IDNumber:            clientApplication.IDNumber,
		IDExpiry:            clientApplication.IDExpiry,
		IDDocumentURL:       clientApplication.IDDocumentURL,
		ClientApplicationId: clientApplication.ID.String(),
	}

	if err := s.clientService.CreateClient(transCtx, &client); err != nil {
		return nil, err
	}

	// generate password
	password, err := gonanoid.Generate("abcdefghijklmnopqrstuvwxyz1234567890", 10)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ApproveClientApplication",
				"action":   "generating random password for OWNER user",
			},
		})
	}

	ownerUser := models.User{
		Name:        clientApplication.ContactName,
		PhoneNumber: clientApplication.ContactPhoneNumber,
		Email:       clientApplication.ContactEmail,
		Password:    password,
	}

	ownerUserCreated, err := s.userService.InsertUser(transCtx, &ownerUser)
	if err != nil {
		return nil, err
	}

	user := models.ClientUser{
		UserID:   ownerUser.ID.String(),
		ClientID: client.ID.String(),
		Role:     "OWNER",
	}

	if err := s.clientUserService.InsertClientUser(transCtx, &user); err != nil {
		return nil, err
	}

	if err := transaction.Commit().Error; err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ApproveClientApplication",
				"action":   "committing transaction",
			},
		})
	}

	if ownerUserCreated {
		r := strings.NewReplacer(
			"{{owner_name}}", clientApplication.ContactName,
			"{{email}}", clientApplication.ContactEmail,
			"{{password}}", password,
		)
		go pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
			Recipient: clientApplication.ContactEmail,
			Subject:   lib.CLIENT_APPLICATION_ACCEPTED_SUBJECT,
			TextBody:  r.Replace(lib.CLIENT_APPLICATION_ACCEPTED_BODY),
		})
		go s.appCtx.Clients.GatekeeperAPI.SendSMS(ctx, gatekeeper.SendSMSInput{
			Recipient: clientApplication.ContactPhoneNumber,
			Message:   r.Replace(lib.CLIENT_APPLICATION_ACCEPTED_SMS_BODY),
		})
	} else {
		r := strings.NewReplacer(
			"{{name}}", clientApplication.ContactName,
			"{{client_name}}", client.Name,
		)
		go pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
			Recipient: clientApplication.ContactEmail,
			Subject:   lib.CLIENT_USER_ADDED_EXISTING_ACCOUNT_SUBJECT,
			TextBody:  r.Replace(lib.CLIENT_USER_ADDED_EXISTING_ACCOUNT_BODY),
		})
		go s.appCtx.Clients.GatekeeperAPI.SendSMS(ctx, gatekeeper.SendSMSInput{
			Recipient: clientApplication.ContactPhoneNumber,
			Message:   r.Replace(lib.CLIENT_USER_ADDED_EXISTING_ACCOUNT_SMS_BODY),
		})
	}

	return clientApplication, nil
}

func (s *clientApplicationService) ListClientApplications(
	ctx context.Context,
	filters repository.ListClientApplicationsFilter,
) ([]models.ClientApplication, error) {
	clientApplications, err := s.repo.List(ctx, filters)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListClientApplications",
				"action":   "listing client applications",
			},
		})
	}

	return *clientApplications, nil
}

func (s *clientApplicationService) CountClientApplications(
	ctx context.Context,
	filters repository.ListClientApplicationsFilter,
) (int64, error) {
	count, err := s.repo.Count(ctx, filters)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountClientApplications",
				"action":   "counting client applications",
			},
		})
	}
	return count, nil
}
