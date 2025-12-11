package services

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type PropertyBlockService interface {
	CreatePropertyBlock(context context.Context, input CreatePropertyBlockInput) (*models.PropertyBlock, error)
	GetPropertyBlock(context context.Context, query repository.GetPropertyBlockQuery) (*models.PropertyBlock, error)
	ListPropertyBlocks(
		context context.Context,
		filterQuery repository.ListPropertyBlocksFilter,
	) ([]models.PropertyBlock, error)
	CountPropertyBlocks(context context.Context, filterQuery repository.ListPropertyBlocksFilter) (int64, error)
	UpdatePropertyBlock(context context.Context, input UpdatePropertyBlockInput) (*models.PropertyBlock, error)
}

type propertyBlockService struct {
	appCtx pkg.AppContext
	repo   repository.PropertyBlockRepository
}

func NewPropertyBlockService(appCtx pkg.AppContext, repo repository.PropertyBlockRepository) PropertyBlockService {
	return &propertyBlockService{appCtx, repo}
}

type CreatePropertyBlockInput struct {
	PropertyID  string
	Name        string
	Description *string
	Images      []string
	Status      string
}

func (s *propertyBlockService) CreatePropertyBlock(
	ctx context.Context,
	input CreatePropertyBlockInput,
) (*models.PropertyBlock, error) {
	var images pq.StringArray
	if input.Images != nil {
		images = pq.StringArray(input.Images)
	} else {
		images = pq.StringArray{}
	}

	propertyBlock := models.PropertyBlock{
		PropertyID:  input.PropertyID,
		Name:        input.Name,
		Description: input.Description,
		UnitsCount:  0,
		Images:      images,
		Status:      input.Status,
	}

	createPropertyBlockErr := s.repo.Create(ctx, &propertyBlock)
	if createPropertyBlockErr != nil {
		return nil, pkg.InternalServerError(createPropertyBlockErr.Error(), &pkg.RentLoopErrorParams{
			Err: createPropertyBlockErr,
			Metadata: map[string]string{
				"function": "CreatePropertyBlock",
				"action":   "creating new property block",
			},
		})
	}
	return &propertyBlock, nil
}

func (s *propertyBlockService) GetPropertyBlock(
	ctx context.Context,
	query repository.GetPropertyBlockQuery,
) (*models.PropertyBlock, error) {
	propertyBlock, getPropertyBlockByIDErr := s.repo.GetByIDWithQuery(ctx, query)
	if getPropertyBlockByIDErr != nil {
		if errors.Is(getPropertyBlockByIDErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("PropertyBlockNotFound", &pkg.RentLoopErrorParams{
				Err: getPropertyBlockByIDErr,
			})
		}

		return nil, pkg.InternalServerError(getPropertyBlockByIDErr.Error(), &pkg.RentLoopErrorParams{
			Err: getPropertyBlockByIDErr,
			Metadata: map[string]string{
				"function": "FindPropertyBlockByIDWithQuery",
				"action":   "fetching property block by ID",
			},
		})
	}

	return propertyBlock, nil
}

type UpdatePropertyBlockInput struct {
	PropertyBlockID string
	PropertyID      string
	Name            *string
	Description     *string
	Images          *[]string
}

func (s *propertyBlockService) UpdatePropertyBlock(
	ctx context.Context,
	input UpdatePropertyBlockInput,
) (*models.PropertyBlock, error) {
	propertyBlock, getPropertyBlockErr := s.repo.GetByIDWithQuery(ctx, repository.GetPropertyBlockQuery{
		PropertyBlockID: input.PropertyBlockID,
		PropertyID:      input.PropertyID,
	})
	if getPropertyBlockErr != nil {
		if errors.Is(getPropertyBlockErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("PropertyBlockNotFound", &pkg.RentLoopErrorParams{
				Err: getPropertyBlockErr,
			})
		}
		return nil, pkg.InternalServerError(getPropertyBlockErr.Error(), &pkg.RentLoopErrorParams{
			Err: getPropertyBlockErr,
			Metadata: map[string]string{
				"function": "FindPropertyBlockByIDWithQuery",
				"action":   "fetching property block by ID",
			},
		})
	}

	if input.Name != nil {
		propertyBlock.Name = *input.Name
	}

	if input.Images != nil {
		propertyBlock.Images = pq.StringArray(*input.Images)
	}

	propertyBlock.Description = input.Description

	updatePropertyBlockErr := s.repo.Update(ctx, propertyBlock)
	if updatePropertyBlockErr != nil {
		return nil, pkg.InternalServerError(updatePropertyBlockErr.Error(), &pkg.RentLoopErrorParams{
			Err: updatePropertyBlockErr,
			Metadata: map[string]string{
				"function": "UpdatePropertyBlock",
				"action":   "updating property block",
			},
		})
	}

	return propertyBlock, nil
}

func (s *propertyBlockService) ListPropertyBlocks(
	ctx context.Context,
	filterQuery repository.ListPropertyBlocksFilter,
) ([]models.PropertyBlock, error) {
	propertyBlocks, listPropertyBlocksErr := s.repo.List(ctx, filterQuery)
	if listPropertyBlocksErr != nil {
		return nil, pkg.InternalServerError(listPropertyBlocksErr.Error(), &pkg.RentLoopErrorParams{
			Err: listPropertyBlocksErr,
			Metadata: map[string]string{
				"function": "ListPropertyBlocks",
				"action":   "listing property blocks",
			},
		})
	}

	return *propertyBlocks, nil
}

func (s *propertyBlockService) CountPropertyBlocks(
	ctx context.Context,
	filterQuery repository.ListPropertyBlocksFilter,
) (int64, error) {
	propertyBlocksCount, countPropertyBlocksErr := s.repo.Count(ctx, filterQuery)
	if countPropertyBlocksErr != nil {
		return 0, pkg.InternalServerError(countPropertyBlocksErr.Error(), &pkg.RentLoopErrorParams{
			Err: countPropertyBlocksErr,
			Metadata: map[string]string{
				"function": "CountPropertyBlocks",
				"action":   "counting property blocks",
			},
		})
	}

	return propertyBlocksCount, nil
}
