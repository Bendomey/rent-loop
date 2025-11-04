package services

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/getsentry/raven-go"
	"github.com/lib/pq"
	"gorm.io/gorm"
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
	GetProperty(
		context context.Context,
		query repository.GetPropertyQuery,
	) (*models.Property, error)
	UpdateProperty(context context.Context, input UpdatePropertyInput) (*models.Property, error)
	DeleteProperty(context context.Context, propertyID string) error
}

type propertyService struct {
	appCtx                    pkg.AppContext
	repo                      repository.PropertyRepository
	clientUserService         ClientUserService
	clientUserPropertyService ClientUserPropertyService
	unitService               UnitService
}

type PropertyServiceDependencies struct {
	AppCtx                    pkg.AppContext
	Repo                      repository.PropertyRepository
	ClientUserService         ClientUserService
	ClientUserPropertyService ClientUserPropertyService
	UnitService               UnitService
}

func NewPropertyService(deps PropertyServiceDependencies) PropertyService {
	return &propertyService{
		appCtx:                    deps.AppCtx,
		repo:                      deps.Repo,
		clientUserService:         deps.ClientUserService,
		clientUserPropertyService: deps.ClientUserPropertyService,
		unitService:               deps.UnitService,
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

	clientUserOwner, clientUserErr := s.clientUserService.GetClientUserByQuery(
		ctx,
		map[string]any{"client_id": input.ClientID, "role": "OWNER"},
	)
	if clientUserErr != nil {
		transaction.Rollback()
		return nil, clientUserErr
	}

	clientUserProperty := CreateClientUserPropertyInput{
		PropertyID:   property.ID.String(),
		ClientUserID: clientUserOwner.ID.String(),
		Role:         "MANAGER",
		CreatedByID:  &input.CreatedByID,
	}

	_, linkPropertyErr := s.clientUserPropertyService.LinkClientUserProperty(
		transCtx,
		clientUserProperty,
	)
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

func (s *propertyService) GetProperty(
	ctx context.Context,
	query repository.GetPropertyQuery,
) (*models.Property, error) {
	property, err := s.repo.GetByID(ctx, query)
	if err != nil {
		return nil, err
	}

	return property, nil
}

type UpdatePropertyInput struct {
	PropertyID  string
	ClientID    string
	Name        *string
	Description *string
	Images      *[]string
	Tags        *[]string
	Latitude    *float64
	Longitude   *float64
	Address     *string
	Country     *string
	Region      *string
	City        *string
	GPSAddress  *string
}

func (s *propertyService) UpdateProperty(
	context context.Context,
	input UpdatePropertyInput,
) (*models.Property, error) {
	property, err := s.repo.GetByID(context, repository.GetPropertyQuery{ID: input.PropertyID})
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			raven.CaptureError(err, nil)
		}
		return nil, err
	}

	if input.ClientID != property.ClientID {
		return nil, errors.New("client id mismatch")
	}

	if input.Name != nil {
		property.Name = *input.Name
	}

	property.Description = input.Description

	if input.Images != nil {
		property.Images = *input.Images
	}

	if input.Tags != nil {
		property.Tags = *input.Tags
	}

	if input.Latitude != nil {
		property.Latitude = *input.Latitude
	}

	if input.Longitude != nil {
		property.Longitude = *input.Longitude
	}

	if input.Address != nil {
		property.Address = *input.Address
	}

	if input.Country != nil {
		property.Country = *input.Country
	}

	if input.Region != nil {
		property.Region = *input.Region
	}

	if input.City != nil {
		property.City = *input.City
	}

	property.GPSAddress = input.GPSAddress

	if updateErr := s.repo.Update(context, property); updateErr != nil {
		return nil, updateErr
	}

	return property, nil
}

func (s *propertyService) DeleteProperty(context context.Context, propertyID string) error {
	property, propertyErr := s.repo.GetByID(context, repository.GetPropertyQuery{ID: propertyID})
	if propertyErr != nil {
		if !errors.Is(propertyErr, gorm.ErrRecordNotFound) {
			raven.CaptureError(propertyErr, nil)
		}
		return propertyErr
	}

	unitsCount, unitErr := s.unitService.CountUnits(
		context,
		repository.ListUnitsFilter{PropertyID: property.ID.String()},
	)
	if unitErr != nil {
		if !errors.Is(unitErr, gorm.ErrRecordNotFound) {
			return unitErr
		}
	}

	if unitsCount > 0 {
		return errors.New("property is linked to a unit")
	}

	tx := s.appCtx.DB.Begin()

	transCtx := lib.WithTransaction(context, tx)

	unlinkPropertyErr := s.clientUserPropertyService.UnlinkByPropertyID(transCtx, propertyID)
	if unlinkPropertyErr != nil {
		tx.Rollback()
		return unlinkPropertyErr
	}

	deletePropertyErr := s.repo.Delete(transCtx, propertyID)
	if deletePropertyErr != nil {
		tx.Rollback()
		return deletePropertyErr
	}

	commitErr := tx.Commit().Error
	if commitErr != nil {
		tx.Rollback()
		return commitErr
	}

	return nil
}
