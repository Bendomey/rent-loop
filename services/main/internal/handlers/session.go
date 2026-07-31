package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type SessionHandler struct {
	appCtx  pkg.AppContext
	service services.SessionService
}

func NewSessionHandler(appCtx pkg.AppContext, service services.SessionService) SessionHandler {
	return SessionHandler{appCtx, service}
}

// ListSessions godoc
//
//	@Summary		List your active sessions
//	@Description	Every device currently signed in as you — one entry per sign-in, most recently used first. `is_current` marks the session making this request. `location_city`/`location_country` are null until a GeoIP database is configured, and the device fields are null when the client sent no metadata and its User-Agent could not be parsed.
//	@Tags			Sessions
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	object{data=[]transformations.OutputSession}	"Sessions retrieved successfully"
//	@Failure		401	{object}	lib.HTTPError									"Authorization failed"
//	@Failure		500	{object}	string											"An unexpected error occurred"
//	@Router			/api/v1/admin/users/me/sessions [get]
func (h *SessionHandler) ListSessions(w http.ResponseWriter, r *http.Request) {
	user, ok := lib.UserFromContext(r.Context())
	if !ok || user == nil {
		http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
		return
	}

	sessions, err := h.service.ListActive(r.Context(), user.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBSessionsToRest(sessions, user.SessionID),
	})
}

// RevokeSession godoc
//
//	@Summary		Sign out one session
//	@Description	Ends the given session and every refresh token under it. Idempotent — an already-revoked session still returns 204. A session belonging to another user reports 404 rather than 403, so this cannot be used to probe which session ids exist. Revoking your own current session is allowed and is equivalent to logging out.
//	@Tags			Sessions
//	@Produce		json
//	@Security		BearerAuth
//	@Param			session_id	path	string	true	"Session ID"
//	@Success		204			"Session revoked successfully"
//	@Failure		401			{object}	lib.HTTPError	"Authorization failed"
//	@Failure		404			{object}	lib.HTTPError	"Session not found"
//	@Failure		500			{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/users/me/sessions/{session_id} [delete]
func (h *SessionHandler) RevokeSession(w http.ResponseWriter, r *http.Request) {
	user, ok := lib.UserFromContext(r.Context())
	if !ok || user == nil {
		http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
		return
	}

	sessionID := chi.URLParam(r, "session_id")
	if err := h.service.Revoke(r.Context(), user.ID, sessionID); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// RevokeOtherSessions godoc
//
//	@Summary		Sign out all other sessions
//	@Description	Ends every session for you except the one making this request, which stays signed in. Returns how many were ended. Requires an access token carrying a session claim — tokens issued before sessions existed cannot identify which one to keep and are rejected.
//	@Tags			Sessions
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	object{data=object{revoked_count=int}}	"Other sessions revoked successfully"
//	@Failure		401	{object}	lib.HTTPError							"Authorization failed"
//	@Failure		500	{object}	string									"An unexpected error occurred"
//	@Router			/api/v1/admin/users/me/sessions:revoke-others [post]
func (h *SessionHandler) RevokeOtherSessions(w http.ResponseWriter, r *http.Request) {
	user, ok := lib.UserFromContext(r.Context())
	if !ok || user == nil {
		http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
		return
	}

	// Without a session claim we cannot tell which session to spare, and
	// revoking everything would sign the caller out of the device they are
	// using to ask. Refusing is the safe reading.
	if user.SessionID == "" {
		http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
		return
	}

	count, err := h.service.RevokeOthers(r.Context(), user.ID, user.SessionID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": map[string]any{"revoked_count": count},
	})
}
