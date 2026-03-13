package models

type Expense struct {
	BaseModelSoftDelete

	ContextType string `gorm:"not null;index;"` // MAINTENANCE (extensible for future context types)

	ContextMaintenanceRequestID *string
	ContextMaintenanceRequest   *MaintenanceRequest

	Description string `gorm:"not null;"`
	Amount      int64  `gorm:"not null;"`
	Currency    string `gorm:"not null;default:'GHS'"`

	PaidBy string `gorm:"not null;"` // BUSINESS | TENANT | OWNER

	BillableToTenant bool `gorm:"not null;default:false"`

	// Set when this expense has been billed via expenses:invoice
	InvoiceID *string
	Invoice   *Invoice

	CreatedByClientUserID string `gorm:"not null;"`
	CreatedByClientUser   ClientUser
}
