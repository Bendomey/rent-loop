package services

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type ClientUserPropertyService interface {
	LinkClientUserProperty(
		context context.Context,
		input CreateClientUserPropertyInput,
	) (*models.ClientUserProperty, error)
	UnlinkByPropertyID(context context.Context, propertyID string) error
}

type clientUserPropertyService struct {
	appCtx pkg.AppContext
	repo   repository.ClientUserPropertyRepository
}

func NewClientUserPropertyService(
	appCtx pkg.AppContext,
	repo repository.ClientUserPropertyRepository,
) ClientUserPropertyService {
	return &clientUserPropertyService{appCtx: appCtx, repo: repo}
}

type CreateClientUserPropertyInput struct {
	PropertyID   string
	ClientUserID string
	Role         string
	CreatedByID  *string
}

func (s *clientUserPropertyService) LinkClientUserProperty(
	ctx context.Context,
	input CreateClientUserPropertyInput,
) (*models.ClientUserProperty, error) {
	clientUserProperty := models.ClientUserProperty{
		PropertyID:   input.PropertyID,
		ClientUserID: input.ClientUserID,
		Role:         input.Role,
		CreatedByID:  input.CreatedByID,
	}

	clientUserPropertyErr := s.repo.Create(ctx, &clientUserProperty)
	if clientUserPropertyErr != nil {
		return nil, pkg.InternalServerError(clientUserPropertyErr.Error(), &pkg.RentLoopErrorParams{
			Err: clientUserPropertyErr,
			Metadata: map[string]string{
				"function": "LinkClientUserProperty",
				"action":   "creating client user property link",
			},
		})
	}

	return &clientUserProperty, nil
}

func (s *clientUserPropertyService) UnlinkByPropertyID(
	ctx context.Context,
	propertyID string,
) error {
	unlinkErr := s.repo.DeleteByPropertyID(ctx, propertyID)
	if unlinkErr != nil {
		return pkg.InternalServerError(unlinkErr.Error(), &pkg.RentLoopErrorParams{
			Err: unlinkErr,
			Metadata: map[string]string{
				"function": "UnlinkByPropertyID",
				"action":   " deleting client user property links",
			},
		})
	}
	return nil
}
