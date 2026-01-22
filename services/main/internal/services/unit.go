package services

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/lib/pq"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type UnitService interface {
	ListUnits(context context.Context, filterQuery repository.ListUnitsFilter) ([]models.Unit, error)
	CountUnits(context context.Context, filterQuery repository.ListUnitsFilter) (int64, error)
	CreateUnit(context context.Context, input CreateUnitInput) (*models.Unit, error)
	GetUnit(context context.Context, query repository.GetUnitQuery) (*models.Unit, error)
	GetUnitByID(context context.Context, id string) (*models.Unit, error)
	UpdateUnit(context context.Context, input UpdateUnitInput) (*models.Unit, error)
	UpdateUnitStatus(ctx context.Context, input UpdateUnitStatusInput) error
	DeleteUnit(ctx context.Context, input repository.DeleteUnitInput) error
	updateUnitCount(ctx context.Context, input UpdateUnitCountInput) error
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

	updateUnitCountErr := s.updateUnitCount(transCtx, UpdateUnitCountInput{
		PropertyID:      input.PropertyID,
		PropertyBlockID: input.PropertyBlockID,
	})
	if updateUnitCountErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(updateUnitCountErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateUnitCountErr,
			Metadata: map[string]string{
				"function": "CreateUnit",
				"action":   "updating unit count",
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

func (s *unitService) GetUnit(ctx context.Context, query repository.GetUnitQuery) (*models.Unit, error) {
	unit, getUnitErr := s.repo.GetOneWithQuery(ctx, query)
	if getUnitErr != nil {
		if errors.Is(getUnitErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("UnitNotFound", &pkg.RentLoopErrorParams{
				Err: getUnitErr,
			})
		}
		return nil, pkg.InternalServerError(getUnitErr.Error(), &pkg.RentLoopErrorParams{
			Err: getUnitErr,
			Metadata: map[string]string{
				"function": "GetUnit",
				"action":   "fetching unit",
			},
		})
	}

	return unit, nil
}

func (s *unitService) GetUnitByID(ctx context.Context, id string) (*models.Unit, error) {
	unit, getUnitErr := s.repo.GetOne(ctx, map[string]any{"id": id})
	if getUnitErr != nil {
		if errors.Is(getUnitErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("UnitNotFound", &pkg.RentLoopErrorParams{
				Err: getUnitErr,
			})
		}
		return nil, pkg.InternalServerError(getUnitErr.Error(), &pkg.RentLoopErrorParams{
			Err: getUnitErr,
			Metadata: map[string]string{
				"function": "GetUnitByID",
				"action":   "fetching unit",
			},
		})
	}

	return unit, nil
}

type UpdateUnitInput struct {
	PropertyID          string
	UnitID              string
	Name                *string
	Description         *string
	Images              *[]string
	Tags                *[]string
	Type                *string
	Area                *float64
	RentFee             *int64
	RentFeeCurrency     *string
	PaymentFrequency    *string
	Features            *map[string]any
	MaxOccupantsAllowed *int
	Status              *string
}

func (s *unitService) UpdateUnit(ctx context.Context, input UpdateUnitInput) (*models.Unit, error) {
	unit, getUnitErr := s.repo.GetOne(ctx, map[string]any{
		"id":          input.UnitID,
		"property_id": input.PropertyID,
	})

	if getUnitErr != nil {
		if errors.Is(getUnitErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("UnitNotFound", &pkg.RentLoopErrorParams{
				Err: getUnitErr,
			})
		}
		return nil, pkg.InternalServerError(getUnitErr.Error(), &pkg.RentLoopErrorParams{
			Err: getUnitErr,
			Metadata: map[string]string{
				"function": "UpdateUnit",
				"action":   "fetching unit",
			},
		})
	}

	if unit.Status != "Unit.Status.Draft" {
		return nil, pkg.ForbiddenError("UnitNotInDraftState", nil)
	}

	if input.Name != nil {
		unit.Name = *input.Name
	}

	if input.Type != nil {
		unit.Type = *input.Type
	}

	if input.RentFee != nil {
		unit.RentFee = *input.RentFee
	}

	if input.RentFeeCurrency != nil {
		unit.RentFeeCurrency = *input.RentFeeCurrency
	}

	if input.PaymentFrequency != nil {
		unit.PaymentFrequency = *input.PaymentFrequency
	}

	if input.MaxOccupantsAllowed != nil {
		unit.MaxOccupantsAllowed = *input.MaxOccupantsAllowed
	}

	if input.Status != nil {
		unit.Status = *input.Status
	}

	if input.Features != nil {
		unmarshalledFeatures, err := json.Marshal(input.Features)
		if err != nil {
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "UpdateUnit",
					"action":   "marshalling features",
				},
			})
		}
		unit.Features = datatypes.JSON(unmarshalledFeatures)
	}

	if input.Images != nil {
		unit.Images = pq.StringArray(*input.Images)
	}

	if input.Tags != nil {
		unit.Tags = pq.StringArray(*input.Tags)
	}

	unit.Description = input.Description

	unit.Area = input.Area

	updateUnitErr := s.repo.Update(ctx, unit)
	if updateUnitErr != nil {
		return nil, pkg.InternalServerError(updateUnitErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateUnitErr,
			Metadata: map[string]string{
				"function": "UpdateUnit",
				"action":   "updating unit",
			},
		})
	}

	return unit, nil
}

