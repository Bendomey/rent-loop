package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputClient struct {
	ID                  string    `json:"id"                    example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Type                string    `json:"type"                  example:"corporate"`
	SubType             string    `json:"subType"               example:"real-estate"`
	Name                string    `json:"name"                  example:"Acme Corp"`
	Address             string    `json:"address"               example:"123 Main St, Suite 100"`
	Country             string    `json:"country"               example:"US"`
	Region              string    `json:"region"                example:"California"`
	City                string    `json:"city"                  example:"San Francisco"`
	Latitude            float64   `json:"latitude"              example:"37.7749"`
	Longitude           float64   `json:"longitude"             example:"-122.4194"`
	ClientApplicationId string    `json:"client_application_id" example:"app-1234"`
	CreatedAt           time.Time `json:"created_at"            example:"2023-01-01T00:00:00Z"`
	UpdatedAt           time.Time `json:"updated_at"            example:"2023-01-01T00:00:00Z"`
}

func DBClientToRestClient(i *models.Client) interface{} {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]interface{}{
		"id":                    i.ID.String(),
		"type":                  i.Type,
		"subType":               i.SubType,
		"name":                  i.Name,
		"address":               i.Address,
		"country":               i.Country,
		"region":                i.Region,
		"city":                  i.City,
		"latitude":              i.Latitude,
		"longitude":             i.Longitude,
		"client_application_id": i.ClientApplicationId,
		"created_at":            i.CreatedAt,
		"updated_at":            i.UpdatedAt,
	}
	return data
}
