package services

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
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
	DeleteProperty(context context.Context, input DeletePropertyInput) error
	GetPropertyBySlug(
		context context.Context,
		query repository.GetPropertyBySlugQuery,
	) (*models.Property, error)
}

type propertyService struct {
	appCtx                    pkg.AppContext
	repo                      repository.PropertyRepository
	clientUserService         ClientUserService
	clientUserPropertyService ClientUserPropertyService
	unitService               UnitService
	propertyBlockService      PropertyBlockService
	leaseRepo                 repository.LeaseRepository
}

type PropertyServiceDependencies struct {
	AppCtx                    pkg.AppContext
	Repo                      repository.PropertyRepository
	ClientUserService         ClientUserService
	ClientUserPropertyService ClientUserPropertyService
	UnitService               UnitService
	PropertyBlockService      PropertyBlockService
	LeaseRepo                 repository.LeaseRepository
}

func NewPropertyService(deps PropertyServiceDependencies) PropertyService {
	return &propertyService{
		appCtx:                    deps.AppCtx,
		repo:                      deps.Repo,
		clientUserService:         deps.ClientUserService,
		clientUserPropertyService: deps.ClientUserPropertyService,
		unitService:               deps.UnitService,
		propertyBlockService:      deps.PropertyBlockService,
		leaseRepo:                 deps.LeaseRepo,
	}
}

type CreatePropertyInput struct {
	Type        string
	Status      string
	Name        string
	Description *string
	Images      []string
	Tags        []string
	Modes       []string
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

	var modes pq.StringArray
	if input.Modes != nil {
		modes = pq.StringArray(input.Modes)
	} else {
		modes = pq.StringArray{}
	}

	property := models.Property{
		Type:        input.Type,
		Status:      input.Status,
		Name:        input.Name,
		Description: input.Description,
		Images:      images,
		Tags:        tags,
		Modes:       modes,
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
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateProperty",
				"action":   "creating new property",
			},
		})
	}

	clientUserOwner, clientUserErr := s.clientUserService.GetClientUserByQuery(
		ctx,
		map[string]any{"client_id": input.ClientID, "role": "OWNER"},
	)
	if clientUserErr != nil {
		transaction.Rollback()
		return nil, clientUserErr
	}

	ownerClientUserProperty := CreateClientUserPropertyInput{
		PropertyID:   property.ID.String(),
		ClientUserID: clientUserOwner.ID.String(),
		Role:         "MANAGER",
		CreatedByID:  &input.CreatedByID,
	}

	_, linkPropertyErr := s.clientUserPropertyService.LinkClientUserProperty(
		transCtx,
		ownerClientUserProperty,
	)
	if linkPropertyErr != nil {
		transaction.Rollback()
		return nil, linkPropertyErr
	}

	if clientUserOwner.ID.String() != input.CreatedByID {
		creatorClientUserProperty := CreateClientUserPropertyInput{
			PropertyID:   property.ID.String(),
			ClientUserID: input.CreatedByID,
			Role:         "MANAGER",
			CreatedByID:  &input.CreatedByID,
		}

		_, linkPropertyErr := s.clientUserPropertyService.LinkClientUserProperty(
			transCtx,
			creatorClientUserProperty,
		)
		if linkPropertyErr != nil {
			transaction.Rollback()
			return nil, linkPropertyErr
		}
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"function": "CreateProperty",
				"action":   "committing transaction",
			},
		})
	}
	return &property, nil
}

func (s *propertyService) ListProperties(
	ctx context.Context,
	filterQuery repository.ListPropertiesFilter,
) ([]models.Property, error) {
	properties, err := s.repo.List(ctx, filterQuery)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListProperties",
				"action":   "listing properties",
			},
		})
	}

	return *properties, nil
}

func (s *propertyService) CountProperties(
	ctx context.Context,
	filterQuery repository.ListPropertiesFilter,
) (int64, error) {
	propertiesCount, err := s.repo.Count(ctx, filterQuery)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountProperties",
				"action":   "counting properties",
			},
		})
	}

	return propertiesCount, nil
}

func (s *propertyService) GetProperty(
	ctx context.Context,
	query repository.GetPropertyQuery,
) (*models.Property, error) {
	property, err := s.repo.GetByID(ctx, query)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("PropertyNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetProperty",
				"action":   "fetching property by ID",
			},
		})
	}

	return property, nil
}

type UpdatePropertyInput struct {
	PropertyID  string
	ClientID    string
	Name        *string
	Description lib.Optional[string]
	Images      lib.Optional[[]string]
	Tags        lib.Optional[[]string]
	Modes       lib.Optional[[]string]
	Latitude    *float64
	Longitude   *float64
	Address     *string
	Country     *string
	Region      *string
	City        *string
	GPSAddress  lib.Optional[string]
	Type        *string
	Status      *string
}

