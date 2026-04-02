package transformations

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

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
