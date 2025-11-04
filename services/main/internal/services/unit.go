package services

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/getsentry/raven-go"
	"gorm.io/gorm"
)

type UnitService interface {
	GetUnitByQuery(context context.Context, query map[string]any) (*models.Unit, error)
}

type unitService struct {
	appCtx pkg.AppContext
	repo   repository.UnitRepository
}

func NewUnitService(appCtx pkg.AppContext, repo repository.UnitRepository) UnitService {
	return &unitService{appCtx: appCtx, repo: repo}
}

func (s *unitService) GetUnitByQuery(
	ctx context.Context,
	query map[string]any,
) (*models.Unit, error) {
	unit, getErr := s.repo.GetByQuery(ctx, query)
	if getErr != nil {
		if !errors.Is(getErr, gorm.ErrRecordNotFound) {
			raven.CaptureError(getErr, nil)
		}
		return nil, getErr
	}

	return unit, nil
}
