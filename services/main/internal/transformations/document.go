package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

type OutputAdminDocument struct {
	ID          string            `json:"id"                      example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Title       string            `json:"title"                   example:"Lease Agreement"`
	Content     string            `json:"content"`
	Size        int64             `json:"size"                    example:"2048"`
	Tags        []string          `json:"tags"                    example:"LEASE_AGREEMENT,INSPECTION_REPORT"`
	PropertyID  *string           `json:"property_id,omitempty"   example:"550e8400-e29b-41d4-a716-446655440000"`
	Property    *OutputProperty   `json:"property,omitempty"`
	CreatedById string            `json:"created_by_id"           example:"d290f1ee-6c54-4b01-90e6-d701748f0851"`
	CreatedBy   *OutputClientUser `json:"created_by,omitempty"`
	UpdatedById *string           `json:"updated_by_id,omitempty" example:"c290f1ee-6c54-4b01-90e6-d701748f0852"`
	UpdatedBy   *OutputClientUser `json:"updated_by,omitempty"`
	CreatedAt   time.Time         `json:"created_at"              example:"2023-01-01T00:00:00Z"`
	UpdatedAt   time.Time         `json:"updated_at"              example:"2023-01-01T00:00:00Z"`
}

// DBAdminDocumentToRestDocument transforms the db document model to a rest document model
func DBAdminDocumentToRestDocument(i *models.Document) interface{} {
	if i == nil {
		return nil
	}

	data := map[string]interface{}{
		"id":            i.ID.String(),
		"title":         i.Title,
		"content":       string(i.Content),
		"size":          i.Size,
		"tags":          i.Tags,
		"property_id":   i.PropertyID,
		"property":      DBPropertyToRest(i.Property),
		"created_by_id": i.CreatedByID,
		"created_by":    DBClientUserToRest(i.CreatedBy),
		"updated_by_id": i.UpdatedByID,
		"updated_by":    DBClientUserToRest(i.UpdatedBy),
		"created_at":    i.CreatedAt,
		"updated_at":    i.UpdatedAt,
	}

	return data
}

type OutputDocument struct {
	ID      string   `json:"id"      example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Title   string   `json:"title"   example:"Lease Agreement"`
	Content string   `json:"content"`
	Size    int64    `json:"size"    example:"2048"`
	Tags    []string `json:"tags"    example:"LEASE_AGREEMENT,INSPECTION_REPORT"`
}

// DBDocumentToRestDocument transforms the db document model to a rest document model
func DBDocumentToRestDocument(i *models.Document) interface{} {
	if i == nil {
		return nil
	}

	data := map[string]interface{}{
		"id":      i.ID.String(),
		"title":   i.Title,
		"content": string(i.Content),
		"size":    i.Size,
		"tags":    i.Tags,
	}

	return data
}
