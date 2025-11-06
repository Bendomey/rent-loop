package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputClientUser struct {
	ID          string       `json:"id"            example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	ClientID    string       `json:"client_id"     example:"e4ad26d4-d7e9-4599-a246-5e88abba6083"`
	Client      OutputClient `json:"client"`
	Name        string       `json:"name"          example:"Client User Name"`
	PhoneNumber string       `json:"phone_number"  example:"+233281234569"`
	Email       string       `json:"email"         example:"client-user@example.com"`
	Role        string       `json:"role"          example:"STAFF"`
	CreatedAt   time.Time    `json:"created_at"    example:"2023-01-01T00:00:00Z"`
	UpdatedAt   time.Time    `json:"updated_at"    example:"2023-01-01T00:00:00Z"`
	CreatedByID string       `json:"created_by_id" example:"0205126b-9bbb-4a98-960a-e87d8f095335"`
}

func DBClientUserToRest(i *models.ClientUser) interface{} {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]interface{}{
		"id":            i.ID.String(),
		"name":          i.Name,
		"client_id":     i.ClientID,
		"client":        DBClientToRestClient(&i.Client),
		"phone_number":  i.PhoneNumber,
		"email":         i.Email,
		"role":          i.Role,
		"created_at":    i.CreatedAt,
		"updated_at":    i.UpdatedAt,
		"created_by_id": i.CreatedByID,
		"created_by":    DBClientUserToRest(i.CreatedBy),
	}

	return data
}

type OutputClientUserWithToken struct {
	ClientUser OutputClientUser `json:"client_user"`
	Token      string           `json:"token"       example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw"`
}

func DBClientUserToRestWithToken(i *models.ClientUser, token string) interface{} {
	if i == nil {
		return nil
	}

	data := map[string]interface{}{
		"client_user": DBClientUserToRest(i),
		"token":       token,
	}
	return data
}
