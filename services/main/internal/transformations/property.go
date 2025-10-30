package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

type OutputProperty struct {
	ID          string    `json:"id" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b" format:"uuid" description:"Unique identifier for the property"`
	Type        string    `json:"type" example:"SINGLE" description:"Type of the property (e.g., SINGLE, MULTI)"`
	Status      string    `json:"status" example:"Property.Status.Active" description:"Current status of the property"`
	Name        string    `json:"name" example:"My Property" description:"Name of the property"`
	Description *string   `json:"description" example:"Very elegant place" description:"Optional description of the property"`
	Images      []string  `json:"images" example:"http://www.images/hih.jpg" description:"List of image URLs for the property"`
	Tags        []string  `json:"tags" example:"apartment,downtown" description:"Tags associated with the property"`
	Latitude    float64   `json:"latitude" example:"5.6037" description:"Latitude coordinate of the property"`
	Longitude   float64   `json:"longitude" example:"-0.1870" description:"Longitude coordinate of the property"`
	Address     string    `json:"address" example:"123 Main St" description:"Street address of the property"`
	Country     string    `json:"country" example:"Ghana" description:"Country where the property is located"`
	Region      string    `json:"region" example:"Greater Accra" description:"Region or state of the property"`
	City        string    `json:"city" example:"Accra" description:"City where the property is located"`
	GPSAddress  *string   `json:"gps_address" example:"GH-1234-5678" description:"Optional GPS address or plus code"`
	CreatedAt   time.Time `json:"created_at" example:"2023-01-01T00:00:00Z" format:"date-time" description:"Timestamp when the property was created"`
	UpdatedAt   time.Time `json:"updated_at" example:"2023-01-01T00:00:00Z" format:"date-time" description:"Timestamp when the property was last updated"`
}

func DBPropertyToRest(i *models.Property) interface{} {
	if i == nil {
		return nil
	}

	data := map[string]interface{}{
		"id":          i.ID.String(),
		"type":        i.Type,
		"status":      i.Status,
		"name":        i.Name,
		"description": i.Description,
		"images":      i.Images,
		"tags":        i.Tags,
		"latitude":    i.Latitude,
		"longitude":   i.Longitude,
		"address":     i.Address,
		"country":     i.Country,
		"region":      i.Region,
		"city":        i.City,
		"gps_address": i.GPSAddress,
		"created_at":  i.CreatedAt,
		"updated_at":  i.UpdatedAt,
	}

	return data
}
