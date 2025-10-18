package services

import (
	"context"
	"fmt"

	// "github.com/Bendomey/goutilities/pkg/signjwt"
	// "github.com/Bendomey/goutilities/pkg/validatehash"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	// "github.com/dgrijalva/jwt-go"
	// "github.com/getsentry/raven-go"
	// gonanoid "github.com/matoous/go-nanoid"
	// "gorm.io/gorm"
)

type ClientApplicationService interface {
	GetClientApplication(ctx context.Context, clientApplicationId string) (*models.ClientApplication, error)
	CreateClientApplication(ctx context.Context, input CreateClientApplicationInput) (*models.ClientApplication, error)
	ListClientApplications(ctx context.Context, filterQuery lib.FilterQuery, filters repository.ListClientApplicationsFilter) ([]models.ClientApplication, error)
	CountClientApplications(ctx context.Context, filterQuery lib.FilterQuery, filters repository.ListClientApplicationsFilter) (int64, error)
	ApproveClientApplication(ctx context.Context, clientApplicationId string, adminId string) (*models.ClientApplication, error)
	RejectClientApplication(ctx context.Context, clientApplicationId string, reason string, adminId string) (*models.ClientApplication, error)
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
	Type               string // INDIVIDUAL | COMPANY
	SubType            string // INDIVIDUAL = LANDLORD; COMPANY = PROPERTY_MANAGER | DEVELOPER | AGENCY
	Name               string // company name or individual full name
	Address            string
	Country            string
	Region             string
	City               string
	Latitude           float64
	Longitude          float64
	ContactName        string
	ContactPhoneNumber string
	ContactEmail       string
	Status             string // ClientApplication.Status.Pending | ClientApplication.Status.Approved | ClientApplication.Status.Rejected
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
	Type                string  `json:"type" gorm:"not null;index;"`
	SubType             string  `json:"subType" gorm:"not null;index;"`
	Name                string  `json:"name" gorm:"not null;"`
	Address             string  `json:"address" gorm:"not null;"`
	Country             string  `json:"country" gorm:"not null;"`
	Region              string  `json:"region" gorm:"not null;"`
	City                string  `json:"city" gorm:"not null;"`
	Latitude            float64 `json:"latitude" gorm:"not null;"`
	Longitude           float64 `json:"longitude" gorm:"not null;"`
	ClientApplicationId string  `json:"clientApplicationId" gorm:"not null;"`
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
		Status:             "Pending",
		DateOfBirth:        StringPointer(input.DateOfBirth),
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

	return &clientApplication, nil
}

func StringPointer(s string) *string {
	return &s
}

func (s *clientApplicationService) RejectClientApplication(ctx context.Context, id string, reason string, adminId string) (*models.ClientApplication, error) {
	clientApplication, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	clientApplication.Status = "Rejected"
	clientApplication.RejectedBecause = &reason
	clientApplication.RejectedById = &adminId

	if err := s.repo.UpdateClientApplication(ctx, clientApplication); err != nil {
		return nil, err
	}

	return clientApplication, nil
}

func (s *clientApplicationService) ApproveClientApplication(ctx context.Context, id string, adminId string) (*models.ClientApplication, error) {
	clientApplication, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if clientApplication.Status != "Pending" {
		return nil, fmt.Errorf("application is already approved")
	}

	// Stage 0: Start transaction
	transaction := s.appCtx.DB.Begin()

	// Stage 1: Update client application as Approved
	clientApplication.Status = "Approved"
	clientApplication.ApprovedById = &adminId

	if err := s.repo.UpdateClientApplication(ctx, clientApplication); err != nil {
		transaction.Rollback()
		return nil, err
	}

	// Stage 2: Create client
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

	// Stage 3. Create the user tied to this client
	user := models.ClientUser{
		ClientID:    client.ID.String(),
		Name:        clientApplication.ContactName,
		PhoneNumber: clientApplication.ContactPhoneNumber,
		Email:       clientApplication.ContactEmail,
		Password:    "password",
		Role:        "OWNER",
		Status:      "Inactive",
	}

	if err := transaction.Create(&user).Error; err != nil {
		transaction.Rollback()
		return nil, err
	}

	// Stage 4: Commit transaction
	if err := transaction.Commit().Error; err != nil {
		transaction.Rollback()
		return nil, err
	}

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
