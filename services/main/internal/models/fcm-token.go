package models

// FcmToken stores a device push notification token for a tenant account.
// A tenant may have multiple tokens (multiple devices / reinstalls).
type FcmToken struct {
	BaseModel
	TenantAccountID string        `gorm:"not null;index"`
	TenantAccount   TenantAccount `gorm:"foreignKey:TenantAccountID"`
	Token           string        `gorm:"not null;uniqueIndex"`
	Platform        string        `gorm:"not null"` // "ios" or "android"
}
