package models

import (
	"time"

	"gorm.io/datatypes"
)

// RefreshToken is one signed-in session for a User. The token string handed to
// the client is "<id>:<secret>"; only the SHA-256 of the secret is stored here.
type RefreshToken struct {
	BaseModel

	UserID string `gorm:"not null;index"`
	User   User

	// TokenHash is unique purely as defence-in-depth against an implementation
	// bug reusing a secret — a genuine SHA-256 collision is not a real concern.
	TokenHash string `gorm:"not null;uniqueIndex"`

	// Captured at issue time for a future "active sessions" view.
	UserAgent *string
	IPAddress *string

	// Metadata is an open bucket for richer client-supplied session info
	// (device name, platform, browser, os). Nothing populates it yet — the
	// web/mobile integration specs decide what goes in and how.
	Metadata *datatypes.JSON `gorm:"type:jsonb"`

	// RevokedAt nil means active. Set on logout, on rotation, and on the
	// reuse-detection cascade.
	RevokedAt *time.Time

	// ReplacedByID points at the token that rotated this one out, forming the
	// chain the reuse-detection cascade walks forward.
	ReplacedByID *string       `gorm:"index"`
	ReplacedBy   *RefreshToken `gorm:"foreignKey:ReplacedByID"`

	// ExpiresAt slides: reset to now + REFRESH_TOKEN_TTL_DAYS on every rotation.
	ExpiresAt time.Time `gorm:"not null;index"`

	// LastUsedAt is deliberately separate from UpdatedAt, which also moves when
	// a row is revoked and so cannot represent "last active".
	LastUsedAt time.Time `gorm:"not null"`
}
