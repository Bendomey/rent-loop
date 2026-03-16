package services

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"gorm.io/gorm"
)

type ClientService interface {
	GetClient(ctx context.Context, clientId string) (*models.Client, error)
	CreateClient(ctx context.Context, client *models.Client) error
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
