package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func clientIP(t *testing.T, remoteAddr string, headers map[string]string) string {
	t.Helper()
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.RemoteAddr = remoteAddr
	for k, v := range headers {
		r.Header.Set(k, v)
	}
	got := ClientIPFromRequest(r)
	if got == nil {
		return ""
	}
	return *got
}

func TestClientIPPrefersFlyClientIP(t *testing.T) {
	// Fly sets this itself and overwrites anything the client sent, so it wins
	// over a chain the client may have seeded.
	got := clientIP(t, "10.0.0.1:1234", map[string]string{
		"Fly-Client-IP":   "154.160.22.14",
		"X-Forwarded-For": "8.8.8.8, 41.66.208.7",
	})
	if got != "154.160.22.14" {
		t.Errorf("got %q, want the Fly-Client-IP value", got)
	}
}

func TestClientIPIgnoresSpoofedForwardedPrefix(t *testing.T) {
	// The attack this guards: a client sends "X-Forwarded-For: 8.8.8.8" and
	// Fly appends their real address. Reading left-to-right would store the
	// value the caller chose, letting a session claim to be anywhere.
	got := clientIP(t, "10.0.0.1:1234", map[string]string{
		"X-Forwarded-For": "8.8.8.8, 154.160.22.14",
	})
	if got != "154.160.22.14" {
		t.Errorf("got %q, want the proxy-appended (rightmost) entry", got)
	}
}

func TestClientIPSingleForwardedEntry(t *testing.T) {
	got := clientIP(t, "10.0.0.1:1234", map[string]string{
		"X-Forwarded-For": "154.160.22.14",
	})
	if got != "154.160.22.14" {
		t.Errorf("got %q, want 154.160.22.14", got)
	}
}

func TestClientIPSkipsJunkEntries(t *testing.T) {
	// A trailing garbage entry must not poison the column — fall back to the
	// next usable value rather than storing nonsense.
	got := clientIP(t, "10.0.0.1:1234", map[string]string{
		"X-Forwarded-For": "154.160.22.14, not-an-ip",
	})
	if got != "154.160.22.14" {
		t.Errorf("got %q, want the last parseable entry", got)
	}
}

func TestClientIPStripsPortFromRemoteAddr(t *testing.T) {
	// Local development: no proxy in front, RemoteAddr is "host:port". The
	// port must not reach the column or the geo lookup.
	got := clientIP(t, "127.0.0.1:54321", nil)
	if got != "127.0.0.1" {
		t.Errorf("got %q, want 127.0.0.1 with the port stripped", got)
	}
}

func TestClientIPHandlesIPv6RemoteAddr(t *testing.T) {
	got := clientIP(t, "[::1]:54321", nil)
	if got != "::1" {
		t.Errorf("got %q, want ::1", got)
	}
}

func TestClientIPFallsBackToXRealIP(t *testing.T) {
	got := clientIP(t, "10.0.0.1:1234", map[string]string{
		"X-Real-IP": "41.66.208.7",
	})
	if got != "41.66.208.7" {
		t.Errorf("got %q, want 41.66.208.7", got)
	}
}

func TestClientIPReturnsNilWhenUnusable(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.RemoteAddr = ""
	r.Header.Set("X-Forwarded-For", "garbage, also-garbage")
	if got := ClientIPFromRequest(r); got != nil {
		t.Errorf("expected nil so the column stays NULL, got %q", *got)
	}
}

func TestParseDateParamEmptyIsNil(t *testing.T) {
	got, err := ParseDateParam("")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != nil {
		t.Errorf("got %v, want nil for an absent param", got)
	}
}

func TestParseDateParamAcceptsDateOnly(t *testing.T) {
	got, err := ParseDateParam("2026-08-01")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got == nil || got.Format("2006-01-02") != "2026-08-01" {
		t.Errorf("got %v, want 2026-08-01", got)
	}
}

func TestParseDateParamAcceptsRFC3339(t *testing.T) {
	got, err := ParseDateParam("2026-08-01T00:00:00Z")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got == nil || got.Format("2006-01-02") != "2026-08-01" {
		t.Errorf("got %v, want 2026-08-01", got)
	}
}

// A malformed date must be rejected rather than dropped. Silently ignoring it
// would widen the query to every lease, which surfaces as "nothing is
// expiring" — wrong in the direction that hides work from a manager.
func TestParseDateParamRejectsGarbage(t *testing.T) {
	if _, err := ParseDateParam("last tuesday"); err == nil {
		t.Error("got nil error, want a parse failure")
	}
}
