package models

import (
	"time"

	"gorm.io/datatypes"
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
	LeaseAggreementDocumentMode *string // MANUAL | ONLINE
	LeaseAgreementDocumentUrl   string
	// with the initial lease agreement, because they'd be signed before the lease is created, they might not need the other info below
	LeaseAgreementDocumentPropertyManagerSignedById *string
	LeaseAgreementDocumentPropertyManagerSignedBy   *ClientUser
	LeaseAgreementDocumentPropertyManagerSignedAt   *time.Time
	LeaseAgreementDocumentTenantSignedAt            *time.Time

	TerminationAgreementDocumentUrl                       *string
	TerminationAgreementDocumentPropertyManagerSignedAt   *time.Time
	TerminationAgreementDocumentPropertyManagerSignedByID *string
	TerminationAgreementDocumentPropertyManagerSignedBy   *ClientUser
	TerminationAgreementDocumentTenantSignedAt            *time.Time

	ActivatedAt  *time.Time
	CancelledAt  *time.Time
	CompletedAt  *time.Time
	TerminatedAt *time.Time

	// for lease renewals and extensions
	ParentLeaseId *string `gorm:"index;"`
	ParentLease   *Lease
}
