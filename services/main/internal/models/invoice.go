package models

import (
	"time"

	"github.com/lib/pq"
	"gorm.io/datatypes"
)

type Invoice struct {
	BaseModelSoftDelete
	Code string `gorm:"not null;uniqueIndex;"` // unique invoice code

	// just for easier querying and reporting, we store the property and client info here as well, even though we can get it via the context (e.g. lease -> unit -> property)
	PropertyID *string
	Property   *Property
	ClientID   *string
	Client     *Client

	// Who is paying the invoice
	PayerType string `gorm:"not null;"` //  'TENANT_APPLICATION' | 'TENANT' | 'PROPERTY_OWNER' | 'EXTERNAL'

	PayerClientID *string
	PayerClient   *Client

	PayerPropertyID *string
	PayerProperty   *Property

	PayerLeaseID *string
	PayerLease   *Lease

	// who is receiving the payment
	PayeeType     string `gorm:"not null;"` // 'PROPERTY_OWNER' | 'RENTLOOP' | 'TENANT' | 'EXTERNAL'
	PayeeClientID *string
	PayeeClient   *Client

	PayeeTenantID *string
	PayeeTenant   *Tenant

	ContextType string `gorm:"not null;"` // 'TENANT_APPLICATION' | 'LEASE_RENT' | 'MAINTENANCE' | 'SAAS_FEE' | 'GENERAL_EXPENSE' | 'MAINTENANCE_EXPENSE'

	ContextTenantApplicationID *string
	ContextTenantApplication   *TenantApplication

	ContextLeaseID *string
	ContextLease   *Lease

	ContextMaintenanceRequestID *string
	ContextMaintenanceRequest   *MaintenanceRequest

	ContextExpenseID *string
	ContextExpense   *Expense

	TotalAmount int64  `gorm:"not null;"` // in smallest currency unit, e.g., pesewas
	Taxes       int64  `gorm:"not null;default:0"`
	SubTotal    int64  `gorm:"not null;"`                // TotalAmount - Taxes
	Currency    string `gorm:"not null;default:'GHS'"`   // e.g., 'GHS'
	Status      string `gorm:"not null;default:'DRAFT'"` // 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID'

	DueDate *time.Time // when payment is due

	IssuedAt *time.Time
	PaidAt   *time.Time
	VoidedAt *time.Time

	VoidedReason         *string
	VoidedByClientUserID *string
	VoidedByClientUser   *ClientUser

	// for now let's default to what we support
	AllowedPaymentRails pq.StringArray `gorm:"type:text[];not null;default:'{OFFLINE}'"` // ['MOMO', 'BANK_TRANSFER', 'OFFLINE', 'CARD']. Based on the payment accounts for the payee type, filter and fetch for UI
	RemindersSent       pq.StringArray `gorm:"type:text[];not null;default:'{}'"`        // tracks which reminders have been sent, e.g. ["pre_due_1d", "overdue_1d"]

	LineItems []InvoiceLineItem

	Payments []Payment `gorm:"foreignKey:InvoiceID"`
}

type InvoiceLineItem struct {
	BaseModelSoftDelete

	InvoiceID *string
	Invoice   *Invoice

	Label    string `gorm:"not null;"` // "January Rent", "Security Deposit"
	Category string `gorm:"not null;"` // 'RENT', 'SECURITY_DEPOSIT', 'INITIAL_DEPOSIT', 'MAINTENANCE_FEE', 'SAAS_FEE', 'EXPENSE'

	Quantity    int64  `gorm:"not null;"`
	UnitAmount  int64  `gorm:"not null;"`
	TotalAmount int64  `gorm:"not null;"`
	Currency    string `gorm:"not null;default:'GHS'"` // e.g., 'GHS'

	Metadata *datatypes.JSON `gorm:"type:jsonb"` // JSON metadata for the invoice. add any info here
}
