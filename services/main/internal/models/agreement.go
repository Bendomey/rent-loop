package models

import "time"

// Agreement represents a versioned legal document that users must accept
type Agreement struct {
	BaseModelSoftDelete
	Name          string    `gorm:"not null"`
	Version       string    `gorm:"not null"` // e.g. "v1.0", "v1.1"
	Content       string    `gorm:"not null;type:text"`
	EffectiveDate time.Time `gorm:"not null"`
	IsActive      bool      `gorm:"not null;default:false;index"`
}

// AgreementAcceptance records when a user accepted a specific agreement version.
// It intentionally uses BaseModel (no soft delete) to preserve the legal audit trail.
type AgreementAcceptance struct {
	BaseModel
	ClientUserID string     `gorm:"not null;index"`
	ClientUser   ClientUser `gorm:"foreignKey:ClientUserID"`
	AgreementID  string     `gorm:"not null;index"`
	Agreement    Agreement  `gorm:"foreignKey:AgreementID"`
	Version      string     `gorm:"not null"` // snapshot of version at acceptance time
	AcceptedAt   time.Time  `gorm:"not null;index"`
	IPAddress    string     `gorm:"not null"`
}
