package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputProperty struct {
	ID          string           `json:"id"                    example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b" format:"uuid"      description:"Unique identifier for the property"`
	Slug        string           `json:"slug"                  example:"my-property-abcde1876drkjy"                              description:"Slug for the property"`
	Type        string           `json:"type"                  example:"SINGLE"                                                  description:"Type of the property (e.g., SINGLE, MULTI)"`
	Status      string           `json:"status"                example:"Property.Status.Active"                                  description:"Current status of the property"`
	Name        string           `json:"name"                  example:"My Property"                                             description:"Name of the property"`
	Description *string          `json:"description"           example:"Very elegant place"                                      description:"Optional description of the property"`
	Images      []string         `json:"images"                example:"http://www.images/hih.jpg"                               description:"List of image URLs for the property"`
	Tags        []string         `json:"tags"                  example:"apartment,downtown"                                      description:"Tags associated with the property"`
	Latitude    float64          `json:"latitude"              example:"5.6037"                                                  description:"Latitude coordinate of the property"`
	Longitude   float64          `json:"longitude"             example:"-0.1870"                                                 description:"Longitude coordinate of the property"`
	Address     string           `json:"address"               example:"123 Main St"                                             description:"Street address of the property"`
	Country     string           `json:"country"               example:"Ghana"                                                   description:"Country where the property is located"`
	Region      string           `json:"region"                example:"Greater Accra"                                           description:"Region or state of the property"`
	City        string           `json:"city"                  example:"Accra"                                                   description:"City where the property is located"`
	GPSAddress  *string          `json:"gps_address,omitempty" example:"GH-1234-5678"                                            description:"Optional GPS address or plus code"`
	ClientID    string           `json:"client_id"             example:"b50874ee-1a70-436e-ba24-572078895982"                    description:"The ID of the client"`
	Client      OutputClient     `json:"client"`
	CreatedByID string           `json:"created_by_id"         example:"1e81fea0-5e8b-4535-b449-1a2133e94a7a"                    description:"The ID of the client user that created the property"`
	CreatedBy   OutputClientUser `json:"created_by"`
	DeletedByID *string          `json:"deleted_by_id"         example:"1e81fea0-5e8b-4535-b449-1a2133e94a7a"                    description:"The ID of the client user that deleted (archived) the property, if any"`
	DeletedBy   OutputClientUser `json:"deleted_by"`
	BlocksCount int              `json:"blocks_count"          example:"2"                                                       description:"Current number of blocks under this property"`
	UnitsCount  int              `json:"units_count"           example:"6"                                                       description:"Current number of units under this property"`
	DeletedAt   *time.Time       `json:"deleted_at"            example:"2026-07-01T00:00:00Z"                 format:"date-time" description:"When the property was archived, if it has been"`
	CreatedAt   time.Time        `json:"created_at"            example:"2023-01-01T00:00:00Z"                 format:"date-time" description:"Timestamp when the property was created"`
	UpdatedAt   time.Time        `json:"updated_at"            example:"2023-01-01T00:00:00Z"                 format:"date-time" description:"Timestamp when the property was last updated"`
}

func DBPropertyToRest(i *models.Property) interface{} {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	var deletedAt *time.Time
	if i.DeletedAt.Valid {
		deletedAt = &i.DeletedAt.Time
	}

	data := map[string]interface{}{
		"id":            i.ID.String(),
		"slug":          i.Slug,
		"type":          i.Type,
		"status":        i.Status,
		"name":          i.Name,
		"description":   i.Description,
		"images":        i.Images,
		"tags":          i.Tags,
		"latitude":      i.Latitude,
		"longitude":     i.Longitude,
		"address":       i.Address,
		"country":       i.Country,
		"region":        i.Region,
		"city":          i.City,
		"gps_address":   i.GPSAddress,
		"currency":      i.Currency,
		"client_id":     i.ClientID,
		"client":        DBClientToRestClient(&i.Client),
		"created_by_id": i.CreatedByID,
		"created_by":    DBClientUserToRest(&i.CreatedBy),
		"deleted_by_id": i.DeletedByID,
		"deleted_by":    DBClientUserToRest(i.DeletedBy),
		"blocks_count":  i.BlocksCount,
		"units_count":   i.UnitsCount,
		"deleted_at":    deletedAt,
		"modes":         i.Modes,
		"created_at":    i.CreatedAt,
		"updated_at":    i.UpdatedAt,
	}

	return data
}

// for public
type PublicOutputProperty struct {
	ID          string             `json:"id"          example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b" format:"uuid" description:"Unique identifier for the property"`
	Slug        string             `json:"slug"        example:"my-property-abcde1876drkjy"                         description:"Slug for the property"`
	Type        string             `json:"type"        example:"SINGLE"                                             description:"Type of the property (e.g., SINGLE, MULTI)"`
	Status      string             `json:"status"      example:"Property.Status.Active"                             description:"Current status of the property"`
	Name        string             `json:"name"        example:"My Property"                                        description:"Name of the property"`
	Description *string            `json:"description" example:"Very elegant place"                                 description:"Optional description of the property"`
	Images      []string           `json:"images"      example:"http://www.images/hih.jpg"                          description:"List of image URLs for the property"`
	Tags        []string           `json:"tags"        example:"apartment,downtown"                                 description:"Tags associated with the property"`
	Latitude    float64            `json:"latitude"    example:"5.6037"                                             description:"Latitude coordinate of the property"`
	Longitude   float64            `json:"longitude"   example:"-0.1870"                                            description:"Longitude coordinate of the property"`
	Address     string             `json:"address"     example:"123 Main St"                                        description:"Street address of the property"`
	Country     string             `json:"country"     example:"Ghana"                                              description:"Country where the property is located"`
	Region      string             `json:"region"      example:"Greater Accra"                                      description:"Region or state of the property"`
	City        string             `json:"city"        example:"Accra"                                              description:"City where the property is located"`
	Client      PublicOutputClient `json:"client"`
}

func DBPublicPropertyToRest(i *models.Property) interface{} {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]interface{}{
		"id":          i.ID.String(),
		"slug":        i.Slug,
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
		"client":      DBClientToRestPublicClient(&i.Client),
	}

	return data
}
