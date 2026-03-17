package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type AnnouncementHandler struct {
	service services.AnnouncementService
	appCtx  pkg.AppContext
}

func NewAnnouncementHandler(appCtx pkg.AppContext, service services.AnnouncementService) AnnouncementHandler {
	return AnnouncementHandler{service, appCtx}
}

// ─── PM (Admin) Handlers ─────────────────────────────────────────────────────

type CreateAnnouncementRequest struct {
	Title           string     `json:"title"                       validate:"required"                                                     example:"Water Outage Notice"`
	Content         string     `json:"content"                     validate:"required"                                                     example:"Water will be unavailable on Monday from 8am-12pm."`
	Type            string     `json:"type"                        validate:"required,oneof=MAINTENANCE COMMUNITY POLICY_CHANGE EMERGENCY" example:"MAINTENANCE"`
	Priority        string     `json:"priority"                    validate:"required,oneof=NORMAL IMPORTANT URGENT"                       example:"IMPORTANT"`
	PropertyID      *string    `json:"property_id,omitempty"       validate:"omitempty,uuid4"                                              example:"550e8400-e29b-41d4-a716-446655440000"`
	PropertyBlockID *string    `json:"property_block_id,omitempty" validate:"omitempty,uuid4"                                              example:"660e8400-e29b-41d4-a716-446655440001"`
	TargetUnitIDs   *[]string  `json:"target_unit_ids,omitempty"   validate:"omitempty,dive,uuid4"`
	ScheduledAt     *time.Time `json:"scheduled_at,omitempty"      validate:"omitempty"`
	ExpiresAt       *time.Time `json:"expires_at,omitempty"        validate:"omitempty"`
}

// CreateAnnouncement godoc
//
//	@Summary		Create a new announcement (Admin)
//	@Description	Create a new announcement in DRAFT status
//	@Tags			Announcements
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body		CreateAnnouncementRequest	true	"Announcement details"
//	@Success		201		{object}	object{data=transformations.AdminOutputAnnouncement}
//	@Failure		400		{object}	lib.HTTPError
//	@Failure		401		{object}	string
//	@Failure		500		{object}	string
//	@Router			/api/v1/admin/announcements [post]
func (h *AnnouncementHandler) CreateAnnouncement(w http.ResponseWriter, r *http.Request) {
	currentUser, currentUserOk := lib.ClientUserFromContext(r.Context())
	if !currentUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreateAnnouncementRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	// If scoped to a property via URL param, override body property_id
	if propertyID := chi.URLParam(r, "property_id"); propertyID != "" {
		body.PropertyID = &propertyID
	}

	announcement, err := h.service.Create(r.Context(), services.CreateAnnouncementInput{
		Title:           body.Title,
		Content:         body.Content,
		Type:            body.Type,
		Priority:        body.Priority,
		ClientID:        currentUser.ClientID,
		CreatedByID:     currentUser.ID,
		PropertyID:      body.PropertyID,
		PropertyBlockID: body.PropertyBlockID,
		TargetUnitIDs:   body.TargetUnitIDs,
		ScheduledAt:     body.ScheduledAt,
		ExpiresAt:       body.ExpiresAt,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAnnouncementToRest(announcement),
	})
}

type UpdateAnnouncementRequest struct {
	Title           *string                 `json:"title,omitempty"             validate:"omitempty"                                                     example:"Updated Notice"`
	Content         *string                 `json:"content,omitempty"           validate:"omitempty"                                                     example:"Updated content."`
	Type            *string                 `json:"type,omitempty"              validate:"omitempty,oneof=MAINTENANCE COMMUNITY POLICY_CHANGE EMERGENCY" example:"COMMUNITY"`
	Priority        *string                 `json:"priority,omitempty"          validate:"omitempty,oneof=NORMAL IMPORTANT URGENT"                       example:"NORMAL"`
	PropertyID      lib.Optional[string]    `json:"property_id,omitempty"       validate:"omitempty,uuid4"                                                                          swaggertype:"string"`
	PropertyBlockID lib.Optional[string]    `json:"property_block_id,omitempty" validate:"omitempty,uuid4"                                                                          swaggertype:"string"`
	TargetUnitIDs   *[]string               `json:"target_unit_ids,omitempty"   validate:"omitempty,dive,uuid4"`
	ScheduledAt     lib.Optional[time.Time] `json:"scheduled_at,omitempty"      validate:"omitempty"                                                                                swaggertype:"string"`
	ExpiresAt       lib.Optional[time.Time] `json:"expires_at,omitempty"        validate:"omitempty"                                                                                swaggertype:"string"`
}

