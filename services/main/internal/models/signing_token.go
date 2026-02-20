package models

import (
	"errors"
	"time"

	gonanoid "github.com/matoous/go-nanoid"
	"gorm.io/gorm"
)

// SigningToken represents a token-based signing invitation for a document.
// Each token authorizes a specific signer role to sign a specific document.
// Tokens are shared via email/SMS and are used for tenants and witnesses
// who don't have access to the property manager portal.
type SigningToken struct {
	BaseModelSoftDelete

	// Token is the short, URL-safe identifier used in the signing link.
	// Format: {application_code}-{random} e.g. "2602ABC123-a8f3b2c1d4e5"
	Token string `gorm:"uniqueIndex;not null"`

	DocumentID string `gorm:"not null;"`
	Document   Document

	TenantApplicationID *string
	TenantApplication   *TenantApplication

	LeaseID *string
	Lease   *Lease

	// Role this token authorizes: "TENANT" | "PM_WITNESS" | "TENANT_WITNESS"
	// Property managers sign via the authenticated portal, not via tokens.
	Role string `gorm:"not null"`

	// SignerName is pre-populated if known at invite time, NULL if the signee
	// will enter their name when they open the link.
	SignerName  *string
	SignerEmail *string
	SignerPhone *string

	// CreatedBy is the property manager who generated the signing link.
	CreatedByID string `gorm:"not null"`
	CreatedBy   ClientUser

	// Lifecycle timestamps
	SignedAt       *time.Time // set when the signee completes signing — prevents re-signing
	LastAccessedAt *time.Time // updated each time the signee opens the link
	ExpiresAt      time.Time  `gorm:"not null"` // token expiry, e.g. 7 days from creation

	// Links back to the signature record created when this token is used
	DocumentSignatureID *string
	DocumentSignature   *DocumentSignature
}

func (s *SigningToken) BeforeCreate(tx *gorm.DB) error {
	appCode := ""
	if s.TenantApplicationID != nil {
		var app TenantApplication
		if err := tx.Select("code").First(&app, "id = ?", s.TenantApplicationID).Error; err == nil {
			appCode = app.Code
		}
	}

	if s.LeaseID != nil {
		var lease Lease
		if err := tx.Select("code").First(&lease, "id = ?", s.LeaseID).Error; err == nil {
			appCode = lease.Code
		}
	}

	if appCode == "" {
		return errors.New("unable to determine application code for signing token")
	}

	token, err := generateSigningToken(tx, appCode)
	if err != nil {
		return err
	}

	s.Token = token
	return nil
}

// IsExpired returns true if the token has passed its expiry time.
func (s *SigningToken) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}

// IsUsed returns true if the token has already been used to sign.
func (s *SigningToken) IsUsed() bool {
	return s.SignedAt != nil
}

// IsValid returns true if the token can still be used for signing.
func (s *SigningToken) IsValid() bool {
	return !s.IsExpired() && !s.IsUsed()
}

// generateSigningToken creates a unique token in the format "{appCode}-{random}".
// The random portion uses a 12-char nanoid from a hex-safe alphabet.
func generateSigningToken(db *gorm.DB, appCode string) (string, error) {
	random, err := gonanoid.Generate("abcdefghijklmnopqrstuvwxyz0123456789", 12)
	if err != nil {
		return "", err
	}

	token := random
	if appCode != "" {
		token = appCode + "-" + random
	}

	// Check uniqueness (extremely unlikely collision, but safe)
	var count int64
	db.Model(&SigningToken{}).Where("token = ?", token).Count(&count)
	if count > 0 {
		return generateSigningToken(db, appCode)
	}

	return token, nil
}
