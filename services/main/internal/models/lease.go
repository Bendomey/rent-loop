package models

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/getsentry/raven-go"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Lease Statuses
// Pending status means it's yet to be activated. Waiting for tenant to sign agreement.
// Active means lease is currently ongoing.
// Terminated means lease was ended before the agreed duration by either party.
// Completed means lease ran its full duration and ended.
// Cancelled means lease was never activated after being created.

// Lease represents a lease agreement in the system.
type Lease struct {
	BaseModelSoftDelete
	Code   string `gorm:"not null;uniqueIndex;"`                          // unique lease code for reference, e.g. "2602ABC123-1"
	Status string `gorm:"not null;default:'Lease.Status.Pending';index;"` // Lease.Status.Pending, Lease.Status.Active, Lease.Status.Terminated, Lease.Status.Completed, Lease.Status.Cancelled

	UnitId string `gorm:"not null;"`
	Unit   Unit

	TenantId string `gorm:"not null;"`
	Tenant   Tenant

	TenantApplicationId string `gorm:"not null;"`
	TenantApplication   TenantApplication

	// financial setup
	RentFee          int64   `gorm:"not null;"` // we can inherit from tenant application
	RentFeeCurrency  string  `gorm:"not null;"`
	PaymentFrequency *string // Hourly, Daily, Monthly, Quarterly, BiAnnually, Annually, OneTime

	// to hold all payment related data from tenant application at the time of lease creation
	Meta datatypes.JSON `gorm:"not null;type:jsonb;"` // additional metadata in json format

	// move in details
	MoveInDate            time.Time
	StayDurationFrequency string // hours, days, months
	StayDuration          int64

	KeyHandoverDate        *time.Time // when keys were handed over to tenant
	UtilityTransfersDate   *time.Time // when utilities were transferred to tenant name
	PropertyInspectionDate *time.Time // a move-in checklist can be created in the process.

	// docs setup
	LeaseAgreementDocumentUrl string

	TerminationAgreementDocumentUrl                       *string
	TerminationAgreementDocumentPropertyManagerSignedAt   *time.Time
	TerminationAgreementDocumentPropertyManagerSignedByID *string
	TerminationAgreementDocumentPropertyManagerSignedBy   *ClientUser
	TerminationAgreementDocumentTenantSignedAt            *time.Time

	ActivatedAt   *time.Time
	ActivatedById *string
	ActivatedBy   *ClientUser

	CancelledAt   *time.Time
	CancelledById *string
	CancelledBy   *ClientUser

	CompletedAt   *time.Time
	CompletedById *string
	CompletedBy   *ClientUser

	TerminatedAt   *time.Time
	TerminatedById *string
	TerminatedBy   *ClientUser

	// for lease renewals and extensions
	ParentLeaseId *string `gorm:"index;"`
	ParentLease   *Lease
}

func (t *Lease) BeforeCreate(tx *gorm.DB) error {
	uniqueCode, genErr := lib.GenerateCode(tx, &Lease{})
	if genErr != nil {
		raven.CaptureError(genErr, map[string]string{
			"function": "BeforeCreateLeaseHook",
			"action":   "Generating a unique code",
		})
		return genErr
	}

	t.Code = *uniqueCode
	return nil
}
