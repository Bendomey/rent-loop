package repository

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type ChecklistTemplateRepository interface {
	GetByUnitType(ctx context.Context, unitType string) (*models.ChecklistTemplate, error)
	GetByID(ctx context.Context, id string) (*models.ChecklistTemplate, error)
	List(ctx context.Context, filterQuery lib.FilterQuery) (*[]models.ChecklistTemplate, error)
	Count(ctx context.Context, filterQuery lib.FilterQuery) (int64, error)
}

type checklistTemplateRepository struct {
	db *gorm.DB
}

func NewChecklistTemplateRepository(db *gorm.DB) ChecklistTemplateRepository {
	return &checklistTemplateRepository{db: db}
}

func (r *checklistTemplateRepository) GetByUnitType(
	ctx context.Context,
	unitType string,
) (*models.ChecklistTemplate, error) {
	var template models.ChecklistTemplate
	result := r.db.WithContext(ctx).
		Preload("Items").
		Where("unit_type = ?", unitType).
		First(&template)
	if result.Error != nil {
		return nil, result.Error
	}
	return &template, nil
}

func (r *checklistTemplateRepository) GetByID(ctx context.Context, id string) (*models.ChecklistTemplate, error) {
	var template models.ChecklistTemplate
	result := r.db.WithContext(ctx).
		Preload("Items").
		Where("id = ?", id).
		First(&template)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, result.Error
		}
		return nil, result.Error
	}
	return &template, nil
}

func (r *checklistTemplateRepository) List(
	ctx context.Context,
	filterQuery lib.FilterQuery,
) (*[]models.ChecklistTemplate, error) {
	var templates []models.ChecklistTemplate

	db := r.db.WithContext(ctx).Scopes(
		IDsFilterScope("checklist_templates", filterQuery.IDs),
		DateRangeScope("checklist_templates", filterQuery.DateRange),
		SearchScope("checklist_templates", filterQuery.Search),
		PaginationScope(filterQuery.Page, filterQuery.PageSize),
		OrderScope("checklist_templates", filterQuery.OrderBy, filterQuery.Order),
	).Preload("Items")

	result := db.Find(&templates)
	if result.Error != nil {
		return nil, result.Error
	}
	return &templates, nil
}

func (r *checklistTemplateRepository) Count(
	ctx context.Context,
	filterQuery lib.FilterQuery,
) (int64, error) {
	var count int64

	result := r.db.WithContext(ctx).
		Model(&models.ChecklistTemplate{}).
		Scopes(
			IDsFilterScope("checklist_templates", filterQuery.IDs),
			DateRangeScope("checklist_templates", filterQuery.DateRange),
			SearchScope("checklist_templates", filterQuery.Search),
		).
		Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}
	return count, nil
}
