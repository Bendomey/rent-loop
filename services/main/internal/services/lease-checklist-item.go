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

type LeaseChecklistItemService interface {
	BulkCreateLeaseChecklistItems(ctx context.Context, checklistItems *[]models.LeaseChecklistItem) error
	CreateLeaseChecklistItem(
		ctx context.Context,
		input CreateSingleLeaseChecklistItemInput,
	) (*models.LeaseChecklistItem, error)
	UpdateLeaseChecklistItem(
		ctx context.Context,
		input UpdateLeaseChecklistItemInput,
	) (*models.LeaseChecklistItem, error)
	DeleteLeaseChecklistItem(ctx context.Context, checklistID string, itemID string) error
}

type leaseChecklistItemService struct {
	appCtx        pkg.AppContext
	repo          repository.LeaseChecklistItemRepository
	checklistRepo repository.LeaseChecklistRepository
}

func NewLeaseChecklistItemService(
	appCtx pkg.AppContext,
	repo repository.LeaseChecklistItemRepository,
	checklistRepo repository.LeaseChecklistRepository,
) LeaseChecklistItemService {
	return &leaseChecklistItemService{appCtx: appCtx, repo: repo, checklistRepo: checklistRepo}
}

type CreateLeaseChecklistItemInput struct {
	Description string
	Status      string
	Notes       *string
	Photos      []string
}

type CreateSingleLeaseChecklistItemInput struct {
	LeaseID          string
	LeaseChecklistID string
	Description      string
	Status           string
	Notes            *string
	Photos           []string
}

type UpdateLeaseChecklistItemInput struct {
	ID               string
	LeaseID          string
	LeaseChecklistID string
	Description      *string
	Status           *string
	Notes            *string
	Photos           *[]string
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

func (s *leaseChecklistItemService) CreateLeaseChecklistItem(
	ctx context.Context,
	input CreateSingleLeaseChecklistItemInput,
) (*models.LeaseChecklistItem, error) {
	checklist, err := s.checklistRepo.GetOneWithPopulate(ctx, repository.GetLeaseCheckListQuery{
		ID:      input.LeaseChecklistID,
		LeaseID: input.LeaseID,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseChecklistNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	if checklist.Status != "DRAFT" && checklist.Status != "DISPUTED" {
		return nil, pkg.BadRequestError("ChecklistNotEditable", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{"status": checklist.Status},
		})
	}

	item := &models.LeaseChecklistItem{
		LeaseChecklistId: input.LeaseChecklistID,
		Description:      input.Description,
		Status:           input.Status,
		Notes:            input.Notes,
		Photos:           pq.StringArray(input.Photos),
	}

	if err := s.repo.Create(ctx, item); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateLeaseChecklistItem",
				"action":   "creating lease checklist item",
			},
		})
	}

	return item, nil
}

func (s *leaseChecklistItemService) UpdateLeaseChecklistItem(
	ctx context.Context,
	input UpdateLeaseChecklistItemInput,
) (*models.LeaseChecklistItem, error) {
	checklist, err := s.checklistRepo.GetOneWithPopulate(ctx, repository.GetLeaseCheckListQuery{
		ID:      input.LeaseChecklistID,
		LeaseID: input.LeaseID,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseChecklistNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	if checklist.Status != "DRAFT" && checklist.Status != "DISPUTED" {
		return nil, pkg.BadRequestError("ChecklistNotEditable", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{"status": checklist.Status},
		})
	}

	item, err := s.repo.GetOne(ctx, input.ID, input.LeaseChecklistID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseChecklistItemNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	if input.Description != nil {
		item.Description = *input.Description
	}
	if input.Status != nil {
		item.Status = *input.Status
	}
	if input.Notes != nil {
		item.Notes = input.Notes
	}
	if input.Photos != nil {
		item.Photos = pq.StringArray(*input.Photos)
	}

	if err := s.repo.Update(ctx, item); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "UpdateLeaseChecklistItem",
				"action":   "updating lease checklist item",
			},
		})
	}

	return item, nil
}

func (s *leaseChecklistItemService) DeleteLeaseChecklistItem(
	ctx context.Context,
	checklistID string,
	itemID string,
) error {
	checklist, err := s.checklistRepo.GetOneWithPopulate(ctx, repository.GetLeaseCheckListQuery{
		ID: checklistID,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("LeaseChecklistNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	if checklist.Status != "DRAFT" && checklist.Status != "DISPUTED" {
		return pkg.BadRequestError("ChecklistNotEditable", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{"status": checklist.Status},
		})
	}

	_, err = s.repo.GetOne(ctx, itemID, checklistID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("LeaseChecklistItemNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}

	if err := s.repo.Delete(ctx, itemID, checklistID); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "DeleteLeaseChecklistItem",
				"action":   "deleting lease checklist item",
			},
		})
	}

	return nil
}
