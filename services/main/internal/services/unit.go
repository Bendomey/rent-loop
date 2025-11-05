package services

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/getsentry/raven-go"
	"gorm.io/gorm"
)

type UnitService interface {
	CountUnits(context context.Context, filterQuery repository.ListUnitsFilter) (int64, error)
}

type unitService struct {
	appCtx pkg.AppContext
	repo   repository.UnitRepository
}

func NewUnitService(appCtx pkg.AppContext, repo repository.UnitRepository) UnitService {
	return &unitService{appCtx: appCtx, repo: repo}
}

func (s *unitService) CountUnits(
	ctx context.Context,
	filterQuery repository.ListUnitsFilter,
) (int64, error) {
	unitCount, countErr := s.repo.Count(ctx, filterQuery)
	if countErr != nil {
		if !errors.Is(countErr, gorm.ErrRecordNotFound) {
			raven.CaptureError(countErr, nil)
		}
		return 0, countErr
	}

	return unitCount, nil
}
