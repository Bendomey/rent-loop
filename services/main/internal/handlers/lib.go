package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/sirupsen/logrus"
)

// ParseDateParam reads a date query param that may arrive either as a full
// RFC3339 timestamp or as a bare YYYY-MM-DD. An empty string means "not
// supplied" and yields (nil, nil); anything unparseable is an error so the
// caller can reject the request instead of silently dropping the filter.
func ParseDateParam(value string) (*time.Time, error) {
	if value == "" {
		return nil, nil
	}

	for _, layout := range []string{time.RFC3339, "2006-01-02"} {
		if parsed, err := time.Parse(layout, value); err == nil {
			return &parsed, nil
		}
	}

	return nil, fmt.Errorf("invalid date %q: want RFC3339 or YYYY-MM-DD", value)
}

func GetPopulateFields(r *http.Request) *[]string {
	var populateFields *[]string = nil
	populate := r.URL.Query().Get("populate")

	if populate != "" {
		fields := strings.Split(populate, ",")
		populateFields = &fields
	}

	return populateFields
}

// ClientIPFromRequest resolves the caller's IP.
//
// We sit behind Fly's proxy, so RemoteAddr is the proxy and a forwarded header
// is the only way to see the real caller. That makes header handling security-
// relevant rather than cosmetic: this value is stored on the session row and
// shown on My Account → Sessions, where people decide whether access is theirs.
//
// Trust model — exactly one proxy hop (Fly's edge) sits in front of us:
//
//   - Fly-Client-IP is set by that proxy and overwrites whatever the client
//     sent, so it is the one header a client cannot forge. Preferred.
//   - X-Forwarded-For is a chain the client can seed. A caller sending
//     "X-Forwarded-For: 8.8.8.8" gets "8.8.8.8, <their real ip>" once Fly
//     appends. The LAST entry is the one our trusted proxy added; the first is
//     whatever the client chose to claim. So we read from the right, not the
//     left — the usual "take the leftmost" advice assumes you are counting
//     hops through proxies you control, and is spoofable here.
//   - RemoteAddr is the fallback for local development, where nothing is in
//     front of us. It carries a port, which must be stripped.
//
// Candidates that don't parse as an IP are skipped rather than stored, so a
// junk header can't poison the column or the geo lookup. Returns nil when
// nothing usable is present, leaving the column NULL.
func ClientIPFromRequest(r *http.Request) *string {
	if ip := normaliseIP(r.Header.Get("Fly-Client-IP")); ip != "" {
		return &ip
	}

	// Right-to-left: the rightmost entry is the one Fly appended.
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		parts := strings.Split(forwarded, ",")
		for i := len(parts) - 1; i >= 0; i-- {
			if ip := normaliseIP(parts[i]); ip != "" {
				return &ip
			}
		}
	}

	if ip := normaliseIP(r.Header.Get("X-Real-IP")); ip != "" {
		return &ip
	}

	// Local development: no proxy, and RemoteAddr is "host:port".
	if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
		if ip := normaliseIP(host); ip != "" {
			return &ip
		}
	}
	if ip := normaliseIP(r.RemoteAddr); ip != "" {
		return &ip
	}

	return nil
}

// normaliseIP trims a candidate and returns it only if it is a real IP
// address. IPv6 values sometimes arrive bracketed ("[::1]"), which net.ParseIP
// rejects, so those are unwrapped first.
func normaliseIP(raw string) string {
	candidate := strings.TrimSpace(raw)
	if candidate == "" {
		return ""
	}
	candidate = strings.TrimPrefix(candidate, "[")
	candidate = strings.TrimSuffix(candidate, "]")
	if net.ParseIP(candidate) == nil {
		return ""
	}
	return candidate
}

// UserAgentFromRequest returns nil rather than an empty string so the column
// stays NULL when the header is absent.
func UserAgentFromRequest(r *http.Request) *string {
	ua := r.UserAgent()
	if ua == "" {
		return nil
	}
	return &ua
}

// handle error response
func HandleErrorResponse[T error](w http.ResponseWriter, err T) {
	var det *pkg.IRentLoopError
	if errors.As(err, &det) {
		w.WriteHeader(det.Code)
		encodeErr := json.NewEncoder(w).Encode(map[string]any{
			"errors": map[string]string{
				"message": det.Message,
			},
		})
		if encodeErr != nil {
			logrus.Error(encodeErr.Error())
		}

		return
	}

	w.WriteHeader(http.StatusBadRequest)
	encodeErr := json.NewEncoder(w).Encode(map[string]any{
		"errors": map[string]string{
			"message": err.Error(),
		},
	})

	if encodeErr != nil {
		logrus.Error(encodeErr.Error())
	}
}

