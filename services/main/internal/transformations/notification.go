package transformations

import "github.com/Bendomey/rent-loop/services/main/internal/models"

func DBNotificationToRest(n *models.Notification) any {
	if n == nil {
		return nil
	}
	return map[string]any{
		"id":              n.ID.String(),
		"organization_id": n.OrganizationID,
		"recipient_id":    n.RecipientID,
		"recipient_type":  n.RecipientType,
		"event":           n.Event,
		"category":        n.Category,
		"visibility":      n.Visibility,
		"title":           n.Title,
		"body":            n.Body,
		"data":            n.Data,
		"read_at":         n.ReadAt,
		"status":          n.Status,
		"scheduled_at":    n.ScheduledAt,
		"expires_at":      n.ExpiresAt,
		"created_at":      n.CreatedAt,
		"updated_at":      n.UpdatedAt,
	}
}
