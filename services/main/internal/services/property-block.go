package services

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/lib/pq"
)

type PropertyBlockService interface {
	CreatePropertyBlock(context context.Context, input CreatePropertyBlockInput) (*models.PropertyBlock, error)
	ListPropertyBlocks(
		context context.Context,
		filterQuery repository.ListPropertyBlocksFilter,
	) ([]models.PropertyBlock, error)
	CountPropertyBlocks(context context.Context, filterQuery repository.ListPropertyBlocksFilter) (int64, error)
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
