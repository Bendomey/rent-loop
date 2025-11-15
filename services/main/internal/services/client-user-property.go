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
	ListClientUserProperties(
		ctx context.Context,
		filterQuery repository.ListClientUserPropertiesFilter,
	) ([]models.ClientUserProperty, error)
	CountClientUserProperties(
		ctx context.Context,
		filterQuery repository.ListClientUserPropertiesFilter,
	) (int64, error)
	LinkClientUserToProperties(context context.Context, input LinkClientUserToPropertiesInput) error
	UnlinkByClientUserID(context context.Context, input repository.UnlinkClientUserFromPropertyQuery) error
	LinkPropertyToClientUsers(context context.Context, input LinkPropertyToClientUsersInput) error
	UnlinkPropertyFromClientUsers(context context.Context, input repository.UnlinkPropertyFromClientUsersQuery) error
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

type LinkClientUserToPropertiesInput struct {
	PropertyIDs  []string
	Role         string
	ClientUserID string
	CreatedByID  string
}

func (s *clientUserPropertyService) LinkClientUserToProperties(
	ctx context.Context,
	input LinkClientUserToPropertiesInput,
) error {
	clientUserPropertiesLink := make([]models.ClientUserProperty, 0, len(input.PropertyIDs))
	for _, propertyID := range input.PropertyIDs {
		clientUserProperty := models.ClientUserProperty{
			PropertyID:   propertyID,
			ClientUserID: input.ClientUserID,
			Role:         input.Role,
			CreatedByID:  &input.CreatedByID,
		}

		clientUserPropertiesLink = append(clientUserPropertiesLink, clientUserProperty)
	}

	clientUserPropertiesLinkErr := s.repo.BulkCreate(ctx, &clientUserPropertiesLink)
	if clientUserPropertiesLinkErr != nil {
		return pkg.InternalServerError(clientUserPropertiesLinkErr.Error(), &pkg.RentLoopErrorParams{
			Err: clientUserPropertiesLinkErr,
			Metadata: map[string]string{
				"function": "LinkClientUserToProperties",
				"action":   "creating client user properties link",
			},
		})
	}

	return nil
}

type LinkPropertyToClientUsersInput struct {
	ClientUserIDs []string
	Role          string
	PropertyID    string
	CreatedByID   string
}

func (s *clientUserPropertyService) LinkPropertyToClientUsers(
	ctx context.Context,
	input LinkPropertyToClientUsersInput,
) error {
	propertyClientUsersLink := make([]models.ClientUserProperty, 0, len(input.ClientUserIDs))
	for _, clientUserID := range input.ClientUserIDs {
		clientUserProperty := models.ClientUserProperty{
			ClientUserID: clientUserID,
			PropertyID:   input.PropertyID,
			Role:         input.Role,
			CreatedByID:  &input.CreatedByID,
		}

		propertyClientUsersLink = append(propertyClientUsersLink, clientUserProperty)
	}

	propertyClientUsersLinkErr := s.repo.BulkCreate(ctx, &propertyClientUsersLink)
	if propertyClientUsersLinkErr != nil {
		return pkg.InternalServerError(propertyClientUsersLinkErr.Error(), &pkg.RentLoopErrorParams{
			Err: propertyClientUsersLinkErr,
			Metadata: map[string]string{
				"function": "LinkPropertyToClientUsers",
				"action":   "creating property client users link",
			},
		})
	}

	return nil
}

func (s *clientUserPropertyService) UnlinkPropertyFromClientUsers(
	ctx context.Context,
	input repository.UnlinkPropertyFromClientUsersQuery,
) error {
	unlinkErr := s.repo.UnlinkPropertyFromClientUsers(ctx, input)
	if unlinkErr != nil {
		return pkg.InternalServerError(unlinkErr.Error(), &pkg.RentLoopErrorParams{
			Err: unlinkErr,
			Metadata: map[string]string{
				"function": "UnlinkPropertyFromClientUsers",
				"action":   "deleting client user property links",
			},
		})
	}

	return nil
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
				"action":   "deleting client user property links",
			},
		})
	}
	return nil
}

func (s *clientUserPropertyService) UnlinkByClientUserID(
	ctx context.Context,
	input repository.UnlinkClientUserFromPropertyQuery,
) error {
	unlinkErr := s.repo.DeleteByClientUserID(ctx, input)
	if unlinkErr != nil {
		return pkg.InternalServerError(unlinkErr.Error(), &pkg.RentLoopErrorParams{
			Err: unlinkErr,
			Metadata: map[string]string{
				"function": "UnlinkByClientUserID",
				"action":   "deleting client user property links",
			},
		})
	}

	return nil
}

func (s *clientUserPropertyService) ListClientUserProperties(
	ctx context.Context,
	filterQuery repository.ListClientUserPropertiesFilter,
) ([]models.ClientUserProperty, error) {
	clientUserProperties, err := s.repo.List(ctx, filterQuery)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListClientUserProperties",
				"action":   "listing client user properties",
			},
		})
	}

	return *clientUserProperties, nil
}

func (s *clientUserPropertyService) CountClientUserProperties(
	ctx context.Context,
	filterQuery repository.ListClientUserPropertiesFilter,
) (int64, error) {
	clientUserPropertiesCount, err := s.repo.Count(ctx, filterQuery)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountClientUserProperties",
				"action":   "counting client user properties",
			},
		})
	}

	return clientUserPropertiesCount, nil
}
