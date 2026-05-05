package models

import "time"

// Tenant represents a tenant in the system.
type Tenant struct {
	BaseModelSoftDelete

	FirstName       string `gorm:"not null;"`
	OtherNames      *string
	LastName        string `gorm:"not null;"`
	Email           *string
	Phone           string `gorm:"not null;uniqueIndex;"`
	Gender          string `gorm:"not null;"` // MALE, FEMALE
	DateOfBirth     *time.Time
	Nationality     *string
	MaritalStatus   *string // SINGLE, MARRIED, DIVORCED, WIDOWED
	ProfilePhotoUrl *string
	IDType          *string // NATIONAL_ID, PASSPORT, DRIVER_LICENSE
	IDNumber        *string
	IDFrontUrl      *string
	IDBackUrl       *string

	EmergencyContactName           *string
	EmergencyContactPhone          *string
	RelationshipToEmergencyContact *string

	Occupation        *string // student
	Employer          *string // or school name
	OccupationAddress *string // or school address
	ProofOfIncomeUrl  *string // or admission letter url

	CreatedById string `gorm:"not null;"`
	CreatedBy   ClientUser

	TenantAccount *TenantAccount `gorm:"foreignKey:TenantId"`
}
