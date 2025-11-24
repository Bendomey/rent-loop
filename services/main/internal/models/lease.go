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

	// financial setup
	RentFee          int64   `gorm:"not null;"` // we can inherit from unit and then make arrangement for updates!
	RentFeeCurrency  string  `gorm:"not null;"`
	PaymentFrequency *string // Hourly, Daily, Monthly, Quarterly, BiAnnually, Annually

	InitialDepositFee             *int64
	InitialDepositPaymentMethod   *string // ONLINE | CASH | EXTERNAL
	InitialDepositReferenceNumber *string
	InitialDepositPaidAt          *string
	InitialDepositPaymentId       *string
	InitialDepositPayment         *Payment

	SecurityDepositFee         *int64 // if it's null or 0 then it's not opted in!
	SecurityDepositFeeCurrency *string

	SecurityDepositPaymentMethod   *string // ONLINE | CASH | EXTERNAL
	SecurityDepositReferenceNumber *string
	SecurityDepositPaidAt          *time.Time
	SecurityDepositPaymentId       *string
	SecurityDepositPayment         *Payment

	// move in details
	MoveInDate            *time.Time
	StayDurationFrequency *string // hours, days, months
	StayDuration          *int64

	// docs setup
	LeaseAgreementDocumentUrl      *string // [{type, name, url}]
	LeaseAgreementDocumentSignedAt *time.Time
}
