package models

// ClientApplication represents a property owner (landlord/developer/etc) application in the system.
type ClientApplication struct {
	BaseModelSoftDelete
	Type    string `json:"type"    gorm:"not null;index;"` // INDIVIDUAL | COMPANY
	SubType string `json:"subType" gorm:"not null;index;"` // INDIVIDUAL = LANDLORD; COMPANY = PROPERTY_MANAGER | DEVELOPER | AGENCY
	Name    string `json:"name"    gorm:"not null;"`       // company name or individual full name

	// company address or individual home address
	Address   string  `json:"address"   gorm:"not null;"`
	Country   string  `json:"country"   gorm:"not null;"`
	Region    string  `json:"region"    gorm:"not null;"`
	City      string  `json:"city"      gorm:"not null;"`
	Latitude  float64 `json:"latitude"  gorm:"not null;"`
	Longitude float64 `json:"longitude" gorm:"not null;"`

	// company specific fields
	RegistrationNumber *string `json:"registrationNumber"` // company registration number
	LogoURL            *string `json:"logoUrl"`            // company logo URL or individual profile picture URL
	Description        *string `json:"description"`        // company description or individual bio
	WebsiteURL         *string `json:"websiteUrl"`         // company website URL
	SupportEmail       *string `json:"supportEmail"`       // company support email
	SupportPhone       *string `json:"supportPhone"`       // company support phone number

	// individual specific fields
	DateOfBirth   *string `json:"dateOfBirth"`   // individual date of birth
	IDType        *string `json:"idType"`        // individual ID type (e.g., passport, driver's license)
	IDNumber      *string `json:"idNumber"`      // individual ID number
	IDExpiry      *string `json:"idExpiry"`      // individual ID expiry date
	IDDocumentURL *string `json:"idDocumentUrl"` // URL to the scanned copy of the ID document

	ContactName        string `json:"contactName"        gorm:"not null;"`
	ContactPhoneNumber string `json:"contactPhoneNumber" gorm:"not null;"`
	ContactEmail       string `json:"contactEmail"       gorm:"not null;"`

	Status string `json:"status" gorm:"not null;index;default:'ClientApplication.Status.Pending'"` // ClientApplication.Status.Pending | ClientApplication.Status.Approved | ClientApplication.Status.Rejected

	ApprovedById *string `json:"approvedById"`
	ApprovedBy   *Admin  `json:"approvedBy"   gorm:"foreignKey:ApprovedById;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	RejectedById    *string `json:"rejectedById"`
	RejectedBy      *Admin  `json:"rejectedBy"      gorm:"foreignKey:RejectedById;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	RejectedBecause *string `json:"rejectedBecause"`
}
