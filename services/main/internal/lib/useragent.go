package lib

import (
	"regexp"
	"strings"
)

// ParsedUserAgent is the best guess we can make about a session from its
// User-Agent header alone. Every field is optional: a client may send a UA we
// don't recognise, or none at all.
//
// This exists as a fallback. A client that knows its own hardware (the mobile
// apps do) should send richer values as login metadata, which take precedence
// — a browser can never report "MacBook Pro", only "Mac".
type ParsedUserAgent struct {
	DeviceName    *string
	DeviceKind    *string
	OS            *string
	OSVersion     *string
	ClientName    *string
	ClientVersion *string
}

var (
	reEdge    = regexp.MustCompile(`Edg(?:e|A|iOS)?/([0-9.]+)`)
	reChrome  = regexp.MustCompile(`(?:Chrome|CriOS)/([0-9.]+)`)
	reFirefox = regexp.MustCompile(`(?:Firefox|FxiOS)/([0-9.]+)`)
	reSafari  = regexp.MustCompile(`Version/([0-9.]+).*Safari`)

	reMacOS   = regexp.MustCompile(`Mac OS X ([0-9_.]+)`)
	reWindows = regexp.MustCompile(`Windows NT ([0-9.]+)`)
	reIOS     = regexp.MustCompile(`(?:iPhone )?OS ([0-9_]+) like Mac OS X`)
	reAndroid = regexp.MustCompile(`Android ([0-9.]+)`)
)

// Windows NT version → marketing name. Anything newer than we know about
// falls through to a bare "Windows" rather than a wrong number.
var windowsNames = map[string]string{
	"10.0": "Windows 10/11",
	"6.3":  "Windows 8.1",
	"6.2":  "Windows 8",
	"6.1":  "Windows 7",
}

// ParseUserAgent extracts what it can from a raw User-Agent string. It never
// errors — an unrecognised agent simply yields empty fields.
func ParseUserAgent(ua string) ParsedUserAgent {
	out := ParsedUserAgent{}
	if strings.TrimSpace(ua) == "" {
		return out
	}

	// ── Client (browser or native app) ──────────────────────────────────────
	// Order matters: Edge and Chrome both advertise "Chrome", and every
	// Chromium browser advertises "Safari". Most specific first.
	switch {
	case reEdge.MatchString(ua):
		out.ClientName = strPtr("Edge")
		out.ClientVersion = firstSubmatch(reEdge, ua)
	case reChrome.MatchString(ua):
		out.ClientName = strPtr("Chrome")
		out.ClientVersion = firstSubmatch(reChrome, ua)
	case reFirefox.MatchString(ua):
		out.ClientName = strPtr("Firefox")
		out.ClientVersion = firstSubmatch(reFirefox, ua)
	case reSafari.MatchString(ua):
		out.ClientName = strPtr("Safari")
		out.ClientVersion = firstSubmatch(reSafari, ua)
	}

	// ── OS, device name and kind ────────────────────────────────────────────
	switch {
	case strings.Contains(ua, "iPhone"):
		out.OS = strPtr("iOS")
		out.OSVersion = dottedVersion(firstSubmatch(reIOS, ua))
		out.DeviceName = strPtr("iPhone")
		out.DeviceKind = strPtr(DeviceKindPhone)

	case strings.Contains(ua, "iPad"):
		out.OS = strPtr("iPadOS")
		out.OSVersion = dottedVersion(firstSubmatch(reIOS, ua))
		out.DeviceName = strPtr("iPad")
		out.DeviceKind = strPtr(DeviceKindTablet)

	case reAndroid.MatchString(ua):
		out.OS = strPtr("Android")
		out.OSVersion = firstSubmatch(reAndroid, ua)
		out.DeviceName = strPtr("Android device")
		// Android tablets omit "Mobile" from the UA; phones include it.
		if strings.Contains(ua, "Mobile") {
			out.DeviceKind = strPtr(DeviceKindPhone)
		} else {
			out.DeviceKind = strPtr(DeviceKindTablet)
		}

	case reMacOS.MatchString(ua):
		out.OS = strPtr("macOS")
		out.OSVersion = dottedVersion(firstSubmatch(reMacOS, ua))
		out.DeviceName = strPtr("Mac")
		out.DeviceKind = strPtr(DeviceKindLaptop)

	case reWindows.MatchString(ua):
		out.OS = strPtr("Windows")
		if nt := firstSubmatch(reWindows, ua); nt != nil {
			if name, known := windowsNames[*nt]; known {
				out.OS = strPtr(name)
			}
		}
		out.DeviceName = strPtr("Windows PC")
		out.DeviceKind = strPtr(DeviceKindLaptop)

	case strings.Contains(ua, "Linux"):
		out.OS = strPtr("Linux")
		out.DeviceName = strPtr("Linux PC")
		out.DeviceKind = strPtr(DeviceKindLaptop)
	}

	// A User-Agent cannot distinguish a laptop from a desktop, so desktop-class
	// agents are reported as LAPTOP — the clients render a computer icon for it
	// either way. DeviceKindDesktop is reserved for clients that actually know.
	return out
}

func firstSubmatch(re *regexp.Regexp, s string) *string {
	m := re.FindStringSubmatch(s)
	if len(m) < 2 || m[1] == "" {
		return nil
	}
	return &m[1]
}

// dottedVersion turns Apple's underscore-separated versions ("10_15_7",
// "17_4") into the dotted form people recognise.
func dottedVersion(v *string) *string {
	if v == nil {
		return nil
	}
	dotted := strings.ReplaceAll(*v, "_", ".")
	return &dotted
}

func strPtr(s string) *string {
	return &s
}
