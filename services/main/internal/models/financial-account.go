package models

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/getsentry/raven-go"
	"gorm.io/gorm"
)

// FinancialAccount is the continuing financial relationship between one tenant
// and one property. Leases are contractual terms inside it: a renewal adds a
// term, it does not start a new money relationship.
//
// Accounts are shared along a RENEWAL CHAIN: a renewal takes its parent's
// account, and everything else opens its own. Tenant and property deliberately
// do NOT identify an account — a tenant can hold several concurrent leases on
// different units at one property, and those are separate money relationships
// with separate deposits. TenantID and PropertyID are denormalisation for
// reporting, not a key.
//
// TenantID is nullable because an account is created against an application,
// before any tenant record exists. Application-stage is exactly
// TenantID IS NULL — it is no longer LeaseID IS NULL, because leases now point
// at accounts rather than the reverse.
type FinancialAccount struct {
	BaseModelSoftDelete
	Code string `gorm:"not null;uniqueIndex;"` // FA-YYMM-XXXXXX

	// Provenance only. The application this relationship began with; it does
	// not identify the account and is not unique.
	//
	// The column keeps its original name. Renaming it would have to happen
	// before AutoMigrate runs, and this repo's runner does AutoMigrate first —
	// so a rename job can only ever see a table AutoMigrate has already tried
	// to add the new column to. The Go name carries the meaning; the column
	// name is immaterial and, read plainly, still accurate.
	OriginTenantApplicationID string            `gorm:"column:tenant_application_id;not null;index;"`
	TenantApplication         TenantApplication `gorm:"foreignKey:OriginTenantApplicationID"`

	// Denormalised for querying and reporting. This is what lets the Cube
	// property scope collapse from five COALESCE branches to one lookup.
	ClientID   *string
	Client     *Client
	PropertyID *string
	Property   *Property
	TenantID   *string // null until approval creates the Tenant
	Tenant     *Tenant

	Currency string `gorm:"not null;default:'GHS'"`

	// Rent collection policy — what the queue reads.
	// EVERY_PERIOD | EVERY_N_PERIODS | UPFRONT | MANUAL
	RentBillingCadence  string `gorm:"not null;default:'EVERY_PERIOD'"`
	RentBillingInterval int64  `gorm:"not null;default:1"`
	AutoIssueDaysBefore int64  `gorm:"not null;default:5"` // issuance LEAD time, not the payment grace

	// ACTIVE | CLOSURE_ELIGIBLE | CLOSED.
	//
	// CLOSURE_ELIGIBLE means every term has ended and nothing follows. It is
	// still a live account: it bills, it accepts payment, and a new lease
	// reverts it to ACTIVE. Only a PM moves it to CLOSED.
	Status            string `gorm:"not null;default:'ACTIVE';index;"`
	ClosureEligibleAt *time.Time
	ClosedAt          *time.Time

	ChargeDefinitions []ChargeDefinition
	ChargeInstances   []ChargeInstance
}

func (f *FinancialAccount) BeforeCreate(tx *gorm.DB) error {
	uniqueCode, genErr := lib.GenerateCode(tx, &FinancialAccount{})
	if genErr != nil {
		raven.CaptureError(genErr, map[string]string{
			"function": "BeforeCreateFinancialAccountHook",
			"action":   "Generating a unique code",
		})
		return genErr
	}

	f.Code = *uniqueCode
	return nil
}

// AccountFinancials is a computed summary attached to a lease or application
// in memory. It lives here rather than in the services layer so the model can
// carry it without an import cycle.
type AccountFinancials struct {
	Account           *FinancialAccount
	TotalCharged      int64
	TotalSettled      int64
	OutstandingAmount int64
	AvailableCredit   int64
	ChargeCount       int64
	InvoiceCount      int64
	// RentTermsLocked mirrors the service guard: true once a rent charge has
	// been invoiced or settled, at which point move-in date and unit changes
	// are refused.
	RentTermsLocked bool
}
