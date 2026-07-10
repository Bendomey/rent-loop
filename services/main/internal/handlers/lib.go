package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/sirupsen/logrus"
)

func GetPopulateFields(r *http.Request) *[]string {
	var populateFields *[]string = nil
	populate := r.URL.Query().Get("populate")

	if populate != "" {
		fields := strings.Split(populate, ",")
		populateFields = &fields
	}

	return populateFields
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
