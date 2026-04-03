package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
)

type OutputAgreement struct {
	ID              string    `json:"id"                example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Name            string    `json:"name"              example:"Landlord Agreement"`
	Version         string    `json:"version"           example:"v1.0"`
	Content         string    `json:"content"`
	EffectiveDate   time.Time `json:"effective_date"    example:"2026-04-03T00:00:00Z"`
	IsActive        bool      `json:"is_active"         example:"true"`
	UserHasAccepted bool      `json:"user_has_accepted" example:"false"`
	CreatedAt       time.Time `json:"created_at"        example:"2026-04-03T00:00:00Z"`
	UpdatedAt       time.Time `json:"updated_at"        example:"2026-04-03T00:00:00Z"`
}

func AgreementWithAcceptanceToRest(a services.AgreementWithAcceptance) map[string]interface{} {
	return map[string]interface{}{
		"id":                a.Agreement.ID.String(),
		"name":              a.Agreement.Name,
		"version":           a.Agreement.Version,
		"content":           a.Agreement.Content,
		"effective_date":    a.Agreement.EffectiveDate,
		"is_active":         a.Agreement.IsActive,
		"user_has_accepted": a.UserHasAccepted,
		"created_at":        a.Agreement.CreatedAt,
		"updated_at":        a.Agreement.UpdatedAt,
	}
}

func AgreementToRest(a *models.Agreement) map[string]interface{} {
	if a == nil {
		return nil
	}
	return map[string]interface{}{
		"id":             a.ID.String(),
		"name":           a.Name,
		"version":        a.Version,
		"content":        a.Content,
		"effective_date": a.EffectiveDate,
		"is_active":      a.IsActive,
		"created_at":     a.CreatedAt,
		"updated_at":     a.UpdatedAt,
	}
}
