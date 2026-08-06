package models

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/getsentry/raven-go"
	"gorm.io/gorm"
)

// FinancialAccount anchors everything a tenant owes. It is created when a
// landlord first prepares charges on an application and gains a LeaseID on
// approval — no record moves, nothing is copied, which is what makes "pay
// before approval" and "pay after approval" the same operation.
//
// There is deliberately no OwnerType discriminator: every lease has an
// application behind it (Lease.TenantApplicationId is not null), so
// "application-stage" is exactly LeaseID IS NULL.
type FinancialAccount struct {
	BaseModelSoftDelete
	Code string `gorm:"not null;uniqueIndex;"` // FA-YYMM-XXXXXX

	TenantApplicationID string `gorm:"not null;uniqueIndex;"`
	TenantApplication   TenantApplication

	LeaseID *string `gorm:"uniqueIndex;"`
	Lease   *Lease

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

	Status   string `gorm:"not null;default:'ACTIVE';index;"` // ACTIVE | CLOSED
	ClosedAt *time.Time

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

// TenantApplicationFinancials is a computed summary attached to a
// TenantApplication in memory. It lives here rather than in the services layer
// so the model can carry it without an import cycle.
type TenantApplicationFinancials struct {
	Account           *FinancialAccount
	TotalCharged      int64
	TotalSettled      int64
	OutstandingAmount int64
	AvailableCredit   int64
	ChargeCount       int64
	InvoiceCount      int64
}
