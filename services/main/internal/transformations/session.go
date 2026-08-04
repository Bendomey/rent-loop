package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

// OutputSession is one signed-in device on the My Account → Sessions screen.
//
// Nullable fields are genuinely absent rather than empty-stringed: location is
// null until a GeoIP database is configured, and the device columns are null
// when a client sent no metadata and its User-Agent was unparseable. Clients
// omit those lines rather than rendering a placeholder.
type OutputSession struct {
	ID              string  `json:"id"                         example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	IsCurrent       bool    `json:"is_current"                 example:"true"`
	DeviceName      *string `json:"device_name,omitempty"      example:"MacBook Pro"`
	DeviceKind      *string `json:"device_kind,omitempty"      example:"LAPTOP"`
	OS              *string `json:"os,omitempty"               example:"macOS"`
	OSVersion       *string `json:"os_version,omitempty"       example:"15.3"`
	ClientName      *string `json:"client_name,omitempty"      example:"Chrome"`
	ClientVersion   *string `json:"client_version,omitempty"   example:"141.0"`
	IPAddress       *string `json:"ip_address,omitempty"       example:"154.160.22.14"`
	Timezone        *string `json:"timezone,omitempty"         example:"Africa/Accra"`
	LocationCity    *string `json:"location_city,omitempty"    example:"Accra"`
	LocationCountry *string `json:"location_country,omitempty" example:"Ghana"`
	// LocationSource is CLIENT when the place was reported by the device — which
	// means it is spoofable and should be shown as reported rather than
	// verified — or SERVER when derived from the observed IP. Null when no
	// location is known.
	LocationSource *string   `json:"location_source,omitempty"  example:"CLIENT"`
	SignedInAt     time.Time `json:"signed_in_at"               example:"2026-07-04T18:02:11Z"`
	LastUsedAt     time.Time `json:"last_used_at"               example:"2026-07-30T09:14:22Z"`
	ExpiresAt      time.Time `json:"expires_at"                 example:"2026-10-28T09:14:22Z"`
}

// DBSessionToRest converts one session. currentSessionID comes from the
// caller's own access token, which is the only way the server can tell which
// of a user's sessions is making the request.
func DBSessionToRest(i *models.Session, currentSessionID string) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	id := i.ID.String()

	return map[string]any{
		"id":         id,
		"is_current": id == currentSessionID,
		// CreatedAt is the true sign-in moment — it never moves, which is the
		// whole reason sessions live in their own table.
		"signed_in_at":     i.CreatedAt,
		"last_used_at":     i.LastUsedAt,
		"expires_at":       i.ExpiresAt,
		"device_name":      i.DeviceName,
		"device_kind":      i.DeviceKind,
		"os":               i.OS,
		"os_version":       i.OSVersion,
		"client_name":      i.ClientName,
		"client_version":   i.ClientVersion,
		"ip_address":       i.IPAddress,
		"timezone":         i.Timezone,
		"location_city":    i.LocationCity,
		"location_country": i.LocationCountry,
		"location_source":  i.LocationSource,
	}
}

func DBSessionsToRest(sessions []models.Session, currentSessionID string) []any {
	out := make([]any, 0, len(sessions))
	for idx := range sessions {
		if item := DBSessionToRest(&sessions[idx], currentSessionID); item != nil {
			out = append(out, item)
		}
	}
	return out
}
