package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputClientUserProperty struct {
	ID           string            `json:"id"             example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b" format:"uuid"      description:"Unique identifier for the property"`
	Role         string            `json:"role"           example:"MANAGER"                                                 description:"Role of the user in the property (e.g., SINGLE, MULTI)"`
	PropertyID   string            `json:"property_id"    example:"b50874ee-1a70-436e-ba24-572078895982"                    description:"The ID of the client"`
	Property     OutputProperty    `json:"property"`
	ClientUserID string            `json:"client_user_id" example:"b50874ee-1a70-436e-ba24-572078895982"                    description:"The ID of the client"`
	ClientUser   OutputClientUser  `json:"client_user"`
	CreatedByID  *string           `json:"created_by_id"  example:"1e81fea0-5e8b-4535-b449-1a2133e94a7a"                    description:"The ID of the client user that created the property"`
	CreatedBy    *OutputClientUser `json:"created_by"`
	CreatedAt    time.Time         `json:"created_at"     example:"2023-01-01T00:00:00Z"                 format:"date-time" description:"Timestamp when the property was created"`
	UpdatedAt    time.Time         `json:"updated_at"     example:"2023-01-01T00:00:00Z"                 format:"date-time" description:"Timestamp when the property was last updated"`
}

func DBClientUserPropertyToRest(i *models.ClientUserProperty) interface{} {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]interface{}{
		"id":             i.ID.String(),
		"role":           i.Role,
		"client_user_id": i.ClientUserID,
		"client_user":    DBClientUserToRest(&i.ClientUser),
		"property_id":    i.PropertyID,
		"property":       DBPropertyToRest(&i.Property),
		"created_by_id":  i.CreatedByID,
		"created_by":     DBClientUserToRest(i.CreatedBy),
		"created_at":     i.CreatedAt,
		"updated_at":     i.UpdatedAt,
	}

	return data
}
