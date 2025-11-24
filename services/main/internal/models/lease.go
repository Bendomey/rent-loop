package models

import "time"

// Lease represents a lease agreement in the system.
type Lease struct {
	BaseModelSoftDelete
	Status string `gorm:"not null;default:'Lease.Status.InProgress'"` // Lease.Status.InProgress, Lease.Status.Cancelled, Lease.Status.Completed

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

	Meta *string `gorm:"type:jsonb;"` // additional metadata in json format

	// move in details
	MoveInDate            *time.Time
	StayDurationFrequency *string // hours, days, months
	StayDuration          *int64

	// docs setup
	LeaseAgreementDocumentUrl      *string
	LeaseAgreementDocumentSignedAt *time.Time

	TerminationLeaseAgreementDocumentUrl      *string
	TerminationLeaseAgreementDocumentSignedAt *time.Time

	// for lease renewals and extensions
	ParentLeaseId *string `gorm:"index;"`
	ParentLease   *Lease
}
