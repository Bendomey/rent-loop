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

// Lease represents a lease agreement in the system.
type Lease struct {
	BaseModelSoftDelete
	Status string `gorm:"not null;default:'Lease.Status.Pending';index;"` // Lease.Status.Pending, Lease.Status.Active, Lease.Status.Terminated, Lease.Status.Completed

	UnitId string `gorm:"not null;"`
	Unit   Unit

	TenantId string `gorm:"not null;"`
	Tenant   Tenant

	TenantApplicationId string `gorm:"not null;"`
	TenantApplication   TenantApplication

	// financial setup
	RentFee          int64   `gorm:"not null;"` // we can inherit from unit and then make arrangement for updates!
	RentFeeCurrency  string  `gorm:"not null;"`
	PaymentFrequency *string // Hourly, Daily, Monthly, Quarterly, BiAnnually, Annually, OneTime

	// to hold all payment related data from tenant application at the time of lease creation
	Meta datatypes.JSON `gorm:"not null;type:jsonb;"` // additional metadata in json format

	// move in details
	MoveInDate            time.Time
	StayDurationFrequency string // hours, days, months
	StayDuration          int64

	// docs setup
	LeaseAgreementDocumentUrl                     string
	LeaseAgreementDocumentPropertyManagerSignedAt *time.Time
	LeaseAgreementDocumentTenantSignedAt          *time.Time

	TerminationLeaseAgreementDocumentUrl                     *string
	TerminationLeaseAgreementDocumentPropertyManagerSignedAt *time.Time
	TerminationLeaseAgreementDocumentTenantSignedAt          *time.Time

	// for lease renewals and extensions
	ParentLeaseId *string `gorm:"index;"`
	ParentLease   *Lease
}
