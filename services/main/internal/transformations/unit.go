package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type AdminOutputUnit struct {
	ID                  string              `json:"id"                    example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b" format:"uuid"      description:"Unique identifier for the unit"`
	Slug                string              `json:"slug"                  example:"unit-101-abcde1876drkjy"                                 description:"Slug for the unit"`
	Name                string              `json:"name"                  example:"Unit 101"                                                description:"Name of the unit"`
	Description         *string             `json:"description"           example:"Spacious apartment with balcony"                         description:"Optional description of the unit"`
	Images              []string            `json:"images"                example:"http://www.images/unit101.jpg"                           description:"List of image URLs for the unit"`
	Tags                []string            `json:"tags"                  example:"apartment,balcony"                                       description:"Tags associated with the unit"`
	Type                string              `json:"type"                  example:"APARTMENT"                                               description:"Type of the unit (e.g., APARTMENT, HOUSE, STUDIO, OFFICE, RETAIL)"`
	Status              string              `json:"status"                example:"Unit.Status.Available"                                   description:"Current status of the unit (e.g., Unit.Status.Draft Unit.Status.Available Unit.Status.Occupied Unit.Status.Maintenance)"`
	Area                *float64            `json:"area"                  example:"120.5"                                                   description:"Area of the unit in square feet or square meters"`
	RentFee             int64               `json:"rent_fee"              example:"1500"                                                    description:"Monthly rent amount"`
	RentFeeCurrency     string              `json:"rent_fee_currency"     example:"USD"                                                     description:"Currency for the rent fee"`
	PaymentFrequency    string              `json:"payment_frequency"     example:"MONTHLY"                                                 description:"Payment frequency (e.g., WEEKLY, DAILY, MONTHLY, Quarterly, BiAnnually, Annually)"`
	MaxOccupantsAllowed int                 `json:"max_occupants_allowed" example:"4"                                                       description:"Maximum number of occupants allowed"`
	Features            map[string]any      `json:"features"                                                                                description:"Additional metadata in JSON format"`
	PropertyID          string              `json:"property_id"           example:"b50874ee-1a70-436e-ba24-572078895982" format:"uuid"      description:"ID of the property this unit belongs to"`
	Property            OutputProperty      `json:"property"`
	PropertyBlockID     string              `json:"property_block_id"     example:"a12345ee-1a70-436e-ba24-572078895982" format:"uuid"      description:"ID of the property block this unit belongs to"`
	PropertyBlock       OutputPropertyBlock `json:"property_block"`
	CreatedByID         string              `json:"created_by_id"         example:"1e81fea0-5e8b-4535-b449-1a2133e94a7a" format:"uuid"      description:"ID of the client user that created the unit"`
	CreatedBy           OutputClientUser    `json:"created_by"`
	CreatedAt           time.Time           `json:"created_at"            example:"2023-01-01T00:00:00Z"                 format:"date-time" description:"Timestamp when the unit was created"`
	UpdatedAt           time.Time           `json:"updated_at"            example:"2023-01-01T00:00:00Z"                 format:"date-time" description:"Timestamp when the unit was last updated"`
}

func DBAdminUnitToRest(i *models.Unit) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":                    i.ID.String(),
		"slug":                  i.Slug,
		"name":                  i.Name,
		"description":           i.Description,
		"images":                i.Images,
		"tags":                  i.Tags,
		"type":                  i.Type,
		"status":                i.Status,
		"area":                  i.Area,
		"rent_fee":              i.RentFee,
		"rent_fee_currency":     i.RentFeeCurrency,
		"payment_frequency":     i.PaymentFrequency,
		"max_occupants_allowed": i.MaxOccupantsAllowed,
		"features":              i.Features,
		"property_id":           i.PropertyID,
		"property":              DBPropertyToRest(&i.Property),
		"property_block_id":     i.PropertyBlockID,
		"property_block":        DBPropertyBlockToRest(&i.PropertyBlock),
		"created_by_id":         i.CreatedById,
		"created_by":            DBClientUserToRest(&i.CreatedBy),
		"created_at":            i.CreatedAt,
		"updated_at":            i.UpdatedAt,
	}
	return data
}

type OutputUnit struct {
	ID               string         `json:"id"                example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b" format:"uuid" description:"Unique identifier for the unit"`
	Slug             string         `json:"slug"              example:"unit-101-abcde1876drkjy"                            description:"Slug for the unit"`
	Name             string         `json:"name"              example:"Unit 101"                                           description:"Name of the unit"`
	Description      *string        `json:"description"       example:"Spacious apartment with balcony"                    description:"Optional description of the unit"`
	Images           []string       `json:"images"            example:"http://www.images/unit101.jpg"                      description:"List of image URLs for the unit"`
	Tags             []string       `json:"tags"              example:"apartment,balcony"                                  description:"Tags associated with the unit"`
	Type             string         `json:"type"              example:"APARTMENT"                                          description:"Type of the unit (e.g., APARTMENT, HOUSE, STUDIO, OFFICE, RETAIL)"`
	Area             *float64       `json:"area"              example:"120.5"                                              description:"Area of the unit in square feet or square meters"`
	RentFee          int64          `json:"rent_fee"          example:"1500"                                               description:"Monthly rent amount"`
	RentFeeCurrency  string         `json:"rent_fee_currency" example:"USD"                                                description:"Currency for the rent fee"`
	PaymentFrequency string         `json:"payment_frequency" example:"MONTHLY"                                            description:"Payment frequency (e.g., WEEKLY, DAILY, MONTHLY, Quarterly, BiAnnually, Annually)"`
	Features         map[string]any `json:"features"                                                                       description:"Additional metadata in JSON format"`
}

func DBUnitToRest(i *models.Unit) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":                i.ID.String(),
		"slug":              i.Slug,
		"name":              i.Name,
		"description":       i.Description,
		"images":            i.Images,
		"tags":              i.Tags,
		"type":              i.Type,
		"area":              i.Area,
		"rent_fee":          i.RentFee,
		"rent_fee_currency": i.RentFeeCurrency,
		"payment_frequency": i.PaymentFrequency,
		"features":          i.Features,
	}
	return data
}
