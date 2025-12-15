package services

import (
	"context"
	"encoding/json"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/lib/pq"
	"gorm.io/datatypes"
)

type UnitService interface {
	ListUnits(context context.Context, filterQuery repository.ListUnitsFilter) ([]models.Unit, error)
	CountUnits(context context.Context, filterQuery repository.ListUnitsFilter) (int64, error)
	CreateUnit(context context.Context, input CreateUnitInput) (*models.Unit, error)
}

type unitService struct {
	appCtx               pkg.AppContext
	repo                 repository.UnitRepository
	propertyBlockService PropertyBlockService
}

type UnitServiceDependencies struct {
	AppCtx               pkg.AppContext
	Repo                 repository.UnitRepository
	PropertyBlockService PropertyBlockService
}

func NewUnitService(deps UnitServiceDependencies) UnitService {
	return &unitService{appCtx: deps.AppCtx, repo: deps.Repo, propertyBlockService: deps.PropertyBlockService}
}

type CreateUnitInput struct {
	PropertyID          string
	PropertyBlockID     string
	Name                string
	Description         *string
	Images              *[]string
	Tags                *[]string
	Type                string
	Status              string
	Area                *float64
	RentFee             int64
	RentFeeCurrency     string
	PaymentFrequency    string
	CreatedByID         string
	Features            *map[string]any
	MaxOccupantsAllowed int
}

func (s *unitService) CreateUnit(ctx context.Context, input CreateUnitInput) (*models.Unit, error) {
	images := pq.StringArray{}
	if input.Images != nil {
		images = pq.StringArray(*input.Images)
	}

	tags := pq.StringArray{}
	if input.Tags != nil {
		tags = pq.StringArray(*input.Tags)
	}

	var features datatypes.JSON
	if input.Features != nil {
		unmarshalledFeatures, err := json.Marshal(input.Features)
		if err != nil {
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "CreateUnit",
					"action":   "marshalling features",
				},
			})
		}
		features = datatypes.JSON(unmarshalledFeatures)
	} else {
		features = datatypes.JSON{}
	}

	unit := models.Unit{
		PropertyID:          input.PropertyID,
		PropertyBlockID:     input.PropertyBlockID,
		Name:                input.Name,
		Description:         input.Description,
		Images:              images,
		Tags:                tags,
		Type:                input.Type,
		Status:              input.Status,
		Area:                input.Area,
		RentFee:             input.RentFee,
		RentFeeCurrency:     input.RentFeeCurrency,
		PaymentFrequency:    input.PaymentFrequency,
		CreatedById:         input.CreatedByID,
		Features:            features,
		MaxOccupantsAllowed: input.MaxOccupantsAllowed,
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	if err := s.repo.Create(transCtx, &unit); err != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateUnit",
				"action":   "creating new unit",
			},
		})
	}

	countUnitsFilter := repository.ListUnitsFilter{
		PropertyID: input.PropertyID,
		BlockIDs:   &[]string{input.PropertyBlockID},
	}

	unitsCount, countUnitsErr := s.CountUnits(transCtx, countUnitsFilter)
	if countUnitsErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(countUnitsErr.Error(), &pkg.RentLoopErrorParams{
			Err: countUnitsErr,
			Metadata: map[string]string{
				"function": "CreateUnit",
				"action":   "counting units",
			},
		})
	}

	count := int(unitsCount)
	updatePropertyBlockInput := UpdatePropertyBlockInput{
		PropertyBlockID: input.PropertyBlockID,
		PropertyID:      input.PropertyID,
		UnitCount:       &count,
	}
	_, updatePropertyBlockErr := s.propertyBlockService.UpdatePropertyBlock(transCtx, updatePropertyBlockInput)
	if updatePropertyBlockErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(updatePropertyBlockErr.Error(), &pkg.RentLoopErrorParams{
			Err: updatePropertyBlockErr,
			Metadata: map[string]string{
				"function": "CreateUnit",
				"action":   "updating property block unit count",
			},
		})
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"function": "CreateUnit",
				"action":   "committing transaction",
			},
		})
	}

	return &unit, nil
}

func (s *unitService) ListUnits(ctx context.Context, filterQuery repository.ListUnitsFilter) ([]models.Unit, error) {
	units, listUnitsErr := s.repo.List(ctx, filterQuery)
	if listUnitsErr != nil {
		return nil, pkg.InternalServerError(listUnitsErr.Error(), &pkg.RentLoopErrorParams{
			Err: listUnitsErr,
			Metadata: map[string]string{
				"function": "ListUnits",
				"action":   "listing units",
			},
		})
	}

	return *units, nil
}

func (s *unitService) CountUnits(
	ctx context.Context,
	filterQuery repository.ListUnitsFilter,
) (int64, error) {
	unitCount, countErr := s.repo.Count(ctx, filterQuery)
	if countErr != nil {
		return 0, pkg.InternalServerError(countErr.Error(), &pkg.RentLoopErrorParams{
			Err: countErr,
			Metadata: map[string]string{
				"function": "CountUnits",
				"action":   "counting units",
			},
		})
	}

	return unitCount, nil
}
