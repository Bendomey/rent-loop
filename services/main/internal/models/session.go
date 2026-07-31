package models

import (
	"time"

	"gorm.io/datatypes"
)

// Device kinds live in internal/lib (lib.DeviceKind*) rather than here: they
// are produced by the User-Agent parser and the client-metadata merger, both
// of which sit in lib, and models already imports lib — putting them here
// would close an import cycle.

// Why a session was revoked. Surfaced nowhere in the UI yet, but the
// difference between "the user signed this out" and "we killed it because a
// retired token came back" is the first thing you want when someone asks why
// they were logged out.
const (
	SessionRevokedByLogout     = "LOGOUT"
	SessionRevokedByUser       = "REVOKED_BY_USER"
	SessionRevokedByReuse      = "REUSE_DETECTED"
	SessionRevokedBySignOutAll = "SIGNED_OUT_ALL_OTHERS"
)

// Session is one sign-in. It is deliberately separate from RefreshToken: a
// session's identity is stable for its whole life, while the refresh token
// backing it is replaced on every rotation. Keeping them in one table meant a
// session's identity changed hourly and its true sign-in time was unknowable.
type Session struct {
	BaseModel

	UserID string `gorm:"not null;index"`
	User   User

	// CreatedAt (from BaseModel) is the real sign-in moment and never moves.

	// LastUsedAt advances on every refresh. It is the closest thing we have to
	// "last active" — note it only moves when the access token is exchanged,
	// so its resolution is the access token TTL, not per-request.
	LastUsedAt time.Time `gorm:"not null;index"`

	// ExpiresAt slides: reset to now + REFRESH_TOKEN_TTL_DAYS on every rotation.
	ExpiresAt time.Time `gorm:"not null;index"`

	// RevokedAt nil means active.
	RevokedAt     *time.Time `gorm:"index"`
	RevokedReason *string

	// Last-seen network identity, refreshed on every rotation. Frozen
	// login-time values would show where a session started rather than where
	// it is now, which is the opposite of what "sign out anything you don't
	// recognise" needs.
	IPAddress *string
	UserAgent *string

	// Display fields. Populated from client-supplied metadata where available,
	// otherwise parsed from UserAgent. Nullable because a client may send
	// nothing and a UA may be unparseable.
	DeviceName    *string
	DeviceKind    *string
	OS            *string
	OSVersion     *string
	ClientName    *string
	ClientVersion *string

	// Location is currently client-reported (see lib.SessionDeviceInfo) and is
	// therefore spoofable. LocationSource records that, so the UI can label it
	// and a future server-side lookup can overwrite it without ambiguity about
	// which rows are trustworthy.
	Timezone        *string
	LocationCity    *string
	LocationCountry *string
	LocationSource  *string

	// Metadata keeps anything a client sent that we don't promote to a column.
	Metadata *datatypes.JSON `gorm:"type:jsonb"`
}

// IsActive reports whether the session can still be refreshed.
func (s *Session) IsActive(now time.Time) bool {
	return s.RevokedAt == nil && s.ExpiresAt.After(now)
}
