package services

import (
	"context"
	"fmt"
	"strings"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/getsentry/raven-go"
	gonanoid "github.com/matoous/go-nanoid"
)

type PropertyService interface {
	GetProperty(ctx context.Context, propertyId string) (*models.Property, error)
	CreateProperty(ctx context.Context, input CreatePropertyInput) (*models.Property, error)
}

type propertyService struct {
	appCtx pkg.AppContext
	repo   repository.PropertyRepository
}

func NewPropertyService(appCtx pkg.AppContext, repo repository.PropertyRepository) PropertyService {
	return &propertyService{appCtx: appCtx, repo: repo}
}

func (s *propertyService) GetProperty(ctx context.Context, propertyId string) (*models.Property, error) {
	return s.repo.GetByID(ctx, propertyId)
}

type CreatePropertyInput struct {
	// required
	Name        string
	Address     string
	City        string
	Region      string
	Country     string
	Latitude    float64
	Longitude   float64
	GPSAddress  string
	Type        string 
	Status      string 
	ClientID    string
	CreatedByID string

	// optional
	Description *string
	Tags        []string
	Images      []string
}

func (s *propertyService) CreateProperty(ctx context.Context, input CreatePropertyInput) (*models.Property, error) {
	if strings.TrimSpace(input.Name) == "" {
		return nil, errors.New("name is required")
	}
	if strings.TrimSpace(input.Address) == "" ||
		strings.TrimSpace(input.City) == "" ||
		strings.TrimSpace(input.Region) == "" ||
		strings.TrimSpace(input.Country) == "" ||
		strings.TrimSpace(input.GPSAddress) == "" {
		return nil, errors.New("address, city, region, country and gpsAddress are required")
	}
	if strings.TrimSpace(input.ClientID) == "" {
		return nil, errors.New("clientId is required")
	}
	if strings.TrimSpace(input.CreatedByID) == "" {
		return nil, errors.New("createdById is required")
	}

	input.Type = strings.ToUpper(strings.TrimSpace(input.Type))
	switch input.Type {
	case "SINGLE", "MULTI":
	default:
		return nil, fmt.Errorf("invalid type: %s (must be SINGLE or MULTI)", input.Type)
	}

	if input.Status == "" {
		input.Status = "ACTIVE"
	}
	input.Status = strings.ToUpper(strings.TrimSpace(input.Status))
	switch input.Status {
	case "ACTIVE", "MAINTENANCE", "INACTIVE":
	default:
		return nil, fmt.Errorf("invalid status: %s (must be ACTIVE, MAINTENANCE or INACTIVE)", input.Status)
	}

	propertyID, idErr := gonanoid.New()
	if idErr != nil {
		raven.CaptureError(idErr, nil)
		return nil, errors.New("failed to generate property id")
	}

	slug := slugify(input.Name)

	property := &models.Property{
		BaseModelSoftDelete: models.BaseModelSoftDelete{ID: propertyID},
		ClientID:            input.ClientID,
		Name:                strings.TrimSpace(input.Name),
		Slug:                slug,
		Description:         input.Description,
		Images:              pq.StringArray(input.Images),
		Tags:                pq.StringArray(input.Tags),
		Latitude:            input.Latitude,
		Longitude:           input.Longitude,
		Address:             input.Address,
		Country:             input.Country,
		Region:              input.Region,
		City:                input.City,
		GPSAddress:          input.GPSAddress,
		Type:                input.Type,
		Status:              input.Status,
		CreatedByID:         input.CreatedByID,
	}

	if err := s.repo.Create(ctx, property); err != nil {
		raven.CaptureError(err, nil)
		return nil, errors.New("failed to create property")
	}

	return property, nil
}

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))

	s = strings.ReplaceAll(s, "_", "-")
	s = strings.ReplaceAll(s, " ", "-")

	
	var b strings.Builder
	b.Grow(len(s))
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			b.WriteRune(r)
		} else if unicode.IsLetter(r) || unicode.IsDigit(r) {
			
			b.WriteRune(r)
		} else {
			
		}
	}
	s = b.String()

	reHyphens := regexp.MustCompile(`-+`)
	s = reHyphens.ReplaceAllString(s, "-")

	s = strings.Trim(s, "-")

	if s == "" {
		return "property"
	}
	return s
}

