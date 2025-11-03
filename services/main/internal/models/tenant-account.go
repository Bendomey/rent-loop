package models

// TenantAccount represents a tenant user in the system
type TenantAccount struct {
	BaseModelSoftDelete
	Name  string `json:"name"  gorm:"not null;"`
	Phone string `json:"phone" gorm:"not null;uniqueIndex"`
	Email string `json:"email" gorm:"index"`
}
