package services

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"gorm.io/gorm"
)

type ChecklistTemplateService interface {
	ListChecklistTemplates(ctx context.Context, filterQuery lib.FilterQuery) (*[]models.ChecklistTemplate, error)
	CountChecklistTemplates(ctx context.Context, filterQuery lib.FilterQuery) (int64, error)
	GetChecklistTemplate(ctx context.Context, id string) (*models.ChecklistTemplate, error)
}

type checklistTemplateService struct {
	repo repository.ChecklistTemplateRepository
}

func NewChecklistTemplateService(repo repository.ChecklistTemplateRepository) ChecklistTemplateService {
	return &checklistTemplateService{repo: repo}
}

func (s *checklistTemplateService) ListChecklistTemplates(
	ctx context.Context,
	filterQuery lib.FilterQuery,
) (*[]models.ChecklistTemplate, error) {
	templates, err := s.repo.List(ctx, filterQuery)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListChecklistTemplates",
				"action":   "listing checklist templates",
			},
		})
	}
	return templates, nil
}

func (s *checklistTemplateService) CountChecklistTemplates(
	ctx context.Context,
	filterQuery lib.FilterQuery,
) (int64, error) {
	count, err := s.repo.Count(ctx, filterQuery)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountChecklistTemplates",
				"action":   "counting checklist templates",
			},
		})
	}
	return count, nil
}

func (s *checklistTemplateService) GetChecklistTemplate(
	ctx context.Context,
	id string,
) (*models.ChecklistTemplate, error) {
	template, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("ChecklistTemplateNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetChecklistTemplate",
				"action":   "fetching checklist template",
			},
		})
	}
	return template, nil
}