// UpdateAnnouncement godoc
//
//	@Summary		Update an announcement (Admin)
//	@Description	Update a DRAFT announcement
//	@Tags			Announcements
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			announcement_id	path		string						true	"Announcement ID"
//	@Param			body			body		UpdateAnnouncementRequest	true	"Announcement updates"
//	@Success		200				{object}	object{data=transformations.AdminOutputAnnouncement}
//	@Failure		400				{object}	lib.HTTPError
//	@Failure		401				{object}	string
//	@Failure		500				{object}	string
//	@Router			/api/v1/admin/announcements/{announcement_id} [patch]
func (h *AnnouncementHandler) UpdateAnnouncement(w http.ResponseWriter, r *http.Request) {
	_, currentUserOk := lib.ClientUserFromContext(r.Context())
	if !currentUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	announcementID := chi.URLParam(r, "announcement_id")

	var body UpdateAnnouncementRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	announcement, err := h.service.Update(r.Context(), services.UpdateAnnouncementInput{
		ID:              announcementID,
		Title:           body.Title,
		Content:         body.Content,
		Type:            body.Type,
		Priority:        body.Priority,
		PropertyID:      body.PropertyID,
		PropertyBlockID: body.PropertyBlockID,
		TargetUnitIDs:   body.TargetUnitIDs,
		ScheduledAt:     body.ScheduledAt,
		ExpiresAt:       body.ExpiresAt,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAnnouncementToRest(announcement),
	})
}

