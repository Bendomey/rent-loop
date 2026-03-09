package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputTenantAccount struct {
	ID                string    `json:"id"                           example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	TenantId          string    `json:"tenant_id"                    example:"7ace5dc8-8114-4ab2-a94b-b4536c27f43b"`
	PhoneNumber       string    `json:"phone_number"                 example:"+233281234569"`
	NotificationToken *string   `json:"notification_token,omitempty" example:"fcm-token-abc123"`
	CreatedAt         time.Time `json:"created_at"                   example:"2024-06-01T09:00:00Z"`
	UpdatedAt         time.Time `json:"updated_at"                   example:"2024-06-10T09:00:00Z"`
}

func DBTenantAccountToRest(i *models.TenantAccount) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	return map[string]any{
		"id":                 i.ID,
		"tenant_id":          i.TenantId,
		"phone_number":       i.PhoneNumber,
		"notification_token": i.NotificationToken,
		"created_at":         i.CreatedAt,
		"updated_at":         i.UpdatedAt,
	}
}
