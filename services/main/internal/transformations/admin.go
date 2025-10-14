package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

type OutputAdmin struct {
	ID        string    `json:"id" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Name      string    `json:"name" example:"Admin Name"`
	Email     string    `json:"email" example:"admin@example.com"`
	CreatedAt time.Time `json:"created_at" example:"2023-01-01T00:00:00Z"`
	UpdatedAt time.Time `json:"updated_at" example:"2023-01-01T00:00:00Z"`
}

// DBAdminToRestAdmin transforms the db admin model to a rest admin model
func DBAdminToRestAdmin(i *models.Admin) interface{} {
	if i == nil {
		return nil
	}

	data := map[string]interface{}{
		"id":         i.ID.String(),
		"name":       i.Name,
		"email":      i.Email,
		"created_at": i.CreatedAt,
		"updated_at": i.UpdatedAt,
	}

	return data
}

type OutputAdminWithToken struct {
	Admin OutputAdmin `json:"admin"`
	Token string      `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw"`
}

func DBAdminWithTokenToRestAdminWithToken(i *models.Admin, token string) interface{} {
	if i == nil {
		return nil
	}

	data := map[string]interface{}{
		"admin": DBAdminToRestAdmin(i),
		"token": token,
	}

	return data
}
