package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputPropertyBlock struct {
	ID          string `json:"id"           example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"                          format:"uuid"      description:"Unique identifier for the property block"`
	PropertyID  string `json:"property_id"  example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"                          format:"uuid"      description:"Unique identifier for the property"`
	Property    OutputProperty
	Name        string    `json:"name"         example:"Block A"                                                                          description:"Name of the property block"`
	Description *string   `json:"description"  example:"Very elegant place"                                                               description:"Optional description of the property block"`
	FloorsCount *int      `json:"floors_count" example:"3"                                                                                description:"Number of floors in the property block"`
	UnitsCount  int       `json:"units_count"  example:"3"                                                                                description:"Number of units in the property block"`
	Images      []string  `json:"images"       example:"https://example.com/image1.jpg,https://example.com/image2.jpg"                    description:"List of image URLs for the property block"`
	Status      string    `json:"status"       example:"PropertyBlock.Status.Active"                                                      description:"Current status of the property block"`
	CreatedAt   time.Time `json:"created_at"   example:"2023-01-01T00:00:00Z"                                          format:"date-time" description:"Timestamp when the property block was created"`
	UpdatedAt   time.Time `json:"updated_at"   example:"2023-01-01T00:00:00Z"                                          format:"date-time" description:"Timestamp when the property block was last updated"`
}

func DBPropertyBlockToRest(i *models.PropertyBlock) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":           i.ID.String(),
		"property_id":  i.PropertyID,
		"property":     DBPropertyToRest(&i.Property),
		"name":         i.Name,
		"description":  i.Description,
		"floors_count": i.FloorsCount,
		"units_count":  i.UnitsCount,
		"images":       i.Images,
		"status":       i.Status,
		"created_at":   i.CreatedAt,
		"updated_at":   i.UpdatedAt,
	}

	return data
}
