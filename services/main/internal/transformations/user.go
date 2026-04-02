package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputUser struct {
	ID          string             `json:"id"           example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Name        string             `json:"name"         example:"John Doe"`
	Email       string             `json:"email"        example:"john@example.com"`
	PhoneNumber string             `json:"phone_number" example:"+233281234569"`
	ClientUsers []OutputClientUser `json:"client_users"`
	CreatedAt   time.Time          `json:"created_at"   example:"2023-01-01T00:00:00Z"`
	UpdatedAt   time.Time          `json:"updated_at"   example:"2023-01-01T00:00:00Z"`
}

type OutputUserWithToken struct {
	User  OutputUser `json:"user"`
	Token string     `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
}

func DBUserToRest(u *models.User) interface{} {
	if u == nil || u.ID == uuid.Nil {
		return nil
	}

	clientUsers := make([]interface{}, 0, len(u.ClientUsers))
	for i := range u.ClientUsers {
		clientUsers = append(clientUsers, DBClientUserToRest(&u.ClientUsers[i]))
	}

	return map[string]interface{}{
		"id":           u.ID.String(),
		"name":         u.Name,
		"email":        u.Email,
		"phone_number": u.PhoneNumber,
		"created_at":   u.CreatedAt,
		"updated_at":   u.UpdatedAt,
		"client_users": clientUsers,
	}
}

func DBUserToRestWithToken(u *models.User, token string) interface{} {
	if u == nil {
		return nil
	}
	return map[string]interface{}{
		"user":  DBUserToRest(u),
		"token": token,
	}
}
