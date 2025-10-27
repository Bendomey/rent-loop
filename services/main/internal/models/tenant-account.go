package models

// TenantAccount represents a tenant user in the system
type TenantAccount struct {
	BaseModelSoftDelete
	TenantId string `json:"tenantId" gorm:"not null;uniqueIndex;"`
	Tenant   Tenant

	PhoneNumber string `json:"phoneNumber" gorm:"not null;uniqueIndex;"`
}
