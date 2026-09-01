package services

import (
	"context"
	"errors"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib/availability"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type UnitDateBlockService interface {
	GetAvailability(ctx context.Context, unitID string, from, to time.Time) ([]models.UnitDateBlock, error)
	CreateManualBlock(ctx context.Context, input CreateManualBlockInput) (*models.UnitDateBlock, error)
	CreateSystemBlock(ctx context.Context, input CreateSystemBlockInput) (*models.UnitDateBlock, error)
	DeleteBlock(ctx context.Context, id string, requestingClientUserID string) error
	MoveLeaseBlock(ctx context.Context, lease models.Lease) error
	ReleaseLeaseBlock(ctx context.Context, leaseID string) error
	TruncateLeaseBlock(ctx context.Context, leaseID string, end time.Time) error
	// LockUnit must be called inside the transaction that will write the
	// block, before the availability it depends on is read.
	LockUnit(ctx context.Context, unitID string) error
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
	SlotsOccupied         *int   // nil is absolute
	Reason                string
	CreatedByClientUserID string
}

type CreateSystemBlockInput struct {
	UnitID        string
	StartDate     time.Time
	EndDate       time.Time
	BlockType     string // BOOKING | LEASE
	SlotsOccupied *int
	BookingID     *string
	LeaseID       *string
	Reason        string
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
		SlotsOccupied:         input.SlotsOccupied,
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
		UnitID:        input.UnitID,
		StartDate:     input.StartDate,
		EndDate:       input.EndDate,
		BlockType:     input.BlockType,
		SlotsOccupied: input.SlotsOccupied,
		BookingID:     input.BookingID,
		LeaseID:       input.LeaseID,
		Reason:        input.Reason,
	}
	if err := s.repo.Create(ctx, block); err != nil {
		return nil, err
	}
	return block, nil
}

func (s *unitDateBlockService) LockUnit(ctx context.Context, unitID string) error {
	return s.repo.LockUnit(ctx, unitID)
}

// MoveLeaseBlock writes the lease's block if it has none. Updating by lease id
// alone would report success against zero rows, and a lease predating blocks —
// or one the backfill could not reach — would silently keep claiming its old
// term.
func (s *unitDateBlockService) MoveLeaseBlock(ctx context.Context, lease models.Lease) error {
	input := leaseBlockInput(lease)

	existing, err := s.repo.GetByLeaseID(ctx, lease.ID.String())
	if err != nil {
		return err
	}
	if existing == nil {
		_, createErr := s.CreateSystemBlock(ctx, input)
		return createErr
	}

	return s.repo.UpdateDatesByLeaseID(ctx, lease.ID.String(), input.StartDate, input.EndDate)
}

func (s *unitDateBlockService) ReleaseLeaseBlock(ctx context.Context, leaseID string) error {
	return s.repo.DeleteByLeaseID(ctx, leaseID)
}

func (s *unitDateBlockService) TruncateLeaseBlock(
	ctx context.Context,
	leaseID string,
	end time.Time,
) error {
	block, err := s.repo.GetByLeaseID(ctx, leaseID)
	if err != nil {
		return err
	}
	if block == nil {
		return nil
	}
	return s.repo.UpdateDatesByLeaseID(
		ctx,
		leaseID,
		block.StartDate,
		availability.TruncatedEnd(block.StartDate, block.EndDate, end),
	)
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
	// TODO: verify requestingClientUserID owns the block's property before deleting
	return s.repo.Delete(ctx, id)
}
