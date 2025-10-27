package models

// ClientApplication represents a property owner (landlord/developer/etc) application in the system.
type ClientApplication struct {
	BaseModelSoftDelete
	Type    string `gorm:"not null;index;"` // INDIVIDUAL | COMPANY
	SubType string `gorm:"not null;index;"` // INDIVIDUAL = LANDLORD; COMPANY = PROPERTY_MANAGER | DEVELOPER | AGENCY
	Name    string `gorm:"not null;"`       // company name or individual full name

	// company address or individual home address
	Address   string  `gorm:"not null;"`
	Country   string  `gorm:"not null;"`
	Region    string  `gorm:"not null;"`
	City      string  `gorm:"not null;"`
	Latitude  float64 `gorm:"not null;"`
	Longitude float64 `gorm:"not null;"`

	// company specific fields
	RegistrationNumber *string // company registration number
	LogoURL            *string // company logo URL or individual profile picture URL
	Description        *string // company description or individual bio
	WebsiteURL         *string // company website URL
	SupportEmail       *string // company support email
	SupportPhone       *string // company support phone number

	// individual specific fields
	DateOfBirth   *string // individual date of birth
	IDType        *string // individual ID type (e.g., passport, driver's license)
	IDNumber      *string // individual ID number
	IDExpiry      *string // individual ID expiry date
	IDDocumentURL *string // URL to the scanned copy of the ID document

	ContactName        string `gorm:"not null;"`
	ContactPhoneNumber string `gorm:"not null;"`
	ContactEmail       string `gorm:"not null;"`

	Status string `gorm:"not null;index;default:'ClientApplication.Status.Pending'"` // ClientApplication.Status.Pending | ClientApplication.Status.Approved | ClientApplication.Status.Rejected

	ApprovedById *string
	ApprovedBy   *Admin

	RejectedById    *string
	RejectedBy      *Admin
	RejectedBecause *string
}
