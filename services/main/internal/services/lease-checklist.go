package services

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"gorm.io/gorm"
)

type LeaseChecklistService interface {
	CreateLeaseChecklist(ctx context.Context, input CreateLeaseChecklistInput) (*models.LeaseChecklist, error)
	GetOneLeaseChecklist(ctx context.Context, query repository.GetLeaseCheckListQuery) (*models.LeaseChecklist, error)
	UpdateLeaseChecklist(ctx context.Context, input UpdateLeaseChecklistInput) (*models.LeaseChecklist, error)
	DeleteLeaseChecklist(ctx context.Context, query repository.DeleteLeaseChecklistQuery) error
	ListLeaseChecklists(
		ctx context.Context,
		filters repository.ListLeaseChecklistsFilter,
	) (*[]models.LeaseChecklist, error)
	CountLeaseChecklists(ctx context.Context, filters repository.ListLeaseChecklistsFilter) (int64, error)
}

type leaseChecklistService struct {
	appCtx pkg.AppContext
	repo   repository.LeaseChecklistRepository
}

func NewLeaseChecklistService(appCtx pkg.AppContext, repo repository.LeaseChecklistRepository) LeaseChecklistService {
	return &leaseChecklistService{appCtx: appCtx, repo: repo}
}

type CreateLeaseChecklistInput struct {
	LeaseId     string
	Type        string
	CreatedById string
}

func (s *leaseChecklistService) CreateLeaseChecklist(
	ctx context.Context,
	input CreateLeaseChecklistInput,
) (*models.LeaseChecklist, error) {
	leaseChecklist := models.LeaseChecklist{
		LeaseId:     input.LeaseId,
		Type:        input.Type,
		CreatedById: input.CreatedById,
	}

	err := s.repo.Create(ctx, &leaseChecklist)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateLeaseChecklist",
				"action":   "creating lease checklist",
			},
		})
	}

	return &leaseChecklist, nil
}

func (s *leaseChecklistService) GetOneLeaseChecklist(
	ctx context.Context,
	query repository.GetLeaseCheckListQuery,
) (*models.LeaseChecklist, error) {
	leaseChecklist, err := s.repo.GetOneWithPopulate(ctx, query)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseChecklistNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetOneLeaseChecklist",
				"action":   "fetching lease checklist",
			},
		})
	}

	return leaseChecklist, nil
}

type UpdateLeaseChecklistInput struct {
	LeaseChecklistID string
	LeaseID          string
	Type             *string
}

func (s *leaseChecklistService) UpdateLeaseChecklist(
	ctx context.Context,
	input UpdateLeaseChecklistInput,
) (*models.LeaseChecklist, error) {
	leaseChecklist, err := s.repo.GetOneWithPopulate(ctx, repository.GetLeaseCheckListQuery{
		ID:      input.LeaseChecklistID,
		LeaseID: input.LeaseID,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseChecklistNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "UpdateLeaseChecklist",
				"action":   "fetching lease checklist",
			},
		})
	}

	if input.Type != nil {
		leaseChecklist.Type = *input.Type
	}

	updateErr := s.repo.Update(ctx, leaseChecklist)
	if updateErr != nil {
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateErr,
			Metadata: map[string]string{
				"function": "UpdateLeaseChecklist",
				"action":   "updating lease checklist",
			},
		})
	}

	return leaseChecklist, nil
}

func (s *leaseChecklistService) DeleteLeaseChecklist(
	ctx context.Context,
	query repository.DeleteLeaseChecklistQuery,
) error {
	_, err := s.repo.GetOneWithPopulate(ctx, repository.GetLeaseCheckListQuery{
		ID:      query.LeaseChecklistID,
		LeaseID: query.LeaseID,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("LeaseChecklistNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "DeleteLeaseChecklist",
				"action":   "fetching lease checklist",
			},
		})
	}

	err = s.repo.Delete(ctx, query)
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "DeleteLeaseChecklist",
				"action":   "deleting lease checklist",
			},
		})
	}

	return nil
}

func (s *leaseChecklistService) ListLeaseChecklists(
	ctx context.Context,
	filters repository.ListLeaseChecklistsFilter,
) (*[]models.LeaseChecklist, error) {
	leaseChecklists, err := s.repo.List(ctx, filters)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListLeaseChecklists",
				"action":   "listing lease checklists",
			},
		})
	}

	return leaseChecklists, nil
}

func (s *leaseChecklistService) CountLeaseChecklists(
	ctx context.Context,
	filters repository.ListLeaseChecklistsFilter,
) (int64, error) {
	count, err := s.repo.Count(ctx, filters)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountLeaseChecklists",
				"action":   "counting lease checklists",
			},
		})
	}

	return count, nil
}
