package lib

import (
	"encoding/json"
	"strings"

	"gorm.io/datatypes"
)

// Device kinds. Closed set — the clients map each to an icon, so an
// unrecognised value must degrade to DeviceKindUnknown rather than render
// nothing. Defined here rather than in models because the User-Agent parser
// and the metadata merger both live in this package, and models imports lib.
// Where a session's location came from. Client-reported places are spoofable
// and must be labelled as such wherever they are shown; a server-derived place
// (from the IP the server observed) is not, and should always win.
const (
	LocationSourceClient = "CLIENT"
	LocationSourceServer = "SERVER"
)

const (
	DeviceKindLaptop  = "LAPTOP"
	DeviceKindDesktop = "DESKTOP"
	DeviceKindPhone   = "PHONE"
	DeviceKindTablet  = "TABLET"
	DeviceKindUnknown = "UNKNOWN"
)

// SessionDeviceInfo is the contract clients send as `metadata`, on login and
// optionally on refresh. Every field is optional and every value is untrusted
// — it is stored for display only and never drives authorisation.
//
// Mobile can fill the device fields from device_info_plus + package_info_plus.
// A browser cannot know its hardware, so the web portal sends what it has and
// the server fills the rest by parsing the User-Agent.
//
// Location is client-reported and therefore SPOOFABLE. That matters more here
// than the rest of this struct: the sessions screen exists so people can spot
// access that isn't theirs, and a session can claim to be anywhere. Sessions
// carrying a client-reported place are stamped LocationSourceClient so the UI
// can say "as reported by this device" rather than presenting it as verified.
// A server-side lookup, when one exists, must overwrite this and stamp
// LocationSourceServer.
//
// Timezone (IANA, e.g. "Africa/Accra") is the cheapest honest signal a client
// has: no permission prompt, no third-party call, nothing to block, and it
// cannot fail. It is kept alongside city/country because it is often the only
// one a browser can supply.
type SessionDeviceInfo struct {
	DeviceName      *string `json:"device_name"`
	DeviceKind      *string `json:"device_kind"`
	OS              *string `json:"os"`
	OSVersion       *string `json:"os_version"`
	ClientName      *string `json:"client_name"`
	ClientVersion   *string `json:"client_version"`
	Timezone        *string `json:"timezone"`
	LocationCity    *string `json:"location_city"`
	LocationCountry *string `json:"location_country"`
}

var validDeviceKinds = map[string]bool{
	DeviceKindLaptop:  true,
	DeviceKindDesktop: true,
	DeviceKindPhone:   true,
	DeviceKindTablet:  true,
	DeviceKindUnknown: true,
}

// ResolvedDevice is the merged result of client metadata and UA parsing.
type ResolvedDevice struct {
	DeviceName    *string
	DeviceKind    *string
	OS            *string
	OSVersion     *string
	ClientName    *string
	ClientVersion *string

	// Location comes only from the client — the User-Agent says nothing about
	// where a device is. LocationSource is set when any of these are present,
	// so a row always records how its place was determined.
	Timezone        *string
	LocationCity    *string
	LocationCountry *string
	LocationSource  *string
}

// ResolveDevice merges what the client told us with what we can infer from the
// User-Agent. Client values win per-field — a device knows its own name better
// than we can guess it — but a client that sends only some fields still gets
// the rest filled in rather than left null.
//
// Malformed metadata is ignored rather than rejected: it is cosmetic, and the
// caller is a login, which must not fail over a display string.
func ResolveDevice(metadata *datatypes.JSON, userAgent *string) ResolvedDevice {
	var ua ParsedUserAgent
	if userAgent != nil {
		ua = ParseUserAgent(*userAgent)
	}

	resolved := ResolvedDevice{
		DeviceName:    ua.DeviceName,
		DeviceKind:    ua.DeviceKind,
		OS:            ua.OS,
		OSVersion:     ua.OSVersion,
		ClientName:    ua.ClientName,
		ClientVersion: ua.ClientVersion,
	}

	if metadata == nil {
		resolved.DeviceKind = normaliseDeviceKind(resolved.DeviceKind)
		return resolved
	}

	var supplied SessionDeviceInfo
	if err := json.Unmarshal(*metadata, &supplied); err != nil {
		resolved.DeviceKind = normaliseDeviceKind(resolved.DeviceKind)
		return resolved
	}

	resolved.DeviceName = preferSupplied(supplied.DeviceName, resolved.DeviceName)
	resolved.DeviceKind = preferSupplied(supplied.DeviceKind, resolved.DeviceKind)
	resolved.OS = preferSupplied(supplied.OS, resolved.OS)
	resolved.OSVersion = preferSupplied(supplied.OSVersion, resolved.OSVersion)
	resolved.ClientName = preferSupplied(supplied.ClientName, resolved.ClientName)
	resolved.ClientVersion = preferSupplied(supplied.ClientVersion, resolved.ClientVersion)
	resolved.DeviceKind = normaliseDeviceKind(resolved.DeviceKind)

	resolved.Timezone = trimmedOrNil(supplied.Timezone)
	resolved.LocationCity = trimmedOrNil(supplied.LocationCity)
	resolved.LocationCountry = trimmedOrNil(supplied.LocationCountry)
	if resolved.Timezone != nil || resolved.LocationCity != nil || resolved.LocationCountry != nil {
		source := LocationSourceClient
		resolved.LocationSource = &source
	}

	return resolved
}

// trimmedOrNil normalises a client-supplied string: whitespace-only values
// become nil so they don't occupy a column that reads as "we know this".
func trimmedOrNil(v *string) *string {
	if v == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*v)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func preferSupplied(supplied, fallback *string) *string {
	if supplied != nil && *supplied != "" {
		return supplied
	}
	return fallback
}

// normaliseDeviceKind guarantees the column only ever holds a value the
// clients know how to render an icon for.
func normaliseDeviceKind(kind *string) *string {
	if kind == nil {
		return nil
	}
	if !validDeviceKinds[*kind] {
		unknown := DeviceKindUnknown
		return &unknown
	}
	return kind
}
