package services

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"gorm.io/gorm"
)

type UpdateClientInput struct {
	ClientID           string
	Type               *string
	SubType            *string
	Name               *string
	Description        lib.Optional[string]
	RegistrationNumber lib.Optional[string]
	WebsiteUrl         lib.Optional[string]
	SupportPhone       lib.Optional[string]
	SupportEmail       lib.Optional[string]
	Address            *string
	Country            *string
	Region             *string
	City               *string
	Latitude           *float64
	Longitude          *float64
	// individual identity fields
	IDType        lib.Optional[string]
	IDNumber      lib.Optional[string]
	IDExpiry      lib.Optional[string]
	IDDocumentURL lib.Optional[string]
}

type ClientService interface {
	GetClient(ctx context.Context, clientId string) (*models.Client, error)
	CreateClient(ctx context.Context, client *models.Client) error
	UpdateClient(ctx context.Context, input UpdateClientInput) (*models.Client, error)
}

type clientService struct {
	appCtx pkg.AppContext
	repo   repository.ClientRepository
}

func NewClientService(
	appCtx pkg.AppContext,
	repo repository.ClientRepository,
) ClientService {
	return &clientService{appCtx, repo}
}

func (s *clientService) GetClient(ctx context.Context, clientId string) (*models.Client, error) {
	client, err := s.repo.GetByID(ctx, clientId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("ClientNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetClient",
				"action":   "fetching client by ID",
			},
		})
	}

	return client, nil
}

func (s *clientService) CreateClient(ctx context.Context, client *models.Client) error {
	if err := s.repo.Create(ctx, client); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateClient",
				"action":   "creating client",
			},
		})
	}

	return nil
}

func (s *clientService) UpdateClient(ctx context.Context, input UpdateClientInput) (*models.Client, error) {
	client, err := s.repo.GetByID(ctx, input.ClientID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("ClientNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "UpdateClient",
				"action":   "fetching client by ID",
			},
		})
	}

	if input.Name != nil {
		client.Name = *input.Name
	}

	if input.Type != nil {
		prevType := client.Type
		client.Type = *input.Type

		// Clear fields that don't apply to the new type
		if prevType != *input.Type {
			if *input.Type == "INDIVIDUAL" {
				client.Description = nil
				client.RegistrationNumber = nil
				client.WebsiteUrl = nil
				client.SupportPhone = nil
				client.SupportEmail = nil
				client.SubType = "LANDLORD"
			}
		}
	}

	if input.SubType != nil {
		client.SubType = *input.SubType
	}

	if input.Description.IsSet {
		client.Description = input.Description.Ptr()
	}

	if input.RegistrationNumber.IsSet {
		client.RegistrationNumber = input.RegistrationNumber.Ptr()
	}

	if input.WebsiteUrl.IsSet {
		client.WebsiteUrl = input.WebsiteUrl.Ptr()
	}

	if input.SupportPhone.IsSet {
		client.SupportPhone = input.SupportPhone.Ptr()
	}

	if input.SupportEmail.IsSet {
		client.SupportEmail = input.SupportEmail.Ptr()
	}

	if input.Address != nil {
		client.Address = *input.Address
	}

	if input.Country != nil {
		client.Country = *input.Country
	}

	if input.Region != nil {
		client.Region = *input.Region
	}

	if input.City != nil {
		client.City = *input.City
	}

	if input.Latitude != nil {
		client.Latitude = *input.Latitude
	}

	if input.Longitude != nil {
		client.Longitude = *input.Longitude
	}

	if input.IDType.IsSet {
		client.IDType = input.IDType.Ptr()
	}

	if input.IDNumber.IsSet {
		client.IDNumber = input.IDNumber.Ptr()
	}

	if input.IDExpiry.IsSet {
		client.IDExpiry = input.IDExpiry.Ptr()
	}

	if input.IDDocumentURL.IsSet {
		client.IDDocumentURL = input.IDDocumentURL.Ptr()
	}

	if updateErr := s.repo.Update(ctx, client); updateErr != nil {
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateErr,
			Metadata: map[string]string{
				"function": "UpdateClient",
				"action":   "updating client",
			},
		})
	}

	return client, nil
}
