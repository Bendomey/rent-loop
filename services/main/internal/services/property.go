package services

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type PropertyService interface {
	CreateProperty(context context.Context, input CreatePropertyInput) (*models.Property, error)
}

type propertyService struct {
	appCtx pkg.AppContext
	repo   repository.PropertyRepository
}

func NewPropertyService(appCtx pkg.AppContext, repo repository.PropertyRepository) PropertyService {
	return &propertyService{appCtx, repo}
}

type CreatePropertyInput struct {
	Type        string
	Status      string
	Name        string
	Slug        string
	Description *string
	Images      *[]string
	Tags        *[]string
	Latitude    float64
	Longitude   float64
	Address     string
	Country     string
	Region      string
	City        string
	GpsAddress  *string
	ClientID    string
	CreatedByID string
}

func (s *propertyService) CreateProperty(ctx context.Context, input CreatePropertyInput) (*models.Property, error) {
	return nil, nil
}
