package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
	log "github.com/sirupsen/logrus"
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

// TenantListNotifications godoc
//
//	@Summary		List in-app notifications (Tenant)
//	@Description	Returns paginated in-app notifications for the authenticated tenant account, newest first.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			page		query		int	false	"Page number (default 1)"
//	@Param			page_size	query		int	false	"Page size (default 20, max 50)"
//	@Success		200			{object}	object{data=object{rows=[]object,meta=object}}
//	@Failure		401			{object}	lib.HTTPError	"Unauthorized"
//	@Failure		500			{object}	string			"Unexpected error"
//	@Router			/api/v1/tenant-accounts/notifications [get]
func (h *NotificationHandler) TenantListNotifications(w http.ResponseWriter, r *http.Request) {
	tenantAccount, _ := lib.TenantAccountFromContext(r.Context())
	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		http.Error(w, filterErr.Error(), http.StatusBadRequest)
		return
	}

	notifications, total, err := h.service.ListInApp(
		r.Context(),
		tenantAccount.ID,
		"TENANT_ACCOUNT",
		filterQuery.Page,
		filterQuery.PageSize,
	)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	rows := make([]any, len(notifications))
	for i, n := range notifications {
		rows[i] = transformations.DBNotificationToRest(n)
	}

	w.WriteHeader(http.StatusOK)
	if encodeErr := json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, total)); encodeErr != nil {
		log.Error(encodeErr.Error())
	}
}

// TenantMarkNotificationRead godoc
//
//	@Summary		Mark notification as read (Tenant)
//	@Description	Marks a single in-app notification as read for the authenticated tenant account.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			notification_id	path		string			true	"Notification ID (UUID)"
//	@Success		204				{object}	nil				"No Content"
//	@Failure		401				{object}	lib.HTTPError	"Unauthorized"
//	@Failure		404				{object}	lib.HTTPError	"Not found"
//	@Failure		500				{object}	string			"Unexpected error"
//	@Router			/api/v1/tenant-accounts/notifications/{notification_id}/read [post]
func (h *NotificationHandler) TenantMarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	tenantAccount, _ := lib.TenantAccountFromContext(r.Context())
	notificationID := chi.URLParam(r, "notification_id")

	if err := h.service.MarkAsRead(r.Context(), notificationID, tenantAccount.ID); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// TenantMarkAllRead godoc
//
//	@Summary		Mark all notifications as read (Tenant)
//	@Description	Marks all unread in-app notifications as read for the authenticated tenant account.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		204	{object}	nil				"No Content"
//	@Failure		401	{object}	lib.HTTPError	"Unauthorized"
//	@Failure		500	{object}	string			"Unexpected error"
//	@Router			/api/v1/tenant-accounts/notifications/read-all [post]
func (h *NotificationHandler) TenantMarkAllRead(w http.ResponseWriter, r *http.Request) {
	tenantAccount, _ := lib.TenantAccountFromContext(r.Context())

	if err := h.service.MarkAllAsRead(r.Context(), tenantAccount.ID, "TENANT_ACCOUNT"); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// TenantGetUnreadCount godoc
//
//	@Summary		Get unread notification count (Tenant)
//	@Description	Returns the count of unread in-app notifications for the authenticated tenant account.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	object{data=object{count=integer}}	"Unread count"
//	@Failure		401	{object}	lib.HTTPError						"Unauthorized"
//	@Failure		500	{object}	string								"Unexpected error"
//	@Router			/api/v1/tenant-accounts/notifications/unread-count [get]
func (h *NotificationHandler) TenantGetUnreadCount(w http.ResponseWriter, r *http.Request) {
	tenantAccount, _ := lib.TenantAccountFromContext(r.Context())

	count, err := h.service.GetUnreadCount(r.Context(), tenantAccount.ID, "TENANT_ACCOUNT")
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	if encodeErr := json.NewEncoder(w).Encode(map[string]any{
		"data": map[string]any{"count": count},
	}); encodeErr != nil {
		log.Error(encodeErr.Error())
	}
}

// PMListNotifications godoc
//
//	@Summary		List in-app notifications (Property Manager)
//	@Description	Returns paginated in-app notifications for the authenticated client user, newest first.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			page		query		int	false	"Page number (default 1)"
//	@Param			page_size	query		int	false	"Page size (default 20, max 50)"
//	@Success		200			{object}	object{data=object{rows=[]object,meta=object}}
//	@Failure		401			{object}	lib.HTTPError	"Unauthorized"
//	@Failure		500			{object}	string			"Unexpected error"
//	@Router			/api/v1/notifications [get]
func (h *NotificationHandler) PMListNotifications(w http.ResponseWriter, r *http.Request) {
	clientUser, _ := lib.ClientUserFromContext(r.Context())
	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		http.Error(w, filterErr.Error(), http.StatusBadRequest)
		return
	}

	notifications, total, err := h.service.ListInApp(
		r.Context(),
		clientUser.ID,
		"CLIENT_USER",
		filterQuery.Page,
		filterQuery.PageSize,
	)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	rows := make([]any, len(notifications))
	for i, n := range notifications {
		rows[i] = transformations.DBNotificationToRest(n)
	}

	w.WriteHeader(http.StatusOK)
	if encodeErr := json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, total)); encodeErr != nil {
		log.Error(encodeErr.Error())
	}
}

