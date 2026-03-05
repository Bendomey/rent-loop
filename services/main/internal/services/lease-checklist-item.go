package services

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type LeaseChecklistItemService interface {
	BulkCreateLeaseChecklistItems(context context.Context, checklistItems *[]models.LeaseChecklistItem) error
}

type leaseChecklistItemService struct {
	appCtx pkg.AppContext
	repo   repository.LeaseChecklistItemRepository
}

func NewLeaseChecklistItemService(
	appCtx pkg.AppContext,
	repo repository.LeaseChecklistItemRepository,
) LeaseChecklistItemService {
	return &leaseChecklistItemService{appCtx: appCtx, repo: repo}
}

type CreateLeaseChecklistItemInput struct {
	Description string
	Status      string
}

func (s *leaseChecklistItemService) BulkCreateLeaseChecklistItems(
	ctx context.Context,
	checklistItems *[]models.LeaseChecklistItem,
) error {
	err := s.repo.BulkCreate(ctx, checklistItems)
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "BulkCreateLeaseChecklistItems",
				"action":   "creating lease checklist items",
			},
		})
	}

	return nil
}