type UpdateUnitStatusInput struct {
	PropertyID string
	UnitID     string
	Status     string
}

func (s *unitService) UpdateUnitStatus(ctx context.Context, input UpdateUnitStatusInput) error {
	unit, getUnitErr := s.repo.GetOne(ctx, map[string]any{
		"id":          input.UnitID,
		"property_id": input.PropertyID,
	})
	if getUnitErr != nil {
		if errors.Is(getUnitErr, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("UnitNotFound", &pkg.RentLoopErrorParams{
				Err: getUnitErr,
			})
		}
		return pkg.InternalServerError(getUnitErr.Error(), &pkg.RentLoopErrorParams{
			Err: getUnitErr,
			Metadata: map[string]string{
				"function": "UpdateUnitStatus",
				"action":   "fetching unit",
			},
		})
	}

	if unit.Status == "Unit.Status.Occupied" {
		return pkg.ForbiddenError("UnitIsOccupied", nil)
	}

	unit.Status = input.Status

	updateUnitErr := s.repo.Update(ctx, unit)
	if updateUnitErr != nil {
		return pkg.InternalServerError(updateUnitErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateUnitErr,
			Metadata: map[string]string{
				"function": "UpdateUnitStatus",
				"action":   "updating unit",
			},
		})
	}
	return nil
}

func (s *unitService) DeleteUnit(ctx context.Context, input repository.DeleteUnitInput) error {
	unit, getUnitErr := s.repo.GetOne(ctx, map[string]any{
		"id":          input.UnitID,
		"property_id": input.PropertyID,
	})
	if getUnitErr != nil {
		if errors.Is(getUnitErr, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("UnitNotFound", &pkg.RentLoopErrorParams{
				Err: getUnitErr,
			})
		}
		return pkg.InternalServerError(getUnitErr.Error(), &pkg.RentLoopErrorParams{
			Err: getUnitErr,
			Metadata: map[string]string{
				"function": "DeleteUnit",
				"action":   "fetching unit",
			},
		})
	}

	if unit.Status == "Unit.Status.Occupied" {
		return pkg.ForbiddenError("UnitIsOccupied", nil)
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	deleteUnitErr := s.repo.Delete(transCtx, input)
	if deleteUnitErr != nil {
		transaction.Rollback()
		return pkg.InternalServerError(deleteUnitErr.Error(), &pkg.RentLoopErrorParams{
			Err: deleteUnitErr,
			Metadata: map[string]string{
				"function": "DeleteUnit",
				"action":   "deleting unit",
			},
		})
	}

	updateUnitCountErr := s.updateUnitCount(transCtx, UpdateUnitCountInput{
		PropertyID:      unit.PropertyID,
		PropertyBlockID: unit.PropertyBlockID,
	})
	if updateUnitCountErr != nil {
		transaction.Rollback()
		return pkg.InternalServerError(updateUnitCountErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateUnitCountErr,
			Metadata: map[string]string{
				"function": "DeleteUnit",
				"action":   "updating unit count",
			},
		})
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		transaction.Rollback()
		return pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"function": "DeleteUnit",
				"action":   "committing transaction",
			},
		})
	}

	return nil
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

type UpdateUnitCountInput struct {
	PropertyID      string
	PropertyBlockID string
}

func (s *unitService) updateUnitCount(ctx context.Context, input UpdateUnitCountInput) error {
	countUnitsFilter := repository.ListUnitsFilter{
		PropertyID: input.PropertyID,
		BlockIDs:   &[]string{input.PropertyBlockID},
	}

	unitsCount, countUnitsErr := s.CountUnits(ctx, countUnitsFilter)
	if countUnitsErr != nil {
		return pkg.InternalServerError(countUnitsErr.Error(), &pkg.RentLoopErrorParams{
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
	_, updatePropertyBlockErr := s.propertyBlockService.UpdatePropertyBlock(ctx, updatePropertyBlockInput)
	if updatePropertyBlockErr != nil {
		return pkg.InternalServerError(updatePropertyBlockErr.Error(), &pkg.RentLoopErrorParams{
			Err: updatePropertyBlockErr,
			Metadata: map[string]string{
				"function": "CreateUnit",
				"action":   "updating property block unit count",
			},
		})
	}

	return nil
}