func (s *propertyService) UpdateProperty(
	context context.Context,
	input UpdatePropertyInput,
) (*models.Property, error) {
	property, err := s.repo.GetByQuery(
		context,
		map[string]any{"id": input.PropertyID, "client_id": input.ClientID},
	)
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "UpdateProperty",
					"action":   "get property by id",
				},
			})
		}

		return nil, pkg.NotFoundError("PropertyNotFound", &pkg.RentLoopErrorParams{
			Err: err,
		})
	}

	if input.Name != nil {
		property.Name = *input.Name
	}

	if input.Description.IsSet {
		property.Description = input.Description.Value
	}

	if input.Images.IsSet {
		if input.Images.Value != nil {
			property.Images = pq.StringArray(*input.Images.Value)
		} else {
			property.Images = pq.StringArray{}
		}
	}

	if input.Tags.IsSet {
		if input.Tags.Value != nil {
			property.Tags = pq.StringArray(*input.Tags.Value)
		} else {
			property.Tags = pq.StringArray{}
		}
	}

	if input.Modes.IsSet {
		if input.Modes.Value != nil {
			property.Modes = pq.StringArray(*input.Modes.Value)
		} else {
			property.Modes = pq.StringArray{}
		}
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

	if input.GPSAddress.IsSet {
		property.GPSAddress = input.GPSAddress.Value
	}

	if input.Type != nil {
		newType := *input.Type
		if newType != property.Type && property.Type == "MULTI" && newType == "SINGLE" {
			unitsCount, unitsCountErr := s.unitService.CountUnits(
				context,
				repository.ListUnitsFilter{PropertyID: property.ID.String()},
			)
			if unitsCountErr != nil {
				return nil, unitsCountErr
			}
			if unitsCount > 1 {
				return nil, pkg.BadRequestError(
					"property has more than 1 unit; remove units before switching to SINGLE",
					nil,
				)
			}

			blocksCount, blocksCountErr := s.propertyBlockService.CountPropertyBlocks(
				context,
				repository.ListPropertyBlocksFilter{PropertyID: property.ID.String()},
			)
			if blocksCountErr != nil {
				return nil, blocksCountErr
			}
			if blocksCount > 1 {
				return nil, pkg.BadRequestError(
					"property has more than 1 block; remove blocks before switching to SINGLE",
					nil,
				)
			}
		}
		property.Type = newType
	}

	if input.Status != nil {
		newStatus := *input.Status
		if newStatus != property.Status {
			isGoingOffline := newStatus == "Property.Status.Inactive" || newStatus == "Property.Status.Maintenance"
			if property.Status == "Property.Status.Active" && isGoingOffline {
				activeLeaseCount, activeLeaseCountErr := s.leaseRepo.CountActiveByPropertyID(
					context,
					property.ID.String(),
				)
				if activeLeaseCountErr != nil {
					return nil, pkg.InternalServerError(activeLeaseCountErr.Error(), &pkg.RentLoopErrorParams{
						Err: activeLeaseCountErr,
						Metadata: map[string]string{
							"function": "UpdateProperty",
							"action":   "counting active leases for property",
						},
					})
				}
				if activeLeaseCount > 0 {
					return nil, pkg.BadRequestError(
						"property has active or pending leases; vacate all tenants before changing status",
						nil,
					)
				}
			}
			property.Status = newStatus
		}
	}

	if updateErr := s.repo.Update(context, property); updateErr != nil {
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateErr,
			Metadata: map[string]string{
				"function": "UpdateProperty",
				"action":   "updating property details",
			},
		})
	}

	return property, nil
}

type DeletePropertyInput struct {
	PropertyID string
	ClientID   string
}

func (s *propertyService) DeleteProperty(context context.Context, input DeletePropertyInput) error {
	property, propertyErr := s.repo.GetByQuery(
		context,
		map[string]any{"id": input.PropertyID, "client_id": input.ClientID},
	)
	if propertyErr != nil {
		if !errors.Is(propertyErr, gorm.ErrRecordNotFound) {
			return pkg.InternalServerError(propertyErr.Error(), &pkg.RentLoopErrorParams{
				Err: propertyErr,
				Metadata: map[string]string{
					"function": "DeleteProperty",
					"action":   "fetching property by ID",
				},
			})
		}

		return pkg.NotFoundError("PropertyNotFound", &pkg.RentLoopErrorParams{
			Err: propertyErr,
		})
	}

	unitsCount, unitErr := s.unitService.CountUnits(
		context,
		repository.ListUnitsFilter{PropertyID: property.ID.String()},
	)
	if unitErr != nil {
		return unitErr
	}

	if unitsCount > 0 {
		return pkg.BadRequestError("property is linked to a unit", nil)
	}

	tx := s.appCtx.DB.Begin()

	transCtx := lib.WithTransaction(context, tx)

	unlinkPropertyErr := s.clientUserPropertyService.UnlinkByPropertyID(transCtx, input.PropertyID)
	if unlinkPropertyErr != nil {
		tx.Rollback()
		return unlinkPropertyErr
	}

	deletePropertyErr := s.repo.Delete(transCtx, input.PropertyID)
	if deletePropertyErr != nil {
		tx.Rollback()
		return pkg.InternalServerError(deletePropertyErr.Error(), &pkg.RentLoopErrorParams{
			Err: deletePropertyErr,
			Metadata: map[string]string{
				"function": "DeleteProperty",
				"action":   "deleting property",
			},
		})
	}

	commitErr := tx.Commit().Error
	if commitErr != nil {
		tx.Rollback()
		return commitErr
	}

	return nil
}

func (s *propertyService) GetPropertyBySlug(
	ctx context.Context,
	query repository.GetPropertyBySlugQuery,
) (*models.Property, error) {
	property, getErr := s.repo.GetBySlug(ctx, query)
	if getErr != nil {
		if errors.Is(getErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("PropertyNotFound", &pkg.RentLoopErrorParams{
				Err: getErr,
			})
		}

		return nil, pkg.InternalServerError(getErr.Error(), &pkg.RentLoopErrorParams{
			Err: getErr,
			Metadata: map[string]string{
				"function": "GetPropertyBySlug",
				"action":   "get property by slug",
			},
		})
	}

	return property, nil
}
