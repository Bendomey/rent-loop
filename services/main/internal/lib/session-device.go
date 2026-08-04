package lib

import (
	"encoding/json"
	"strings"

	"gorm.io/datatypes"
)

// Where a session's location came from. Client-reported places are spoofable
// and must be labelled as such wherever they are shown; a server-derived place
// (from the IP the server observed) is not, and should always win.
const (
	LocationSourceClient = "CLIENT"
	LocationSourceServer = "SERVER"
)

// Device kinds. Closed set — the clients map each to an icon, so an
// unrecognised value must degrade to DeviceKindUnknown rather than render
// nothing. Defined here rather than in models because the User-Agent parser
// and the metadata merger both live in this package, and models imports lib.
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
// The shape is nested because that is what the web portal already sends
// (apps/property-manager/app/lib/device-info.ts). An earlier flat version of
// this struct silently discarded the whole blob: `os` arrives as an object, so
// unmarshalling it into a string errored and every field fell back to
// User-Agent parsing. The nesting is the wire format, not decoration.
//
// Native clients fill Device (the OS exposes make and model); browsers cannot
// and omit it. Browsers fill Browser; native clients identify themselves
// through App instead.
//
// Location is client-reported and therefore SPOOFABLE. That matters more here
// than the rest of this struct: the sessions screen exists so people can spot
// access that isn't theirs, and a session can claim to be anywhere. Anything
// carrying a client-reported place is stamped LocationSourceClient so the UI
// can say "as reported by this device" rather than implying it was verified.
type SessionDeviceInfo struct {
	Platform   *string `json:"platform"`
	DeviceType *string `json:"device_type"`

	Device *struct {
		Manufacturer *string `json:"manufacturer"`
		Model        *string `json:"model"`
		// MarketingName is the human name for a model code the OS reports as
		// something like "iPhone16,2". Preferred when present — nobody
		// recognises their phone by its internal identifier.
		MarketingName *string `json:"marketing_name"`
	} `json:"device"`

	Browser *struct {
		Name    *string `json:"name"`
		Version *string `json:"version"`
	} `json:"browser"`

	OS *struct {
		Name    *string `json:"name"`
		Version *string `json:"version"`
	} `json:"os"`

	App *struct {
		Name    *string `json:"name"`
		Version *string `json:"version"`
	} `json:"app"`

	Locale *struct {
		Language *string `json:"language"`
		Timezone *string `json:"timezone"`
	} `json:"locale"`

	// Location is what the device claims about where it is. A browser can
	// rarely fill this — see TimezoneCity for how a place is still derived
	// from the IANA zone alone.
	Location *struct {
		City    *string `json:"city"`
		Country *string `json:"country"`
	} `json:"location"`
}

// deviceTypeToKind maps the client's coarse form factor onto the icon set.
//
// "desktop" becomes LAPTOP rather than DESKTOP for the same reason the
// User-Agent parser does: neither a browser nor a UA string can tell a laptop
// from a desktop, and the clients render one computer icon for both.
// DeviceKindDesktop stays available for a client that genuinely knows.
var deviceTypeToKind = map[string]string{
	"desktop": DeviceKindLaptop,
	"laptop":  DeviceKindLaptop,
	"mobile":  DeviceKindPhone,
	"phone":   DeviceKindPhone,
	"tablet":  DeviceKindTablet,
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

	// Hardware: only a native client can report this.
	if supplied.Device != nil {
		name := preferSupplied(
			trimmedOrNil(supplied.Device.MarketingName),
			trimmedOrNil(supplied.Device.Model),
		)
		resolved.DeviceName = preferSupplied(name, resolved.DeviceName)
	}

	if supplied.DeviceType != nil {
		key := strings.ToLower(strings.TrimSpace(*supplied.DeviceType))
		if kind, known := deviceTypeToKind[key]; known {
			resolved.DeviceKind = &kind
		}
	}

	if supplied.OS != nil {
		resolved.OS = preferSupplied(trimmedOrNil(supplied.OS.Name), resolved.OS)
		resolved.OSVersion = preferSupplied(trimmedOrNil(supplied.OS.Version), resolved.OSVersion)
	}

	// A browser identifies itself as the client; a native app has no browser
	// and identifies itself through App instead.
	if supplied.Browser != nil {
		resolved.ClientName = preferSupplied(trimmedOrNil(supplied.Browser.Name), resolved.ClientName)
		resolved.ClientVersion = preferSupplied(
			trimmedOrNil(supplied.Browser.Version), resolved.ClientVersion,
		)
	}
	if supplied.App != nil && (supplied.Browser == nil || supplied.Browser.Name == nil) {
		resolved.ClientName = preferSupplied(trimmedOrNil(supplied.App.Name), resolved.ClientName)
		resolved.ClientVersion = preferSupplied(
			trimmedOrNil(supplied.App.Version), resolved.ClientVersion,
		)
	}

	if supplied.Locale != nil {
		resolved.Timezone = trimmedOrNil(supplied.Locale.Timezone)
	}
	if supplied.Location != nil {
		resolved.LocationCity = trimmedOrNil(supplied.Location.City)
		resolved.LocationCountry = trimmedOrNil(supplied.Location.Country)
	}

	// A browser can almost never name its city, but it always knows its IANA
	// zone, and those encode a representative city ("Africa/Accra"). Deriving
	// it here rather than in each client keeps one implementation, and means a
	// web session shows a place instead of nothing.
	if resolved.LocationCity == nil && resolved.Timezone != nil {
		if city := TimezoneCity(*resolved.Timezone); city != "" {
			resolved.LocationCity = &city
		}
	}

	if resolved.Timezone != nil || resolved.LocationCity != nil || resolved.LocationCountry != nil {
		source := LocationSourceClient
		resolved.LocationSource = &source
	}

	resolved.DeviceKind = normaliseDeviceKind(resolved.DeviceKind)
	return resolved
}

// TimezoneCity pulls the representative city out of an IANA zone name:
// "Africa/Accra" → "Accra", "America/Argentina/Buenos_Aires" → "Buenos Aires".
//
// Returns "" for zones that name no place ("UTC", "Etc/GMT+3") rather than
// inventing one. This approximates where someone is; it is not a claim about
// it — which is exactly why the result is only ever stamped CLIENT-sourced.
func TimezoneCity(zone string) string {
	trimmed := strings.TrimSpace(zone)
	if trimmed == "" {
		return ""
	}
	// Etc/* zones are fixed offsets, not places.
	if strings.HasPrefix(trimmed, "Etc/") || !strings.Contains(trimmed, "/") {
		return ""
	}
	segments := strings.Split(trimmed, "/")
	last := segments[len(segments)-1]
	if last == "" {
		return ""
	}
	return strings.ReplaceAll(last, "_", " ")
}

func preferSupplied(supplied, fallback *string) *string {
	if supplied != nil && *supplied != "" {
		return supplied
	}
	return fallback
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

var validDeviceKinds = map[string]bool{
	DeviceKindLaptop:  true,
	DeviceKindDesktop: true,
	DeviceKindPhone:   true,
	DeviceKindTablet:  true,
	DeviceKindUnknown: true,
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
