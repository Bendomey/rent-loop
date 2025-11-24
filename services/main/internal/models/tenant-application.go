package models

import (
	"time"
)

// TenantApplication represents an application submitted by a prospective tenant for a specific unit.
// BasicInfoCompleted -> DocsSigned -> Paid -> MoveInScheduled -> Completed
type TenantApplication struct {
	BaseModelSoftDelete
	Status string `gorm:"not null;default:'TenantApplication.Status.InProgress'"` // TenantApplication.Status.InProgress, TenantApplication.Status.Cancelled, TenantApplication.Status.Completed

	CompletedAt   *time.Time
	CompletedById *string
	CompletedBy   *ClientUser

	CancelledAt   *time.Time
	CancelledById *string
	CancelledBy   *ClientUser

	DesiredUnitId string `gorm:"not null;"`
	DesiredUnit   Unit

	// move in details
	DesiredMoveInDate     *time.Time
	StayDurationFrequency *string // hours, days, months
	StayDuration          *int64

	// financial setup
	RentFee          int64   `gorm:"not null;"` // we can inherit from unit and then make arrangement for updates!
	RentFeeCurrency  string  `gorm:"not null;"`
	PaymentFrequency *string // Hourly, Daily, Monthly, Quarterly, BiAnnually, Annually, OneTime

	InitialDepositFee             *int64
	InitialDepositPaymentMethod   *string // ONLINE | CASH | EXTERNAL
	InitialDepositReferenceNumber *string
	InitialDepositPaidAt          *time.Time
	InitialDepositPaymentId       *string
	InitialDepositPayment         *Payment

	SecurityDepositFee         *int64 // if it's null or 0 then it's not opted in!
	SecurityDepositFeeCurrency *string

	SecurityDepositPaymentMethod   *string // ONLINE | CASH | EXTERNAL
	SecurityDepositReferenceNumber *string
	SecurityDepositPaidAt          *time.Time
	SecurityDepositPaymentId       *string
	SecurityDepositPayment         *Payment

	// Basic details
	FirstName       string `gorm:"not null;"`
	OtherNames      *string
	LastName        string `gorm:"not null;"`
	Email           *string
	Phone           string    `gorm:"not null;"`
	Gender          string    `gorm:"not null;"` // Male, Female
	DateOfBirth     time.Time `gorm:"not null;"`
	Nationality     string    `gorm:"not null;"`
	MaritalStatus   string    `gorm:"not null;"` // Single, Married, Divorced, Widowed
	ProfilePhotoUrl *string
	IDNumber        string `gorm:"not null;"` // GhanaCard
	IDFrontUrl      *string
	IDBackUrl       *string

	PreviousLandlordName  *string
	PreviousLandlordPhone *string
	PreviousTenancyPeriod *string

	CurrentAddress                 string `gorm:"not null;"`
	EmergencyContactName           string `gorm:"not null;"`
	EmergencyContactPhone          string `gorm:"not null;"`
	RelationshipToEmergencyContact string `gorm:"not null;"`

	Occupation        string  `gorm:"not null;"` // student
	Employer          string  `gorm:"not null;"` // or school name
	OccupationAddress string  `gorm:"not null;"` // or school address
	ProofOfIncomeUrl  *string // or admission letter url
}
