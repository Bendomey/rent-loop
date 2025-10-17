package services

import (
	"context"
	// "errors"

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
	Type    string    // INDIVIDUAL | COMPANY
	SubType string // INDIVIDUAL = LANDLORD; COMPANY = PROPERTY_MANAGER | DEVELOPER | AGENCY
	Name    string           // company name or individual full name
	Address   string 
	Country   string 
	Region    string 
	City      string
	Latitude  float64
	Longitude float64 
	ContactName        string
	ContactPhoneNumber string
	ContactEmail       string
	Status string // ClientApplication.Status.Pending | ClientApplication.Status.Approved | ClientApplication.Status.Rejected
}

func (s *clientApplicationService) CreateClientApplication(ctx context.Context, input CreateClientApplicationInput) (*models.ClientApplication, error) {

	clientApplication := models.ClientApplication{
		Type: input.Type,
		SubType: input.SubType,
		Name: input.Name,
		Address: input.Address,
		Country: input.Country,
		Region: input.Region,
		City: input.City,
		Latitude: input.Latitude,
		Longitude: input.Longitude, 
		ContactName: input.ContactName,      
		ContactPhoneNumber: input.ContactPhoneNumber,
		ContactEmail: input.ContactEmail,       
		Status: "Pending", 
	}

	if err := s.repo.Create(ctx, &clientApplication); err != nil {
		return nil, err
	}

	return &clientApplication, nil
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
