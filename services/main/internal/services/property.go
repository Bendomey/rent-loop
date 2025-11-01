package services

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/getsentry/raven-go"
	"github.com/lib/pq"
)

type PropertyService interface {
	CreateProperty(context context.Context, input CreatePropertyInput) (*models.Property, error)
	ListProperties(
		context context.Context,
		filterQuery repository.ListPropertiesFilter,
	) ([]models.Property, error)
	CountProperties(
		context context.Context,
		filterQuery repository.ListPropertiesFilter,
	) (int64, error)
}

type propertyService struct {
	appCtx                 pkg.AppContext
	repo                   repository.PropertyRepository
	clientUserRepo         repository.ClientUserRepository
	clientUserPropertyRepo repository.ClientUserPropertyRepository
}

type PropertyServiceDependencies struct {
	AppCtx                 pkg.AppContext
	Repo                   repository.PropertyRepository
	ClientUserRepo         repository.ClientUserRepository
	ClientUserPropertyRepo repository.ClientUserPropertyRepository
}

func NewPropertyService(deps PropertyServiceDependencies) PropertyService {
	return &propertyService{
		appCtx:                 deps.AppCtx,
		repo:                   deps.Repo,
		clientUserRepo:         deps.ClientUserRepo,
		clientUserPropertyRepo: deps.ClientUserPropertyRepo,
	}
}

type CreatePropertyInput struct {
	Type        string
	Status      string
	Name        string
	Description *string
	Images      []string
	Tags        []string
	Latitude    float64
	Longitude   float64
	Address     string
	Country     string
	Region      string
	City        string
	GPSAddress  *string
	ClientID    string
	CreatedByID string
}

func (s *propertyService) CreateProperty(
	ctx context.Context,
	input CreatePropertyInput,
) (*models.Property, error) {
	slug, err := lib.GenerateSlug(input.Name)
	if err != nil {
		raven.CaptureError(err, map[string]string{
			"function": "CreateProperty",
			"action":   "Generating a slug",
		})
		return nil, err
	}

	var images pq.StringArray
	if input.Images != nil {
		images = pq.StringArray(input.Images)
	} else {
		images = pq.StringArray{}
	}

	var tags pq.StringArray
	if input.Tags != nil {
		tags = pq.StringArray(input.Tags)
	} else {
		tags = pq.StringArray{}
	}

	property := models.Property{
		Type:        input.Type,
		Status:      input.Status,
		Name:        input.Name,
		Slug:        slug,
		Description: input.Description,
		Images:      images,
		Tags:        tags,
		Latitude:    input.Latitude,
		Longitude:   input.Longitude,
		Address:     input.Address,
		Country:     input.Country,
		Region:      input.Region,
		City:        input.City,
		GPSAddress:  input.GPSAddress,
		ClientID:    input.ClientID,
		CreatedByID: input.CreatedByID,
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	if err := s.repo.Create(transCtx, &property); err != nil {
		transaction.Rollback()
		return nil, err
	}

	clientUserOwner, clientUserErr := s.clientUserRepo.GetByQuery(
		ctx,
		map[string]any{"client_id": input.ClientID, "role": "OWNER"},
	)
	if clientUserErr != nil {
		transaction.Rollback()
		return nil, clientUserErr
	}

	clientUserProperty := models.ClientUserProperty{
		PropertyID:   property.ID.String(),
		ClientUserID: clientUserOwner.ID.String(),
		Role:         "MANAGER",
		CreatedByID:  &input.CreatedByID,
	}

	linkPropertyErr := s.clientUserPropertyRepo.Create(transCtx, &clientUserProperty)
	if linkPropertyErr != nil {
		transaction.Rollback()
		return nil, linkPropertyErr
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		transaction.Rollback()
		return nil, commitErr
	}
	return &property, nil
}

func (s *propertyService) ListProperties(
	ctx context.Context,
	filterQuery repository.ListPropertiesFilter,
) ([]models.Property, error) {
	properties, err := s.repo.List(ctx, filterQuery)
	if err != nil {
		return nil, err
	}
	return *properties, nil
}

func (s *propertyService) CountProperties(
	ctx context.Context,
	filterQuery repository.ListPropertiesFilter,
) (int64, error) {
	propertiesCount, err := s.repo.Count(ctx, filterQuery)
	if err != nil {
		return 0, err
	}

	return propertiesCount, nil
}