func ValidateRequestedPropertyAccess(
	w http.ResponseWriter,
	r *http.Request,
	appCtx pkg.AppContext,
) (propertyIDs *[]string, clientUserID string, ok bool) {
	currentUser, userOk := lib.ClientUserFromContext(r.Context())
	if !userOk || currentUser == nil {
		http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
		return nil, "", false
	}

	requested := r.URL.Query()["property_id"]
	if len(requested) == 0 {
		return nil, currentUser.ID, true
	}

	deduped := make([]string, 0, len(requested))
	seen := make(map[string]bool, len(requested))
	for _, id := range requested {
		if id != "" && !seen[id] {
			seen[id] = true
			deduped = append(deduped, id)
		}
	}
	if len(deduped) == 0 {
		return nil, currentUser.ID, true
	}

	// Bounded by how many ids were requested, not by how many properties the
	// caller can reach. Reading the ids back rather than counting them keeps
	// this independent of how COUNT(DISTINCT ...) is emitted, and duplicate
	// link rows cannot inflate the result into a false pass.
	var linked []string
	if err := appCtx.DB.Model(&models.ClientUserProperty{}).
		Where(
			"client_user_id = ? AND property_id IN (?) AND deleted_at IS NULL",
			currentUser.ID,
			deduped,
		).
		Distinct().
		Pluck("property_id", &linked).Error; err != nil {
		HandleErrorResponse(w, pkg.InternalServerError(err.Error(), nil))
		return nil, "", false
	}

	linkedSet := make(map[string]bool, len(linked))
	for _, id := range linked {
		linkedSet[id] = true
	}

	// Every requested property must be one the caller is linked to.
	for _, id := range deduped {
		if !linkedSet[id] {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return nil, "", false
		}
	}

	return &deduped, currentUser.ID, true
}

// ResolvePropertyScopeFilter reads any ?property_id query values off the request, validates
// them against the caller's resolved PropertyAccessScope (set by
// middlewares.InjectPropertyAccessScopeMiddleware), and returns the concrete filter to apply.
//
//   - No property_id requested, caller is OWNER (unrestricted): returns (nil, &clientID, true)
//     — callers should filter by client_id directly, not by a property set.
//   - No property_id requested, caller is ADMIN/STAFF: returns (&assignedPropertyIDs, nil, true)
//     — the exact set they're allowed to see, which may be empty.
//   - property_id requested: every requested ID is checked against the caller's scope (belongs
//     to their client if OWNER; is one of their assigned properties otherwise). If all pass,
//     returns (&requestedIDs, nil, true). If any fail, the whole request 403s — never silently
//     drops just the disallowed IDs.
//
// ok is false if the response has already been written (401/403/500); the handler must return
// immediately without doing anything else.
func ResolvePropertyScopeFilter(
	w http.ResponseWriter,
	r *http.Request,
	appCtx pkg.AppContext,
) (propertyIDs *[]string, unrestrictedClientID *string, ok bool) {
	scope, scopeOk := lib.PropertyAccessScopeFromContext(r.Context())
	if !scopeOk || scope == nil {
		http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
		return nil, nil, false
	}

	requestedRaw := r.URL.Query()["property_id"]
	if len(requestedRaw) == 0 {
		if scope.Unrestricted {
			return nil, &scope.ClientID, true
		}
		ids := scope.PropertyIDs
		return &ids, nil, true
	}

	seen := make(map[string]bool, len(requestedRaw))
	requested := make([]string, 0, len(requestedRaw))
	for _, id := range requestedRaw {
		if !seen[id] {
			seen[id] = true
			requested = append(requested, id)
		}
	}

	if scope.Unrestricted {
		var count int64
		err := appCtx.DB.Model(&models.Property{}).
			Where("id IN (?) AND client_id = ? AND deleted_at IS NULL", requested, scope.ClientID).
			Count(&count).Error
		if err != nil {
			HandleErrorResponse(w, pkg.InternalServerError(err.Error(), nil))
			return nil, nil, false
		}
		if int(count) != len(requested) {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return nil, nil, false
		}
		return &requested, nil, true
	}

	allowed := make(map[string]bool, len(scope.PropertyIDs))
	for _, id := range scope.PropertyIDs {
		allowed[id] = true
	}
	for _, id := range requested {
		if !allowed[id] {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return nil, nil, false
		}
	}

	return &requested, nil, true
}
