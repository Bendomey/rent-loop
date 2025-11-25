package models

import "time"

// Tenant represents a tenant in the system.
type Tenant struct {
	BaseModelSoftDelete

	FirstName       string `gorm:"not null;"`
	OtherNames      *string
	LastName        string `gorm:"not null;"`
	Email           *string
	Phone           string    `gorm:"not null;uniqueIndex;"`
	Gender          string    `gorm:"not null;"` // Male, Female
	DateOfBirth     time.Time `gorm:"not null;"`
	Nationality     string    `gorm:"not null;"`
	MaritalStatus   string    `gorm:"not null;"` // Single, Married, Divorced, Widowed
	ProfilePhotoUrl *string
	IDType          string `gorm:"not null;"` // NationalID, Passport, DriverLicense
	IDNumber        string `gorm:"not null;"`
	IDFrontUrl      *string
	IDBackUrl       *string

	EmergencyContactName           string `gorm:"not null;"`
	EmergencyContactPhone          string `gorm:"not null;"`
	RelationshipToEmergencyContact string `gorm:"not null;"`

	Occupation        string  `gorm:"not null;"` // student
	Employer          string  `gorm:"not null;"` // or school name
	OccupationAddress string  `gorm:"not null;"` // or school address
	ProofOfIncomeUrl  *string // or admission letter url

	CreatedById string `gorm:"not null;"`
	CreatedBy   ClientUser
}
