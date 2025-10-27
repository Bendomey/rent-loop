package models

import "time"

// TenantApplication represents an application submitted by a prospective tenant for a specific unit.
type TenantApplication struct {
	BaseModelSoftDelete
	DesiredUnitId string `gorm:"not null;"`
	DesiredUnit   Unit

	DesiredMoveInDate       *time.Time
	DesiredStayDuration     *int64  // in months
	DesiredPaymentFrequency *string // Monthly, Quarterly, BiAnnually, Annually
	PreferredPaymentMethod  *string // BankTransfer, MobileMoney, Cash

	ApprovedMoveInDate         *time.Time // move in scheduled
	ApprovedMoveInById         *string
	ApprovedMovedInScheduledAt *time.Time
	ApprovedMoveInBy           *ClientUser

	Status               string `gorm:"not null;default:'TenantApplication.Status.Pending'"` // BasicInfoCompleted -> DocsSigned -> Paid -> MoveInScheduled -> Completed
	BasicInfoCompletedAt *time.Time

	// Docs [{type, name, url}]
	DocsSignedAt *time.Time

	PaidAt *time.Time

	CompletedAt   *time.Time
	CompletedById *string
	CompletedBy   *ClientUser

	FirstName       string `gorm:"not null;"`
	OtherNames      *string
	LastName        string `gorm:"not null;"`
	Email           *string
	Phone           string `gorm:"not null;"`
	Gender          string `gorm:"not null;"` // Male, Female
	DateOfBirth     string `gorm:"not null;"`
	Nationality     string `gorm:"not null;"`
	MaritalStatus   string `gorm:"not null;"` // Single, Married, Divorced, Widowed
	ProfilePhotoUrl *string
	IDType          string `gorm:"not null;"` // NationalID, Passport, DriverLicense
	IDNumber        string `gorm:"not null;"`
	IDFrontUrl      *string
	IDBackUrl       *string

	PreviousLandlordName  *string
	PreviousLandlordPhone *string
	PreviousTenancyPeriod *string

	CurrentAddress                 string
	EmergencyContactName           string `gorm:"not null;"`
	EmergencyContactPhone          string `gorm:"not null;"`
	RelationshipToEmergencyContact string `gorm:"not null;"`

	Occupation        string  `gorm:"not null;"` // student
	Employer          string  `gorm:"not null;"` // or school name
	OccupationAddress string  `gorm:"not null;"` // or school address
	ProofOfIncomeUrl  *string // or admission letter url
}
