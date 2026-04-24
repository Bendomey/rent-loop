package services

import (
	"context"
	"errors"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type UnitDateBlockService interface {
	GetAvailability(ctx context.Context, unitID string, from, to time.Time) ([]models.UnitDateBlock, error)
	CreateManualBlock(ctx context.Context, input CreateManualBlockInput) (*models.UnitDateBlock, error)
	CreateSystemBlock(ctx context.Context, input CreateSystemBlockInput) (*models.UnitDateBlock, error)
	DeleteBlock(ctx context.Context, id string, requestingClientUserID string) error
}

type unitDateBlockService struct {
	appCtx pkg.AppContext
	repo   repository.UnitDateBlockRepository
}

func NewUnitDateBlockService(appCtx pkg.AppContext, repo repository.UnitDateBlockRepository) UnitDateBlockService {
	return &unitDateBlockService{appCtx: appCtx, repo: repo}
}

type CreateManualBlockInput struct {
	UnitID                string
	StartDate             time.Time
	EndDate               time.Time
	BlockType             string // MAINTENANCE | PERSONAL | OTHER
	Reason                string
	CreatedByClientUserID string
}

type CreateSystemBlockInput struct {
	UnitID    string
	StartDate time.Time
	EndDate   time.Time
	BlockType string // BOOKING | LEASE
	BookingID *string
	LeaseID   *string
	Reason    string
}

func (s *unitDateBlockService) GetAvailability(
	ctx context.Context,
	unitID string,
	from, to time.Time,
) ([]models.UnitDateBlock, error) {
	blocks, err := s.repo.ListByUnit(ctx, unitID, from, to)
	if err != nil {
		return nil, err
	}
	return *blocks, nil
}

func (s *unitDateBlockService) CreateManualBlock(
	ctx context.Context,
	input CreateManualBlockInput,
) (*models.UnitDateBlock, error) {
	if input.EndDate.Before(input.StartDate) || input.EndDate.Equal(input.StartDate) {
		return nil, errors.New("end_date must be after start_date")
	}

	block := &models.UnitDateBlock{
		UnitID:                input.UnitID,
		StartDate:             input.StartDate,
		EndDate:               input.EndDate,
		BlockType:             input.BlockType,
		Reason:                input.Reason,
		CreatedByClientUserID: &input.CreatedByClientUserID,
	}

	if err := s.repo.Create(ctx, block); err != nil {
		return nil, err
	}
	return block, nil
}

func (s *unitDateBlockService) CreateSystemBlock(
	ctx context.Context,
	input CreateSystemBlockInput,
) (*models.UnitDateBlock, error) {
	block := &models.UnitDateBlock{
		UnitID:    input.UnitID,
		StartDate: input.StartDate,
		EndDate:   input.EndDate,
		BlockType: input.BlockType,
		BookingID: input.BookingID,
		LeaseID:   input.LeaseID,
		Reason:    input.Reason,
	}
	if err := s.repo.Create(ctx, block); err != nil {
		return nil, err
	}
	return block, nil
}

func (s *unitDateBlockService) DeleteBlock(ctx context.Context, id string, requestingClientUserID string) error {
	block, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return errors.New("block not found")
	}
	// Prevent deleting system-created blocks directly
	if block.BlockType == "BOOKING" || block.BlockType == "LEASE" {
		return errors.New("cannot delete system-managed blocks directly; cancel the booking or lease instead")
	}
	return s.repo.Delete(ctx, id)
}
