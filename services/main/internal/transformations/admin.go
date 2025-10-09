package transformations

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

// DBAdminToRestAdmin transforms the db admin model to a rest admin model
func DBAdminToRestAdmin(i *models.Admin, secret *string) interface{} {
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
