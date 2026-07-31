package models

import (
	"time"
)

// RefreshToken is one spent-or-live credential belonging to a Session. The
// token string handed to the client is "<id>:<secret>"; only the SHA-256 of
// the secret is stored here.
//
// Rotation still inserts a row per exchange, but the row is now only the
// credential — no user agent, no IP, no metadata. Everything describing the
// sign-in lives on Session and is updated in place, so these rows are cheap
// and safe to prune once past the reuse-detection window.
type RefreshToken struct {
	BaseModel

	SessionID *string `gorm:"index"`
	Session   Session

	// TokenHash is unique purely as defence-in-depth against an implementation
	// bug reusing a secret — a genuine SHA-256 collision is not a real concern.
	TokenHash string `gorm:"not null;uniqueIndex"`

	// RevokedAt nil means this is the session's live token. Set on rotation,
	// on logout, and on the reuse-detection cascade. A retired row is kept
	// only so a replayed token still resolves to its session — which is what
	// makes theft detectable rather than merely rejected.
	RevokedAt *time.Time `gorm:"index"`
}
