package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

type OutputAnnouncement struct {
	ID          string     `json:"id"                     example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Title       string     `json:"title"                  example:"Water Outage Notice"`
	Content     string     `json:"content"                example:"Water will be unavailable on Monday from 8am-12pm."`
	Type        string     `json:"type"                   example:"MAINTENANCE"`
	Priority    string     `json:"priority"               example:"IMPORTANT"`
	Status      string     `json:"status"                 example:"PUBLISHED"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"             example:"2023-01-01T00:00:00Z"`
}

type AdminOutputAnnouncement struct {
	OutputAnnouncement
	ScheduledAt     *time.Time        `json:"scheduled_at,omitempty"`
	PropertyID      *string           `json:"property_id,omitempty"       example:"550e8400-e29b-41d4-a716-446655440000"`
	Property        *OutputProperty   `json:"property,omitempty"`
	PropertyBlockID *string           `json:"property_block_id,omitempty" example:"660e8400-e29b-41d4-a716-446655440001"`
	TargetUnitIDs   []string          `json:"target_unit_ids"`
	ClientID        string            `json:"client_id"                   example:"770e8400-e29b-41d4-a716-446655440002"`
	CreatedById     string            `json:"created_by_id"               example:"d290f1ee-6c54-4b01-90e6-d701748f0851"`
	CreatedBy       *OutputClientUser `json:"created_by,omitempty"`
	UpdatedAt       time.Time         `json:"updated_at"                  example:"2023-01-01T00:00:00Z"`
}

// DBAnnouncementToRest transforms an Announcement model to its REST representation.
func DBAnnouncementToRest(i *models.Announcement) any {
	if i == nil {
		return nil
	}

	targetUnitIDs := []string{}
	if i.TargetUnitIDs != nil {
		targetUnitIDs = i.TargetUnitIDs
	}

	return map[string]any{
		"id":                i.ID.String(),
		"title":             i.Title,
		"content":           i.Content,
		"type":              i.Type,
		"priority":          i.Priority,
		"status":            i.Status,
		"scheduled_at":      i.ScheduledAt,
		"published_at":      i.PublishedAt,
		"expires_at":        i.ExpiresAt,
		"property_id":       i.PropertyID,
		"property":          DBPropertyToRest(i.Property),
		"property_block_id": i.PropertyBlockID,
		"target_unit_ids":   targetUnitIDs,
		"client_id":         i.ClientID,
		"created_by_id":     i.CreatedById,
		"created_by":        DBClientUserToRest(&i.CreatedBy),
		"created_at":        i.CreatedAt,
		"updated_at":        i.UpdatedAt,
	}
}

// DBAnnouncementToTenantRest transforms an Announcement model to its tenant-facing REST representation.
func DBAnnouncementToTenantRest(i *models.Announcement) any {
	if i == nil {
		return nil
	}

	return map[string]any{
		"id":           i.ID.String(),
		"title":        i.Title,
		"content":      i.Content,
		"type":         i.Type,
		"priority":     i.Priority,
		"status":       i.Status,
		"published_at": i.PublishedAt,
		"expires_at":   i.ExpiresAt,
		"created_at":   i.CreatedAt,
	}
}
