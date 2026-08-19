package lib

import (
	"regexp"
	"testing"
	"time"
)

// The date segment is the tenant's own month, which is the whole reason
// GeneratePrefixedCodeAt takes an instant rather than reading the clock.
func TestFormatPrefixedCodeDatesFromTheInstantGiven(t *testing.T) {
	cases := []struct {
		name string
		at   time.Time
		want string
	}{
		{"august 2026", time.Date(2026, 8, 19, 0, 0, 0, 0, time.UTC), "TEN-2608-AB12CD"},
		{"december pads nothing", time.Date(2025, 12, 1, 0, 0, 0, 0, time.UTC), "TEN-2512-AB12CD"},
		{"single-digit month pads", time.Date(2026, 3, 9, 0, 0, 0, 0, time.UTC), "TEN-2603-AB12CD"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := FormatPrefixedCode("TEN", tc.at, "AB12CD"); got != tc.want {
				t.Fatalf("FormatPrefixedCode = %q, want %q", got, tc.want)
			}
		})
	}
}

// The shape is what a person reads off a receipt or repeats over the phone, so
// it is asserted rather than assumed.
func TestFormatPrefixedCodeShape(t *testing.T) {
	shape := regexp.MustCompile(`^TEN-\d{4}-[A-Z0-9]{6}$`)

	got := FormatPrefixedCode("TEN", time.Now(), "9QK4ZR")
	if !shape.MatchString(got) {
		t.Fatalf("code %q does not match PREFIX-YYMM-XXXXXX", got)
	}
}
