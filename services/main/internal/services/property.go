package services

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/getsentry/raven-go"
	"github.com/lib/pq"
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
	Description *string
	Images      []string
	Tags        []string
	Latitude    float64
	Longitude   float64
	Address     string
	Country     string
	Region      string
	City        string
	GPSAddress  *string
	ClientID    string
	CreatedByID string
}

func (s *propertyService) CreateProperty(ctx context.Context, input CreatePropertyInput) (*models.Property, error) {
	slug, err := lib.GenerateSlug(input.Name)
	if err != nil {
		raven.CaptureError(err, map[string]string{
			"function": "CreateProperty",
			"action":   "Generating a slug",
		})
		return nil, err
	}

	var images pq.StringArray
	if input.Images != nil {
		images = pq.StringArray(input.Images)
	} else {
		images = pq.StringArray{}
	}

	var tags pq.StringArray
	if input.Tags != nil {
		tags = pq.StringArray(input.Tags)
	} else {
		tags = pq.StringArray{}
	}

	property := models.Property{
		Type:        input.Type,
		Status:      input.Status,
		Name:        input.Name,
		Slug:        slug,
		Description: input.Description,
		Images:      images,
		Tags:        tags,
		Latitude:    input.Latitude,
		Longitude:   input.Longitude,
		Address:     input.Address,
		Country:     input.Country,
		Region:      input.Region,
		City:        input.City,
		GPSAddress:  input.GPSAddress,
		ClientID:    input.ClientID,
		CreatedByID: input.CreatedByID,
	}

	if err := s.repo.Create(ctx, &property); err != nil {
		return nil, err
	}

	return &property, nil
}
