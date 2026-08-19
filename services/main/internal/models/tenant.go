package models

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/getsentry/raven-go"
	"gorm.io/gorm"
)

// Tenant represents a tenant in the system.
type Tenant struct {
	BaseModelSoftDelete
	Code string `gorm:"uniqueIndex;"`

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

	CreatedById *string
	CreatedBy   *ClientUser

	TenantAccount *TenantAccount `gorm:"foreignKey:TenantId"`

	Leases   []Lease   `gorm:"foreignKey:TenantId"`
	Bookings []Booking `gorm:"foreignKey:TenantID"`
}

// BeforeCreate stamps every new tenant with its code.
func (t *Tenant) BeforeCreate(tx *gorm.DB) error {
	uniqueCode, genErr := lib.GeneratePrefixedCode(tx, &Tenant{}, "TEN")
	if genErr != nil {
		raven.CaptureError(genErr, map[string]string{
			"function": "BeforeCreateTenantHook",
			"action":   "Generating a unique code",
		})

		return genErr
	}

	t.Code = *uniqueCode

	return nil
}
