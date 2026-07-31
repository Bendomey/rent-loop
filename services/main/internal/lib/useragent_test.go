package lib

import (
	"testing"

	"gorm.io/datatypes"
)

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func TestParseUserAgent(t *testing.T) {
	cases := []struct {
		name       string
		ua         string
		wantOS     string
		wantClient string
		wantDevice string
		wantKind   string
	}{
		{
			name:       "chrome on macos",
			ua:         "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
			wantOS:     "macOS",
			wantClient: "Chrome",
			wantDevice: "Mac",
			wantKind:   DeviceKindLaptop,
		},
		{
			// Edge advertises Chrome too — the more specific match must win.
			name:       "edge on windows",
			ua:         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
			wantOS:     "Windows 10/11",
			wantClient: "Edge",
			wantDevice: "Windows PC",
			wantKind:   DeviceKindLaptop,
		},
		{
			name:       "safari on iphone",
			ua:         "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
			wantOS:     "iOS",
			wantClient: "Safari",
			wantDevice: "iPhone",
			wantKind:   DeviceKindPhone,
		},
		{
			name:       "safari on ipad is a tablet",
			ua:         "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/604.1",
			wantOS:     "iPadOS",
			wantClient: "Safari",
			wantDevice: "iPad",
			wantKind:   DeviceKindTablet,
		},
		{
			// "Mobile" present → phone.
			name:       "chrome on android phone",
			ua:         "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
			wantOS:     "Android",
			wantClient: "Chrome",
			wantDevice: "Android device",
			wantKind:   DeviceKindPhone,
		},
		{
			// "Mobile" absent → tablet.
			name:       "chrome on android tablet",
			ua:         "Mozilla/5.0 (Linux; Android 14; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
			wantOS:     "Android",
			wantClient: "Chrome",
			wantDevice: "Android device",
			wantKind:   DeviceKindTablet,
		},
		{
			name:       "firefox on linux",
			ua:         "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
			wantOS:     "Linux",
			wantClient: "Firefox",
			wantDevice: "Linux PC",
			wantKind:   DeviceKindLaptop,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := ParseUserAgent(tc.ua)
			if deref(got.OS) != tc.wantOS {
				t.Errorf("OS = %q, want %q", deref(got.OS), tc.wantOS)
			}
			if deref(got.ClientName) != tc.wantClient {
				t.Errorf("ClientName = %q, want %q", deref(got.ClientName), tc.wantClient)
			}
			if deref(got.DeviceName) != tc.wantDevice {
				t.Errorf("DeviceName = %q, want %q", deref(got.DeviceName), tc.wantDevice)
			}
			if deref(got.DeviceKind) != tc.wantKind {
				t.Errorf("DeviceKind = %q, want %q", deref(got.DeviceKind), tc.wantKind)
			}
		})
	}
}

func TestParseUserAgentAppleVersionsAreDotted(t *testing.T) {
	got := ParseUserAgent(
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
	)
	if deref(got.OSVersion) != "17.4" {
		t.Errorf("OSVersion = %q, want %q", deref(got.OSVersion), "17.4")
	}
}

func TestParseUserAgentEmptyAndUnknown(t *testing.T) {
	// Neither should panic, and neither should invent values.
	if got := ParseUserAgent(""); got.OS != nil || got.ClientName != nil {
		t.Errorf("empty UA produced values: %+v", got)
	}
	if got := ParseUserAgent("some-internal-healthcheck/1.0"); got.OS != nil {
		t.Errorf("unknown UA produced an OS: %q", deref(got.OS))
	}
}

func TestResolveDeviceParsesRealWebPayload(t *testing.T) {
	// Verbatim shape from apps/property-manager collectDeviceMetadata(). A
	// previous flat struct failed to unmarshal this and dropped every field,
	// so this test exists to keep the wire format and the struct in step.
	metadata := jsonBlob(t, `{
      "platform":"web",
      "device_type":"desktop",
      "browser":{"name":"Chrome","version":"141"},
      "os":{"name":"macOS","version":"15.0.0"},
      "app":{"name":"Rentloop Property Manager","version":"1.0.0"},
      "locale":{"language":"en-GB","timezone":"Africa/Accra"}
    }`)

	got := ResolveDevice(metadata, nil)

	if deref(got.ClientName) != "Chrome" {
		t.Errorf("ClientName = %q, want Chrome", deref(got.ClientName))
	}
	if deref(got.ClientVersion) != "141" {
		t.Errorf("ClientVersion = %q, want 141", deref(got.ClientVersion))
	}
	if deref(got.OS) != "macOS" {
		t.Errorf("OS = %q, want macOS", deref(got.OS))
	}
	if deref(got.OSVersion) != "15.0.0" {
		t.Errorf("OSVersion = %q, want 15.0.0", deref(got.OSVersion))
	}
	if deref(got.DeviceKind) != DeviceKindLaptop {
		t.Errorf("DeviceKind = %q, want %q", deref(got.DeviceKind), DeviceKindLaptop)
	}
	if deref(got.Timezone) != "Africa/Accra" {
		t.Errorf("Timezone = %q", deref(got.Timezone))
	}
	// Derived from the zone, since no browser can name its own city.
	if deref(got.LocationCity) != "Accra" {
		t.Errorf("LocationCity = %q, want Accra derived from timezone", deref(got.LocationCity))
	}
	if deref(got.LocationSource) != LocationSourceClient {
		t.Errorf("LocationSource = %q, want %q", deref(got.LocationSource), LocationSourceClient)
	}
}

