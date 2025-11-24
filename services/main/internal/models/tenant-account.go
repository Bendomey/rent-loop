package models

// TenantAccount represents a tenant user in the system
type TenantAccount struct {
	BaseModelSoftDelete
	TenantId string `gorm:"not null;uniqueIndex;"`
	Tenant   Tenant

	PhoneNumber       string `gorm:"not null;uniqueIndex;"`
	NotificationToken *string
}