// DeleteAnnouncement godoc
//
//	@Summary		Delete an announcement (Admin)
//	@Description	Delete a DRAFT announcement
//	@Tags			Announcements
//	@Security		BearerAuth
//	@Produce		json
//	@Param			announcement_id	path		string	true	"Announcement ID"
//	@Success		204				{object}	nil
//	@Failure		400				{object}	lib.HTTPError
//	@Failure		401				{object}	string
//	@Failure		500				{object}	string
//	@Router			/api/v1/admin/announcements/{announcement_id} [delete]
func (h *AnnouncementHandler) DeleteAnnouncement(w http.ResponseWriter, r *http.Request) {
	announcementID := chi.URLParam(r, "announcement_id")

	if err := h.service.Delete(r.Context(), announcementID); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetAnnouncementById godoc
//
//	@Summary		Get announcement by ID (Admin)
//	@Description	Get a single announcement by ID
//	@Tags			Announcements
//	@Security		BearerAuth
//	@Produce		json
//	@Param			announcement_id	path		string							true	"Announcement ID"
//	@Param			q				query		GetDocumentWithPopulateQuery	false	"Populate fields"
//	@Success		200				{object}	object{data=transformations.AdminOutputAnnouncement}
//	@Failure		400				{object}	lib.HTTPError
//	@Failure		401				{object}	string
//	@Failure		500				{object}	string
//	@Router			/api/v1/admin/announcements/{announcement_id} [get]
func (h *AnnouncementHandler) GetAnnouncementById(w http.ResponseWriter, r *http.Request) {
	announcementID := chi.URLParam(r, "announcement_id")
	populateFields := GetPopulateFields(r)

	announcement, err := h.service.GetByIDWithPopulate(r.Context(), repository.GetAnnouncementQuery{
		ID:       announcementID,
		Populate: populateFields,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAnnouncementToRest(announcement),
	})
}

type ListAnnouncementsFilterRequest struct {
	lib.FilterQueryInput
	Status *string `json:"status,omitempty" validate:"omitempty,oneof=DRAFT SCHEDULED PUBLISHED EXPIRED"             example:"PUBLISHED"`
	Type   *string `json:"type,omitempty"   validate:"omitempty,oneof=MAINTENANCE COMMUNITY POLICY_CHANGE EMERGENCY" example:"MAINTENANCE"`
}

// ListAnnouncements godoc
//
//	@Summary		List announcements (Admin)
//	@Description	List announcements for the current client
//	@Tags			Announcements
//	@Security		BearerAuth
//	@Produce		json
//	@Param			q	query		ListAnnouncementsFilterRequest	false	"Filters"
//	@Success		200	{object}	object{data=object{rows=[]transformations.AdminOutputAnnouncement,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400	{object}	lib.HTTPError
//	@Failure		401	{object}	string
//	@Failure		500	{object}	string
//	@Router			/api/v1/admin/announcements [get]
func (h *AnnouncementHandler) ListAnnouncements(w http.ResponseWriter, r *http.Request) {
	currentUser, currentUserOk := lib.ClientUserFromContext(r.Context())
	if !currentUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	clientID := currentUser.ClientID

	filters := ListAnnouncementsFilterRequest{
		Status: lib.NullOrString(r.URL.Query().Get("status")),
		Type:   lib.NullOrString(r.URL.Query().Get("type")),
	}

	if !lib.ValidateRequest(h.appCtx.Validator, filters, w) {
		return
	}

	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		HandleErrorResponse(w, filterErr)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, filterQuery, w) {
		return
	}

	// Optional property scoping via URL param
	var propertyID *string
	if pid := chi.URLParam(r, "property_id"); pid != "" {
		propertyID = &pid
	} else {
		propertyID = nil
	}

	input := repository.ListAnnouncementsFilter{
		ClientID:   &clientID,
		PropertyID: propertyID,
		Status:     filters.Status,
		Type:       filters.Type,
	}

	announcements, announcementsErr := h.service.List(r.Context(), *filterQuery, input)
	if announcementsErr != nil {
		HandleErrorResponse(w, announcementsErr)
		return
	}

	count, countErr := h.service.Count(r.Context(), *filterQuery, input)
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	rows := make([]interface{}, 0)
	for _, a := range announcements {
		rows = append(rows, transformations.DBAnnouncementToRest(&a))
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, count))
}