// PMMarkNotificationRead godoc
//
//	@Summary		Mark notification as read (Property Manager)
//	@Description	Marks a single in-app notification as read for the authenticated client user.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			notification_id	path		string			true	"Notification ID (UUID)"
//	@Success		204				{object}	nil				"No Content"
//	@Failure		401				{object}	lib.HTTPError	"Unauthorized"
//	@Failure		404				{object}	lib.HTTPError	"Not found"
//	@Failure		500				{object}	string			"Unexpected error"
//	@Router			/api/v1/notifications/{notification_id}/read [post]
func (h *NotificationHandler) PMMarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	clientUser, _ := lib.ClientUserFromContext(r.Context())
	notificationID := chi.URLParam(r, "notification_id")

	if err := h.service.MarkAsRead(r.Context(), notificationID, clientUser.ID); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// PMMarkAllRead godoc
//
//	@Summary		Mark all notifications as read (Property Manager)
//	@Description	Marks all unread in-app notifications as read for the authenticated client user.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		204	{object}	nil				"No Content"
//	@Failure		401	{object}	lib.HTTPError	"Unauthorized"
//	@Failure		500	{object}	string			"Unexpected error"
//	@Router			/api/v1/notifications/read-all [post]
func (h *NotificationHandler) PMMarkAllRead(w http.ResponseWriter, r *http.Request) {
	clientUser, _ := lib.ClientUserFromContext(r.Context())

	if err := h.service.MarkAllAsRead(r.Context(), clientUser.ID, "CLIENT_USER"); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// PMGetUnreadCount godoc
//
//	@Summary		Get unread notification count (Property Manager)
//	@Description	Returns the count of unread in-app notifications for the authenticated client user.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	object{data=object{count=integer}}	"Unread count"
//	@Failure		401	{object}	lib.HTTPError						"Unauthorized"
//	@Failure		500	{object}	string								"Unexpected error"
//	@Router			/api/v1/notifications/unread-count [get]
func (h *NotificationHandler) PMGetUnreadCount(w http.ResponseWriter, r *http.Request) {
	clientUser, _ := lib.ClientUserFromContext(r.Context())

	count, err := h.service.GetUnreadCount(r.Context(), clientUser.ID, "CLIENT_USER")
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	if encodeErr := json.NewEncoder(w).Encode(map[string]any{
		"data": map[string]any{"count": count},
	}); encodeErr != nil {
		log.Error(encodeErr.Error())
	}
}
