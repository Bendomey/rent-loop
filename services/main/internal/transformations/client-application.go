package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

type OutputClientApplication struct {
	ID      string `json:"id" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Type    string `json:"type" example:"COMPANY"`
	SubType string `json:"sub_type" example:"ESTATE MANAGER"`
	Name    string `json:"name" example:"Company Name"`

	// company address or individual home address
	Address   string  `json:"address" example:"21st Neon Street"`
	Country   string  `json:"country" example:"Ghana"`
	Region    string  `json:"region" example:"Greater Accra"`
	City      string  `json:"city" example:"Accra"`
	Latitude  float64 `json:"latitude" example:"5.6037"`
	Longitude float64 `json:"longitude" example:"-0.1870"`

	// company specific fields
	RegistrationNumber *string `json:"registration_number" example:"GR1234567890"`
	LogoURL            *string `json:"logo_url" example:"www.logo-url.com/logo.png"`
	Description        *string `json:"description" example:"Taking you to the next level!"`
	WebsiteURL         *string `json:"website_url" example:"www.company-url.com"`
	SupportEmail       *string `json:"support_email" example:"support@email.com"`
	SupportPhone       *string `json:"support_phone" example:"+233 (0)12 345 6789"`

	// individual specific fields
	DateOfBirth   *string `json:"date_of_birth" example:"2025-01-31"`
	IDType        *string `json:"id_type" example:"GHANACARD"`
	IDNumber      *string `json:"id_number" example:"GHA-123-456-7890"`
	IDExpiry      *string `json:"id_expiry" example:"2040-12-31"`
	IDDocumentURL *string `json:"id_document_url" example:"www.id-doc-url.com/id.pdf"`

	ContactName        string `json:"contact_name" example:"John Doe"`
	ContactPhoneNumber string `json:"contact_phone_number" example:"01234567890"`
	ContactEmail       string `json:"contact_email" example:"contact@email.com"`

	Status string `json:"status" example:"ClientApplication.Status.Approved"`

	ApprovedById *string `json:"approved_by_id" example:"S90092"`

	RejectedById    *string      `json:"rejected_by_id" example:"R234110"`
	RejectedBy      *OutputAdmin `json:"rejected_by,omitempty"`
	RejectedBecause *string      `json:"rejected_because" example:"No reason"`

	CreatedAt time.Time `json:"created_at" example:"2023-01-01T00:00:00Z"`
	UpdatedAt time.Time `json:"updated_at" example:"2023-01-01T00:00:00Z"`
}

// DBClientApplicationToRestClientApplication transforms the db client application model to a rest client application model
func DBClientApplicationToRestClientApplication(i *models.ClientApplication) interface{} {
	if i == nil {
		return nil
	}

	data := map[string]interface{}{
		"id":                   i.ID.String(),
		"type":                 i.Type,
		"sub_type":             i.SubType,
		"name":                 i.Name,
		"address":              i.Address,
		"country":              i.Country,
		"region":               i.Region,
		"city":                 i.City,
		"latitude":             i.Latitude,
		"longitude":            i.Longitude,
		"registration_number":  i.RegistrationNumber,
		"logo_url":             i.LogoURL,
		"description":          i.Description,
		"website_url":          i.WebsiteURL,
		"support_email":        i.SupportEmail,
		"support_phone":        i.SupportPhone,
		"date_of_birth":        i.DateOfBirth,
		"id_type":              i.IDType,
		"id_number":            i.IDNumber,
		"id_expiry":            i.IDExpiry,
		"id_document_url":      i.IDDocumentURL,
		"contact_name":         i.ContactName,
		"contact_phone_number": i.ContactPhoneNumber,
		"contact_email":        i.ContactEmail,
		"status":               i.Status,
		"approved_by_id":       i.ApprovedById,
		"rejected_by_id":       i.RejectedById,
		"rejected_by":          DBAdminToRestAdmin(i.RejectedBy),
		"rejected_because":     i.RejectedBecause,
		"created_at":           i.CreatedAt,
		"updated_at":           i.UpdatedAt,
	}

	return data
}