func TestResolveDeviceNativePayload(t *testing.T) {
	// A native client knows its hardware and names itself through `app`,
	// having no browser.
	metadata := jsonBlob(t, `{
      "platform":"ios",
      "device_type":"mobile",
      "device":{"manufacturer":"Apple","model":"iPhone 16 Pro Max"},
      "os":{"name":"iOS","version":"19.1"},
      "app":{"name":"Rentloop Manager","version":"2.4.0"},
      "locale":{"timezone":"Africa/Accra"},
      "location":{"city":"Accra","country":"Ghana"}
    }`)

	got := ResolveDevice(metadata, nil)

	if deref(got.DeviceName) != "iPhone 16 Pro Max" {
		t.Errorf("DeviceName = %q", deref(got.DeviceName))
	}
	if deref(got.ClientName) != "Rentloop Manager" {
		t.Errorf("ClientName = %q, want the app name", deref(got.ClientName))
	}
	if deref(got.DeviceKind) != DeviceKindPhone {
		t.Errorf("DeviceKind = %q", deref(got.DeviceKind))
	}
	// An explicit city must win over the timezone-derived one.
	if deref(got.LocationCity) != "Accra" || deref(got.LocationCountry) != "Ghana" {
		t.Errorf("location = %q/%q", deref(got.LocationCity), deref(got.LocationCountry))
	}
}

func TestResolveDeviceFallsBackToUserAgent(t *testing.T) {
	// Nothing supplied → UA parsing still fills the row.
	ua := "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
	got := ResolveDevice(nil, &ua)
	if deref(got.OS) != "macOS" || deref(got.ClientName) != "Chrome" {
		t.Errorf("UA fallback failed: %+v", got)
	}
	if got.LocationSource != nil {
		t.Errorf("no location claimed, so source must stay nil, got %q", deref(got.LocationSource))
	}
}

func TestResolveDeviceSurvivesMalformedMetadata(t *testing.T) {
	// Login must not fail over a cosmetic blob.
	bad := jsonBlob(t, `"not-an-object"`)
	ua := "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
	got := ResolveDevice(bad, &ua)
	if deref(got.OS) != "macOS" {
		t.Errorf("OS = %q, want UA fallback to survive bad metadata", deref(got.OS))
	}
}

func TestTimezoneCity(t *testing.T) {
	cases := map[string]string{
		"Africa/Accra":                   "Accra",
		"America/New_York":               "New York",
		"America/Argentina/Buenos_Aires": "Buenos Aires",
		"Europe/London":                  "London",
		// Not places — must yield nothing rather than a fake city.
		"UTC":       "",
		"Etc/GMT+3": "",
		"":          "",
	}
	for zone, want := range cases {
		if got := TimezoneCity(zone); got != want {
			t.Errorf("TimezoneCity(%q) = %q, want %q", zone, got, want)
		}
	}
}

// jsonBlob builds a datatypes.JSON from a literal.
func jsonBlob(t *testing.T, raw string) *datatypes.JSON {
	t.Helper()
	blob := datatypes.JSON([]byte(raw))
	return &blob
}

func TestResolveDevicePrefersMarketingName(t *testing.T) {
	// iOS reports "iPhone16,2"; the app maps it to something a person
	// recognises. The readable name must win.
	metadata := jsonBlob(t, `{
      "platform":"ios",
      "device":{"manufacturer":"Apple","model":"iPhone16,2","marketing_name":"iPhone 15 Pro Max"},
      "app":{"name":"Rentloop Manager","version":"2.4.0"}
    }`)
	got := ResolveDevice(metadata, nil)
	if deref(got.DeviceName) != "iPhone 15 Pro Max" {
		t.Errorf("DeviceName = %q, want the marketing name", deref(got.DeviceName))
	}
}

func TestResolveDeviceFallsBackToModelCode(t *testing.T) {
	// Unknown model → the raw code is still better than nothing.
	metadata := jsonBlob(t, `{"device":{"model":"SM-X999Z"}}`)
	got := ResolveDevice(metadata, nil)
	if deref(got.DeviceName) != "SM-X999Z" {
		t.Errorf("DeviceName = %q, want the model code", deref(got.DeviceName))
	}
}
