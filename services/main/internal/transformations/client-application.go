package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

type OutputClientApplication struct {
	ID      string `json:"id" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Type    string `json:"type" example:"COMPANY"`           // INDIVIDUAL | COMPANY
	SubType string `json:"subType" example:"ESTATE MANAGER"` // INDIVIDUAL = LANDLORD; COMPANY = PROPERTY_MANAGER | DEVELOPER | AGENCY
	Name    string `json:"name" example:"Company Nmae"`      // company name or individual full name

	// company address or individual home address
	Address   string  `json:"address" example:"21st Neon Street"`
	Country   string  `json:"country" example:"Ghana"`
	Region    string  `json:"region" example:"Greater Accra"`
	City      string  `json:"city" example:"Kwabenya"`
	Latitude  float64 `json:"latitude" example:"23"`
	Longitude float64 `json:"longitude" example:"49"`

	// company specific fields
	RegistrationNumber *string `json:"registrationNumber" example:"GR1234567890"`           // company registration number
	LogoURL            *string `json:"logoUrl" example:"www.logo-url.com/logo.png"`         // company logo URL or individual profile picture URL
	Description        *string `json:"description" example:"Taking you to the next level!"` // company description or individual bio
	WebsiteURL         *string `json:"websiteUrl" example:"www.company-url.com"`            // company website URL
	SupportEmail       *string `json:"supportEmail" example:"support@email.com"`            // company support email
	SupportPhone       *string `json:"supportPhone" example:"+233 (0)12 345 6789"`          // company support phone number

	// individual specific fields
	DateOfBirth   *string `json:"dateOfBirth" example:"2025-01-31"`                  // individual date of birth
	IDType        *string `json:"idType" example:"GHANACARD"`                        // individual ID type (e.g., passport, driver's license)
	IDNumber      *string `json:"idNumber" example:"GHA-123-456-7890"`               // individual ID number
	IDExpiry      *string `json:"idExpiry" example:"2040-12-31"`                     // individual ID expiry date
	IDDocumentURL *string `json:"idDocumentUrl" example:"www.id-doc-url.com/id.pdf"` // URL to the scanned copy of the ID document

	ContactName        string `json:"contactName" example:"John Doe"`
	ContactPhoneNumber string `json:"contactPhoneNumber" example:"01234567890"`
	ContactEmail       string `json:"contactEmail" example:"contact@email.com"`

	Status string `json:"status" example:"Approved"` // ClientApplication.Status.Pending | ClientApplication.Status.Approved | ClientApplication.Status.Rejected

	ApprovedById *string `json:"approvedById" example:"S90092"`

	RejectedById    *string `json:"rejectedById" example:"R234110"`
	RejectedBecause *string `json:"rejectedBecause" example:"No reason"`

	CreatedAt time.Time `json:"created_at" example:"2023-01-01T00:00:00Z"`
	UpdatedAt time.Time `json:"updated_at" example:"2023-01-01T00:00:00Z"`
}

// DBClientApplicationToRestClientApplication transforms the db client application model to a rest client application model
func DBClientApplicationToRestClientApplication(i *models.ClientApplication) interface{} {
	if i == nil {
		return nil
	}

	data := map[string]interface{}{
		"id":                 i.ID.String(),
		"type":               i.Type,
		"sub_type":           i.SubType,
		"name":               i.Name,
		"address":            i.Address,
		"country":            i.Country,
		"region":             i.Region,
		"city":               i.City,
		"latitude":           i.Latitude,
		"longitude":          i.Longitude,
		"registrationNumber": i.RegistrationNumber,
		"logoUrl":            i.LogoURL,
		"description":        i.Description,
		"websiteUrl":         i.WebsiteURL,
		"supportEmail":       i.SupportEmail,
		"supportPhone":       i.SupportPhone,
		"dateOfBirth":        i.DateOfBirth,
		"idType":             i.IDType,
		"idNumber":           i.IDNumber,
		"idExpiry":           i.IDExpiry,
		"idDocumentUrl":      i.IDDocumentURL,
		"contactName":        i.ContactName,
		"contactPhoneNumber": i.ContactPhoneNumber,
		"contactEmail":       i.ContactEmail,
		"status":             i.Status,
		"approvedById":       i.ApprovedById,
		"rejectedById":       i.RejectedById,
		"rejectedBecause":    i.RejectedBecause,
		"created_at":         i.CreatedAt,
		"updated_at":         i.UpdatedAt,
	}

	return data
}