// PublishAnnouncement godoc
//
//	@Summary		Publish an announcement (Admin)
//	@Description	Publish a DRAFT or SCHEDULED announcement immediately
//	@Tags			Announcements
//	@Security		BearerAuth
//	@Produce		json
//	@Param			announcement_id	path		string	true	"Announcement ID"
//	@Success		204				{object}	nil
//	@Failure		400				{object}	lib.HTTPError
//	@Failure		401				{object}	string
//	@Failure		500				{object}	string
//	@Router			/api/v1/admin/announcements/{announcement_id}/publish [post]
func (h *AnnouncementHandler) PublishAnnouncement(w http.ResponseWriter, r *http.Request) {
	announcementID := chi.URLParam(r, "announcement_id")

	if err := h.service.Publish(r.Context(), announcementID); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type ScheduleAnnouncementRequest struct {
	ScheduledAt time.Time `json:"scheduled_at" validate:"required" example:"2026-04-01T09:00:00Z"`
}

// ScheduleAnnouncement godoc
//
//	@Summary		Schedule an announcement (Admin)
//	@Description	Schedule a DRAFT announcement for future publishing
//	@Tags			Announcements
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			announcement_id	path		string						true	"Announcement ID"
//	@Param			body			body		ScheduleAnnouncementRequest	true	"Schedule details"
//	@Success		200				{object}	object{data=transformations.AdminOutputAnnouncement}
//	@Failure		400				{object}	lib.HTTPError
//	@Failure		401				{object}	string
//	@Failure		500				{object}	string
//	@Router			/api/v1/admin/announcements/{announcement_id}/schedule [post]
func (h *AnnouncementHandler) ScheduleAnnouncement(w http.ResponseWriter, r *http.Request) {
	announcementID := chi.URLParam(r, "announcement_id")

	var body ScheduleAnnouncementRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	announcement, err := h.service.Schedule(r.Context(), services.ScheduleAnnouncementInput{
		ID:          announcementID,
		ScheduledAt: body.ScheduledAt,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAnnouncementToRest(announcement),
	})
}

// CancelScheduleAnnouncement godoc
//
//	@Summary		Cancel a scheduled announcement (Admin)
//	@Description	Cancels the queued publish job and reverts the announcement back to DRAFT
//	@Tags			Announcements
//	@Security		BearerAuth
//	@Produce		json
//	@Param			announcement_id	path		string	true	"Announcement ID"
//	@Success		204				{object}	nil
//	@Failure		400				{object}	lib.HTTPError
//	@Failure		401				{object}	string
//	@Failure		404				{object}	lib.HTTPError
//	@Failure		500				{object}	string
//	@Router			/api/v1/admin/announcements/{announcement_id}/schedule [delete]
func (h *AnnouncementHandler) CancelScheduleAnnouncement(w http.ResponseWriter, r *http.Request) {
	announcementID := chi.URLParam(r, "announcement_id")

	if err := h.service.CancelSchedule(r.Context(), announcementID); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type ExtendAnnouncementExpiryRequest struct {
	ExpiresAt time.Time `json:"expires_at" validate:"required" example:"2026-06-01T00:00:00Z"`
}

// ExtendAnnouncementExpiry godoc
//
//	@Summary		Extend announcement expiry (Admin)
//	@Description	Update the expiry time of a PUBLISHED announcement; cancels the existing expire job and enqueues a new one
//	@Tags			Announcements
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			announcement_id	path		string							true	"Announcement ID"
//	@Param			body			body		ExtendAnnouncementExpiryRequest	true	"New expiry"
//	@Success		204				{object}	nil
//	@Failure		400				{object}	lib.HTTPError
//	@Failure		401				{object}	string
//	@Failure		404				{object}	lib.HTTPError
//	@Failure		500				{object}	string
//	@Router			/api/v1/admin/announcements/{announcement_id}/expiry [patch]
func (h *AnnouncementHandler) ExtendAnnouncementExpiry(w http.ResponseWriter, r *http.Request) {
	announcementID := chi.URLParam(r, "announcement_id")

	var body ExtendAnnouncementExpiryRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	if err := h.service.ExtendExpiry(r.Context(), announcementID, body.ExpiresAt); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ─── Tenant Handlers ──────────────────────────────────────────────────────────

type TenantListAnnouncementsFilterRequest struct {
	ListAnnouncementsFilterRequest
	IsUnread *bool `json:"is_unread,omitempty" example:"true"`
}

// ListTenantAnnouncements godoc
//
//	@Summary		List announcements (Tenant)
//	@Description	List PUBLISHED announcements relevant to the tenant's lease unit (directly targeted, block, property, or broadcast)
//	@Tags			Announcements
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id	path		string									true	"Lease ID"
//	@Param			q			query		TenantListAnnouncementsFilterRequest	false	"Filters"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputAnnouncement,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		401			{object}	string
//	@Failure		404			{object}	lib.HTTPError
//	@Failure		500			{object}	string
//	@Router			/api/v1/leases/{lease_id}/announcements [get]
func (h *AnnouncementHandler) ListTenantAnnouncements(w http.ResponseWriter, r *http.Request) {
	tenantAccount, tenantAccountOk := lib.TenantAccountFromContext(r.Context())
	if !tenantAccountOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	leaseID := chi.URLParam(r, "lease_id")

	tenantFilter, resolveErr := h.resolveLeaseUnitContext(r, leaseID, tenantAccount.ID)
	if resolveErr != nil {
		http.Error(w, "Lease not found or access denied", http.StatusNotFound)
		return
	}

	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		HandleErrorResponse(w, filterErr)
		return
	}

	published := "PUBLISHED"
	input := repository.ListAnnouncementsFilter{
		Status: &published,
		TenantFilter: &repository.TenantAnnouncementFilter{
			UnitID:          tenantFilter.UnitID,
			BlockID:         tenantFilter.BlockID,
			PropertyID:      tenantFilter.PropertyID,
			ClientID:        tenantFilter.ClientID,
			TenantAccountID: tenantAccount.ID,
			IsUnread:        lib.NullOrBool(r.URL.Query().Get("is_unread")),
		},
	}

	announcements, announcementsErr := h.service.List(r.Context(), *filterQuery, input)
	if announcementsErr != nil {
		HandleErrorResponse(w, announcementsErr)
		return
	}

	count, countErr := h.service.Count(r.Context(), *filterQuery, input)
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	rows := make([]interface{}, 0)
	for _, a := range announcements {
		rows = append(rows, transformations.DBAnnouncementToTenantRest(&a))
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, count))
}

// GetTenantAnnouncement godoc
//
//	@Summary		Get announcement by ID (Tenant)
//	@Description	Get a PUBLISHED announcement by ID
//	@Tags			Announcements
//	@Security		BearerAuth
//	@Produce		json
//	@Param			announcement_id	path		string	true	"Announcement ID"
//	@Success		200				{object}	object{data=transformations.OutputAnnouncement}
//	@Failure		401				{object}	string
//	@Failure		404				{object}	lib.HTTPError
//	@Failure		500				{object}	string
//	@Router			/api/v1/announcements/{announcement_id} [get]
func (h *AnnouncementHandler) GetTenantAnnouncement(w http.ResponseWriter, r *http.Request) {
	announcementID := chi.URLParam(r, "announcement_id")

	announcement, err := h.service.GetByIDWithPopulate(r.Context(), repository.GetAnnouncementQuery{
		ID: announcementID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAnnouncementToTenantRest(announcement),
	})
}

// MarkAnnouncementRead godoc
//
//	@Summary		Mark announcement as read (Tenant)
//	@Description	Mark an announcement as read — idempotent
//	@Tags			Announcements
//	@Security		BearerAuth
//	@Produce		json
//	@Param			announcement_id	path		string	true	"Announcement ID"
//	@Success		204				{object}	nil
//	@Failure		401				{object}	string
//	@Failure		500				{object}	string
//	@Router			/api/v1/announcements/{announcement_id}/read [post]
func (h *AnnouncementHandler) MarkAnnouncementRead(w http.ResponseWriter, r *http.Request) {
	tenantAccount, tenantAccountOk := lib.TenantAccountFromContext(r.Context())
	if !tenantAccountOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	announcementID := chi.URLParam(r, "announcement_id")

	if err := h.service.MarkAsRead(r.Context(), announcementID, tenantAccount.ID); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// resolveLeaseUnitContext fetches the unit context for a given lease, verifying it belongs to the tenant.
// Returns a TenantAnnouncementFilter with all targeting fields needed to filter announcements.
func (h *AnnouncementHandler) resolveLeaseUnitContext(
	r *http.Request,
	leaseID string,
	tenantAccountID string,
) (*repository.TenantAnnouncementFilter, error) {
	type leaseUnitResult struct {
		UnitID     string `gorm:"column:unit_id"`
		BlockID    string `gorm:"column:block_id"`
		PropertyID string `gorm:"column:property_id"`
		ClientID   string `gorm:"column:client_id"`
	}

	var result leaseUnitResult
	err := h.appCtx.DB.WithContext(r.Context()).
		Table("leases").
		Select("leases.unit_id AS unit_id, units.property_block_id AS block_id, units.property_id AS property_id, properties.client_id AS client_id").
		Joins("JOIN tenant_accounts ON tenant_accounts.tenant_id = leases.tenant_id").
		Joins("JOIN units ON units.id = leases.unit_id").
		Joins("JOIN properties ON properties.id = units.property_id").
		Where(
			"leases.id = ? AND tenant_accounts.id = ? AND leases.deleted_at IS NULL AND units.deleted_at IS NULL AND properties.deleted_at IS NULL",
			leaseID, tenantAccountID,
		).
		First(&result).Error
	if err != nil {
		return nil, err
	}
	return &repository.TenantAnnouncementFilter{
		UnitID:     result.UnitID,
		BlockID:    result.BlockID,
		PropertyID: result.PropertyID,
		ClientID:   result.ClientID,
	}, nil
}
