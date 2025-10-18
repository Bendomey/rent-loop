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

type ClientService interface {
	GetClient(ctx context.Context, clientId string) (*models.Client, error)
	CreateClient(ctx context.Context, input CreateClientInput) (*models.Client, error)
	ListClients(ctx context.Context, filterQuery lib.FilterQuery, filters repository.ListClientsFilter) ([]models.Client, error)
	CountClients(ctx context.Context, filterQuery lib.FilterQuery, filters repository.ListClientsFilter) (int64, error)
}

type clientService struct {
	appCtx pkg.AppContext
	repo   repository.ClientRepository
}

func NewClientService(appCtx pkg.AppContext, repo repository.ClientRepository) ClientService {
	return &clientService{appCtx, repo}
}

func (s *clientService) GetClient(ctx context.Context, clientId string) (*models.Client, error) {
	return s.repo.GetByID(ctx, clientId)
}

type CreateClientInput struct {
	Type                string // INDIVIDUAL | COMPANY
	SubType             string // INDIVIDUAL = LANDLORD; COMPANY = PROPERTY_MANAGER | DEVELOPER | AGENCY
	Name                string // company name or individual full name
	Address             string
	Country             string
	Region              string
	City                string
	Latitude            float64
	Longitude           float64
	ClientApplicationId string
}

func (s *clientService) CreateClient(ctx context.Context, input CreateClientInput) (*models.Client, error) {

	client := models.Client{
		Type:                input.Type,
		SubType:             input.SubType,
		Name:                input.Name,
		Address:             input.Address,
		Country:             input.Country,
		Region:              input.Region,
		City:                input.City,
		Latitude:            input.Latitude,
		Longitude:           input.Longitude,
		ClientApplicationId: input.ClientApplicationId,
	}

	if err := s.repo.Create(ctx, &client); err != nil {
		return nil, err
	}

	return &client, nil
}

func (s *clientService) ListClients(ctx context.Context, filterQuery lib.FilterQuery, filters repository.ListClientsFilter) ([]models.Client, error) {
	clients, err := s.repo.List(ctx, filterQuery, filters)
	if err != nil {
		return nil, err
	}

	return *clients, nil
}

func (s *clientService) CountClients(ctx context.Context, filterQuery lib.FilterQuery, filters repository.ListClientsFilter) (int64, error) {
	return s.repo.Count(ctx, filterQuery, filters)
}
