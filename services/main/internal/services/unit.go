package services

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
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
