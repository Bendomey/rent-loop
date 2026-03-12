package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type NotificationHandler struct {
	appCtx  pkg.AppContext
	service services.NotificationService
}

func NewNotificationHandler(appCtx pkg.AppContext, service services.NotificationService) NotificationHandler {
	return NotificationHandler{appCtx: appCtx, service: service}
}

type RegisterFcmTokenRequest struct {
	Token    string `json:"token"    validate:"required"                   example:"fcm-device-token" description:"FCM device token"`
	Platform string `json:"platform" validate:"required,oneof=ios android" example:"ios"              description:"Device platform: ios or android"`
}

type DeleteFcmTokenRequest struct {
	Token string `json:"token" validate:"required" example:"fcm-device-token" description:"FCM device token to remove"`
}

// DeleteFcmToken godoc
//
//	@Summary		Delete FCM device token
//	@Description	Removes an FCM device token for the authenticated tenant account. Call this on logout.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Param			body	body		DeleteFcmTokenRequest	true	"FCM token deletion body"
//	@Success		204		{object}	nil						"No Content"
//	@Failure		400		{object}	lib.HTTPError			"Bad request"
//	@Failure		401		{object}	lib.HTTPError			"Unauthorized"
//	@Failure		422		{object}	lib.HTTPError			"Validation error"
//	@Failure		500		{object}	string					"An unexpected error occurred"
//	@Router			/api/v1/tenant-accounts/fcm-token [delete]
func (h *NotificationHandler) DeleteFcmToken(w http.ResponseWriter, r *http.Request) {
	var body DeleteFcmTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	tenantAccount, _ := lib.TenantAccountFromContext(r.Context())

	if err := h.service.DeleteToken(r.Context(), tenantAccount.ID, body.Token); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// RegisterFcmToken godoc
//
//	@Summary		Register FCM device token
//	@Description	Upserts an FCM device token for the authenticated tenant account. Call this after login and on token refresh.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Param			body	body		RegisterFcmTokenRequest	true	"FCM token registration body"
//	@Success		204		{object}	nil						"No Content"
//	@Failure		400		{object}	lib.HTTPError			"Bad request"
//	@Failure		401		{object}	lib.HTTPError			"Unauthorized"
//	@Failure		422		{object}	lib.HTTPError			"Validation error"
//	@Failure		500		{object}	string					"An unexpected error occurred"
//	@Router			/api/v1/tenant-accounts/fcm-token [post]
func (h *NotificationHandler) RegisterFcmToken(w http.ResponseWriter, r *http.Request) {
	var body RegisterFcmTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	tenantAccount, _ := lib.TenantAccountFromContext(r.Context())

	if err := h.service.RegisterToken(r.Context(), services.RegisterFcmTokenInput{
		TenantAccountID: tenantAccount.ID,
		Token:           body.Token,
		Platform:        body.Platform,
	}); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
