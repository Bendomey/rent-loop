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

func TestResolveDeviceClientMetadataWins(t *testing.T) {
	// A phone knows its own model; the UA only knows "iPhone". The client's
	// value must win, and fields it omits must still be filled from the UA.
	ua := "Mozilla/5.0 (iPhone; CPU iPhone OS 19_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
	metadata := jsonBlob(t, `{"device_name":"iPhone 16 Pro Max","client_name":"Rentloop Manager"}`)

	got := ResolveDevice(metadata, &ua)

	if deref(got.DeviceName) != "iPhone 16 Pro Max" {
		t.Errorf("DeviceName = %q, want client-supplied value", deref(got.DeviceName))
	}
	if deref(got.ClientName) != "Rentloop Manager" {
		t.Errorf("ClientName = %q, want client-supplied value", deref(got.ClientName))
	}
	if deref(got.OS) != "iOS" {
		t.Errorf("OS = %q, want UA fallback %q", deref(got.OS), "iOS")
	}
	if deref(got.DeviceKind) != DeviceKindPhone {
		t.Errorf("DeviceKind = %q, want UA fallback", deref(got.DeviceKind))
	}
}

func TestResolveDeviceRejectsUnknownKind(t *testing.T) {
	// An unrecognised kind must not reach the column — the clients switch on it.
	metadata := jsonBlob(t, `{"device_kind":"TOASTER"}`)
	got := ResolveDevice(metadata, nil)
	if deref(got.DeviceKind) != DeviceKindUnknown {
		t.Errorf("DeviceKind = %q, want %q", deref(got.DeviceKind), DeviceKindUnknown)
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

// jsonBlob builds a datatypes.JSON from a literal, failing the test on bad input.
func jsonBlob(t *testing.T, raw string) *datatypes.JSON {
	t.Helper()
	blob := datatypes.JSON([]byte(raw))
	return &blob
}

func TestResolveDeviceCapturesClientLocation(t *testing.T) {
	metadata := jsonBlob(t, `{"timezone":"Africa/Accra","location_city":"Accra","location_country":"Ghana"}`)
	got := ResolveDevice(metadata, nil)

	if deref(got.Timezone) != "Africa/Accra" {
		t.Errorf("Timezone = %q", deref(got.Timezone))
	}
	if deref(got.LocationCity) != "Accra" {
		t.Errorf("LocationCity = %q", deref(got.LocationCity))
	}
	if deref(got.LocationCountry) != "Ghana" {
		t.Errorf("LocationCountry = %q", deref(got.LocationCountry))
	}
	// The marker is the whole point: a place the client chose must never be
	// presented as if the server verified it.
	if deref(got.LocationSource) != LocationSourceClient {
		t.Errorf("LocationSource = %q, want %q", deref(got.LocationSource), LocationSourceClient)
	}
}

func TestResolveDeviceTimezoneAloneMarksSource(t *testing.T) {
	// A browser can always supply a timezone even when it knows no city.
	metadata := jsonBlob(t, `{"timezone":"Europe/London"}`)
	got := ResolveDevice(metadata, nil)
	if deref(got.LocationSource) != LocationSourceClient {
		t.Errorf("LocationSource = %q, want it set from timezone alone", deref(got.LocationSource))
	}
	if got.LocationCity != nil {
		t.Errorf("LocationCity should stay nil, got %q", deref(got.LocationCity))
	}
}

func TestResolveDeviceNoLocationLeavesSourceNil(t *testing.T) {
	// No location claimed → no source. A null source is how the API says
	// "we don't know where this is" rather than "the client said nothing".
	metadata := jsonBlob(t, `{"device_name":"iPhone 16 Pro Max"}`)
	got := ResolveDevice(metadata, nil)
	if got.LocationSource != nil {
		t.Errorf("LocationSource = %q, want nil", deref(got.LocationSource))
	}
}

func TestResolveDeviceBlankLocationIsNotAClaim(t *testing.T) {
	// Whitespace must not occupy a column that reads as "we know this".
	metadata := jsonBlob(t, `{"location_city":"   ","timezone":""}`)
	got := ResolveDevice(metadata, nil)
	if got.LocationCity != nil || got.Timezone != nil || got.LocationSource != nil {
		t.Errorf("blank values should be dropped, got %+v", got)
	}
}
