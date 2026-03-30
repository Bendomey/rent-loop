package models

type Expense struct {
	BaseModelSoftDelete

	Code string `gorm:"not null;uniqueIndex;"` // unique expense code, e.g. EXP-YYMM-XXXXXX

	ContextType string `gorm:"not null;index;"` // MAINTENANCE (extensible for future context types)

	ContextMaintenanceRequestID *string
	ContextMaintenanceRequest   *MaintenanceRequest

	Description string `gorm:"not null;"`
	Amount      int64  `gorm:"not null;"`
	Currency    string `gorm:"not null;default:'GHS'"`

	Invoices []Invoice `gorm:"foreignKey:ContextExpenseID"`

	CreatedByClientUserID string `gorm:"not null;"`
	CreatedByClientUser   ClientUser
}
