package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

type OutputProperty struct {
	ID          string    `json:"id" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Address     string    `json:"address" example:"123 Main St, City, Country"`
	Name        string    `json:"name" example:"Beautiful Apartment"`
	Description *string   `json:"description,omitempty" example:"A lovely place to stay."`
	Slug        string    `json:"slug" example:"beautiful-apartment"`
	City        string    `json:"city" example:"City"`
	Region      string    `json:"region" example:"Region"`
	Country     string    `json:"country" example:"Country"`
	Latitude    float64   `json:"latitude" example:"37.7749"`
	Longitude   float64   `json:"longitude" example:"-122.4194"`
	GPSAddress  string    `json:"gps_address" example:"37.7749,-122.4194"`
	Tags        []string  `json:"tags" example:"['wifi', 'pool']"`
	Status      string    `json:"status" example:"available"`
	CreatedAt   time.Time `json:"created_at" example:"2023-01-01T00:00:00Z"`
	UpdatedAt   time.Time `json:"updated_at" example:"2023-01-01T00:00:00Z"`
}

// DBPropertyToRestProperty transforms the db property model to a rest property model
func DBPropertyToRestProperty(i *models.Property) interface{} {
	if i == nil {
		return nil
	}

	data := map[string]interface{}{
		"id":           i.ID,
		"address":      i.Address,
		"name":         i.Name,
		"description":  i.Description,
		"city":         i.City,
		"region":       i.Region,
		"country":      i.Country,
		"latitude":     i.Latitude,
		"longitude":    i.Longitude,
		"gps_address":  i.GPSAddress,
		"tags":         i.Tags,
		"status":       i.Status,
		"created_at":   i.CreatedAt,
		"updated_at":   i.UpdatedAt,
	}

	return data
}