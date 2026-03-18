package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type LeaseChecklistHandler struct {
	appCtx      pkg.AppContext
	service     services.LeaseChecklistService
	itemService services.LeaseChecklistItemService
}

func NewLeaseChecklistHandler(
	appCtx pkg.AppContext,
	service services.LeaseChecklistService,
	itemService services.LeaseChecklistItemService,
) LeaseChecklistHandler {
	return LeaseChecklistHandler{appCtx: appCtx, service: service, itemService: itemService}
}

type CreateLeaseChecklistItemRequest struct {
	Description string   `json:"description" validate:"required"                                                           example:"Checked in"`
	Status      string   `json:"status"      validate:"required,oneof=FUNCTIONAL DAMAGED MISSING NEEDS_REPAIR NOT_PRESENT" example:"FUNCTIONAL"`
	Notes       *string  `json:"notes"       validate:"omitempty"`
	Photos      []string `json:"photos"      validate:"omitempty,dive,url"`
}

type CreateLeaseChecklistRequest struct {
	Type           string                            `json:"type"            example:"CHECK_IN" validate:"required,oneof=CHECK_IN CHECK_OUT ROUTINE"`
	TemplateId     *string                           `json:"template_id"                        validate:"omitempty,uuid4"`
	ChecklistItems []CreateLeaseChecklistItemRequest `json:"checklist_items"                    validate:"omitempty,dive,required"`
}

// CreateLeaseChecklist godoc
//
//	@Summary		Create lease checklist
//	@Description	Create lease checklist
//	@Tags			LeaseChecklist
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id	path		string												true	"Lease ID"
//	@Param			body		body		CreateLeaseChecklistRequest							true	"Create lease checklist request body"
//	@Success		201			{object}	object{data=transformations.OutputLeaseChecklist}	"Lease checklist Created Successfully"
//	@Failure		400			{object}	lib.HTTPError										"Error occurred when creating lease checklist"
//	@Failure		401			{object}	lib.HTTPError										"Invalid or absent authentication token"
//	@Failure		403			{object}	lib.HTTPError										"Forbidden"
//	@Failure		422			{object}	lib.HTTPError										"Validation error"
//	@Failure		500			{object}	string												"An unexpected error occurred"
//	@Router			/api/v1/admin/leases/{lease_id}/checklists [post]
func (h *LeaseChecklistHandler) CreateLeaseChecklist(w http.ResponseWriter, r *http.Request) {
	currentClientUser, currentClientUserOk := lib.ClientUserFromContext(r.Context())
	if !currentClientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	leaseID := chi.URLParam(r, "lease_id")
	var body CreateLeaseChecklistRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	checklistItems := make([]services.CreateLeaseChecklistItemInput, 0)
	for _, item := range body.ChecklistItems {
		checklistItems = append(checklistItems, services.CreateLeaseChecklistItemInput{
			Description: item.Description,
			Status:      item.Status,
			Notes:       item.Notes,
			Photos:      item.Photos,
		})
	}

	input := services.CreateLeaseChecklistInput{
		LeaseId:        leaseID,
		Type:           body.Type,
		TemplateId:     body.TemplateId,
		CreatedById:    currentClientUser.ID,
		ChecklistItems: checklistItems,
	}

	leaseChecklist, createErr := h.service.CreateLeaseChecklist(r.Context(), input)
	if createErr != nil {
		HandleErrorResponse(w, createErr)
		return
	}

	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBLeaseChecklistToRest(leaseChecklist),
	})
}

type GetLeaseCheckListQuery struct {
	lib.GetOneQueryInput
}

// GetLeaseCheckList godoc
//
//	@Summary		Get lease checklist
//	@Description	Get lease checklist
//	@Tags			LeaseChecklist
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id		path		string												true	"Lease ID"
//	@Param			checklist_id	path		string												true	"Lease checklist ID"
//	@Param			q				query		GetLeaseCheckListQuery								true	"Lease checklist"
//	@Success		200				{object}	object{data=transformations.OutputLeaseChecklist}	"Lease Checklist retrieved successfully"
//	@Failure		400				{object}	lib.HTTPError										"Error occurred when fetching lease checklist"
//	@Failure		401				{object}	string												"Invalid or absent authentication token"
//	@Failure		404				{object}	lib.HTTPError										"Lease checklist not found"
//	@Failure		500				{object}	string												"An unexpected error occurred"
//	@Router			/api/v1/admin/leases/{lease_id}/checklists/{checklist_id} [get]
func (h *LeaseChecklistHandler) GetLeaseCheckList(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "checklist_id")
	leaseID := chi.URLParam(r, "lease_id")
	populate := GetPopulateFields(r)

	query := repository.GetLeaseCheckListQuery{
		ID:       id,
		LeaseID:  leaseID,
		Populate: populate,
	}

	leaseCheckList, getLeaseCheckListErr := h.service.GetOneLeaseChecklist(r.Context(), query)
	if getLeaseCheckListErr != nil {
		HandleErrorResponse(w, getLeaseCheckListErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBLeaseChecklistToRest(leaseCheckList),
	})
}

type UpdateLeaseChecklistRequest struct {
	Type *string `json:"type" validate:"omitempty,oneof=CHECK_IN CHECK_OUT ROUTINE" example:"CHECK_IN"`
}

// UpdateLeaseChecklist godoc
//
//	@Summary		Update lease checklist
//	@Description	Update lease checklist
//	@Tags			LeaseChecklist
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id		path		string												true	"Lease ID"
//	@Param			checklist_id	path		string												true	"Lease checklist ID"
//	@Param			body			body		UpdateLeaseChecklistRequest							true	"Update lease checklist request body"
//	@Success		200				{object}	object{data=transformations.OutputLeaseChecklist}	"Lease checklist updated successfully"
//	@Failure		400				{object}	lib.HTTPError										"Error occurred when updating lease checklist"
//	@Failure		401				{object}	string												"Invalid or absent authentication token"
//	@Failure		403				{object}	lib.HTTPError										"Forbidden"
//	@Failure		404				{object}	lib.HTTPError										"Lease checklist not found"
//	@Failure		422				{object}	lib.HTTPError										"Validation error"
//	@Failure		500				{object}	string												"An unexpected error occurred"
//	@Router			/api/v1/admin/leases/{lease_id}/checklists/{checklist_id} [patch]
func (h *LeaseChecklistHandler) UpdateLeaseChecklist(w http.ResponseWriter, r *http.Request) {
	leaseCheckListID := chi.URLParam(r, "checklist_id")
	leaseID := chi.URLParam(r, "lease_id")

	var body UpdateLeaseChecklistRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}
	input := services.UpdateLeaseChecklistInput{
		LeaseChecklistID: leaseCheckListID,
		LeaseID:          leaseID,
		Type:             body.Type,
	}

	leaseCheckList, getLeaseCheckListErr := h.service.UpdateLeaseChecklist(r.Context(), input)
	if getLeaseCheckListErr != nil {
		HandleErrorResponse(w, getLeaseCheckListErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBLeaseChecklistToRest(leaseCheckList),
	})
}

// DeleteLeaseChecklist godoc
//
//	@Summary		Delete lease checklist
//	@Description	Delete lease checklist
//	@Tags			LeaseChecklist
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id		path		string			true	"Lease ID"
//	@Param			checklist_id	path		string			true	"Lease checklist ID"
//	@Success		204				{object}	nil				"Lease checklist deleted successfully"
//	@Failure		400				{object}	lib.HTTPError	"Error occurred when deleting lease checklist"
//	@Failure		401				{object}	string			"Invalid or absent authentication token"
//	@Failure		403				{object}	lib.HTTPError	"Forbidden"
//	@Failure		404				{object}	lib.HTTPError	"Lease checklist not found"
//	@Failure		500				{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/leases/{lease_id}/checklists/{checklist_id} [delete]
func (h *LeaseChecklistHandler) DeleteLeaseChecklist(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")
	leaseChecklistID := chi.URLParam(r, "checklist_id")

	input := repository.DeleteLeaseChecklistQuery{
		LeaseID:          leaseID,
		LeaseChecklistID: leaseChecklistID,
	}
	deleteLeaseChecklistErr := h.service.DeleteLeaseChecklist(r.Context(), input)
	if deleteLeaseChecklistErr != nil {
		HandleErrorResponse(w, deleteLeaseChecklistErr)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type ListLeaseChecklistsQuery struct {
	lib.FilterQueryInput
	Type     *string  `json:"type,omitempty"     validate:"omitempty,oneof=CHECK_IN CHECK_OUT ROUTINE"                 example:"CHECK_IN"              description:"Lease checklist type"`
	Statuses []string `json:"statuses,omitempty" validate:"omitempty,dive,oneof=DRAFT SUBMITTED ACKNOWLEDGED DISPUTED" example:"["DRAFT","SUBMITTED"]" description:"Lease checklist statuses"`
}

// ListLeaseChecklists godoc
//
//	@Summary		List lease checklists
//	@Description	List lease checklists
//	@Tags			LeaseChecklist
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id	path		string						true	"Lease ID"
//	@Param			q			query		ListLeaseChecklistsQuery	true	"Lease checklists"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputLeaseChecklist,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400			{object}	lib.HTTPError	"An error occurred while filtering lease checklists"
//	@Failure		401			{object}	string			"Absent or invalid authentication token"
//	@Failure		500			{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/leases/{lease_id}/checklists [get]
func (h *LeaseChecklistHandler) ListLeaseChecklists(w http.ResponseWriter, r *http.Request) {
	leaseId := chi.URLParam(r, "lease_id")
	filterQuery, filterQueryErr := lib.GenerateQuery(r.URL.Query())
	if filterQueryErr != nil {
		HandleErrorResponse(w, filterQueryErr)
		return
	}

	isFilterQueryPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFilterQueryPassedValidation {
		return
	}

	input := repository.ListLeaseChecklistsFilter{
		FilterQuery: *filterQuery,
		LeaseId:     leaseId,
		Type:        lib.NullOrString(r.URL.Query().Get("type")),
		Statuses:    r.URL.Query()["statuses"],
	}

	leaseChecklists, leaseChecklistsErr := h.service.ListLeaseChecklists(r.Context(), input)
	if leaseChecklistsErr != nil {
		HandleErrorResponse(w, leaseChecklistsErr)
		return
	}

	leaseChecklistsCount, leaseChecklistsCountErr := h.service.CountLeaseChecklists(r.Context(), input)
	if leaseChecklistsCountErr != nil {
		HandleErrorResponse(w, leaseChecklistsCountErr)
		return
	}

	leaseChecklistsTransformed := make([]any, 0)
	for _, leaseChecklist := range *leaseChecklists {
		leaseChecklistsTransformed = append(
			leaseChecklistsTransformed,
			transformations.DBLeaseChecklistToRest(&leaseChecklist),
		)
	}

	json.NewEncoder(w).
		Encode(lib.ReturnListResponse(filterQuery, leaseChecklistsTransformed, leaseChecklistsCount))
}

// SubmitLeaseChecklist godoc
//
//	@Summary		Submit lease checklist
//	@Description	Submit a DRAFT or DISPUTED checklist for tenant review
//	@Tags			LeaseChecklist
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id		path		string												true	"Lease ID"
//	@Param			checklist_id	path		string												true	"Lease checklist ID"
//	@Success		200				{object}	object{data=transformations.OutputLeaseChecklist}	"Checklist submitted successfully"
//	@Failure		400				{object}	lib.HTTPError										"Checklist cannot be submitted"
//	@Failure		401				{object}	string												"Invalid or absent authentication token"
//	@Failure		404				{object}	lib.HTTPError										"Checklist not found"
//	@Failure		500				{object}	string												"An unexpected error occurred"
//	@Router			/api/v1/admin/leases/{lease_id}/checklists/{checklist_id}/submit [post]
func (h *LeaseChecklistHandler) SubmitLeaseChecklist(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")
	checklistID := chi.URLParam(r, "checklist_id")

	checklist, err := h.service.SubmitLeaseChecklist(r.Context(), leaseID, checklistID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBLeaseChecklistToRest(checklist),
	})
}

// GetChecklistComparison godoc
//
//	@Summary		Get checklist comparison
//	@Description	Compare CHECK_IN and CHECK_OUT checklists side by side
//	@Tags			LeaseChecklist
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id		path		string	true	"Lease ID"
//	@Param			checklist_id	path		string	true	"CHECK_OUT checklist ID"
//	@Success		200				{object}	object{data=object{check_in=transformations.OutputLeaseChecklist,check_out=transformations.OutputLeaseChecklist}}
//	@Failure		404				{object}	lib.HTTPError	"Checklist not found"
//	@Failure		401				{object}	string			"Invalid or absent authentication token"
//	@Failure		500				{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/leases/{lease_id}/checklists/{checklist_id}/comparison [get]
func (h *LeaseChecklistHandler) GetChecklistComparison(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")
	checklistID := chi.URLParam(r, "checklist_id")

	result, err := h.service.GetChecklistComparison(r.Context(), leaseID, checklistID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": map[string]any{
			"check_in":  transformations.DBLeaseChecklistToRest(result.CheckInChecklist),
			"check_out": transformations.DBLeaseChecklistToRest(result.CheckOutChecklist),
		},
	})
}

type CreateSingleLeaseChecklistItemRequest struct {
	Description string   `json:"description" validate:"required"                                                           example:"Walls"`
	Status      string   `json:"status"      validate:"required,oneof=FUNCTIONAL DAMAGED MISSING NEEDS_REPAIR NOT_PRESENT" example:"FUNCTIONAL"`
	Notes       *string  `json:"notes"       validate:"omitempty"`
	Photos      []string `json:"photos"      validate:"omitempty,dive,url"`
}

// CreateLeaseChecklistItem godoc
//
//	@Summary		Create lease checklist item
//	@Description	Add a single item to a DRAFT or DISPUTED checklist
//	@Tags			LeaseChecklist
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id		path		string									true	"Lease ID"
//	@Param			checklist_id	path		string									true	"Lease checklist ID"
//	@Param			body			body		CreateSingleLeaseChecklistItemRequest	true	"Item data"
//	@Success		201				{object}	object{data=transformations.OutputLeaseChecklistItem}
//	@Failure		400				{object}	lib.HTTPError	"Checklist not editable"
//	@Failure		401				{object}	string			"Invalid or absent authentication token"
//	@Failure		422				{object}	lib.HTTPError	"Validation error"
//	@Failure		500				{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/leases/{lease_id}/checklists/{checklist_id}/items [post]
func (h *LeaseChecklistHandler) CreateLeaseChecklistItem(w http.ResponseWriter, r *http.Request) {
	checklistID := chi.URLParam(r, "checklist_id")

	var body CreateSingleLeaseChecklistItemRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	item, err := h.itemService.CreateLeaseChecklistItem(r.Context(), services.CreateSingleLeaseChecklistItemInput{
		LeaseChecklistID: checklistID,
		Description:      body.Description,
		Status:           body.Status,
		Notes:            body.Notes,
		Photos:           body.Photos,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBLeaseChecklistItemToRest(item),
	})
}

type UpdateLeaseChecklistItemRequest struct {
	Description *string   `json:"description" validate:"omitempty"`
	Status      *string   `json:"status"      validate:"omitempty,oneof=FUNCTIONAL DAMAGED MISSING NEEDS_REPAIR NOT_PRESENT" example:"FUNCTIONAL"`
	Notes       *string   `json:"notes"       validate:"omitempty"`
	Photos      *[]string `json:"photos"      validate:"omitempty,dive,url"`
}

// UpdateLeaseChecklistItem godoc
//
//	@Summary		Update lease checklist item
//	@Description	Update a single item on a DRAFT or DISPUTED checklist
//	@Tags			LeaseChecklist
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id		path		string							true	"Lease ID"
//	@Param			checklist_id	path		string							true	"Lease checklist ID"
//	@Param			item_id			path		string							true	"Item ID"
//	@Param			body			body		UpdateLeaseChecklistItemRequest	true	"Item update"
//	@Success		200				{object}	object{data=transformations.OutputLeaseChecklistItem}
//	@Failure		400				{object}	lib.HTTPError	"Checklist not editable"
//	@Failure		401				{object}	string			"Invalid or absent authentication token"
//	@Failure		404				{object}	lib.HTTPError	"Item not found"
//	@Failure		422				{object}	lib.HTTPError	"Validation error"
//	@Failure		500				{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/leases/{lease_id}/checklists/{checklist_id}/items/{item_id} [patch]
func (h *LeaseChecklistHandler) UpdateLeaseChecklistItem(w http.ResponseWriter, r *http.Request) {
	checklistID := chi.URLParam(r, "checklist_id")
	itemID := chi.URLParam(r, "item_id")

	var body UpdateLeaseChecklistItemRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	item, err := h.itemService.UpdateLeaseChecklistItem(r.Context(), services.UpdateLeaseChecklistItemInput{
		ID:               itemID,
		LeaseChecklistID: checklistID,
		Description:      body.Description,
		Status:           body.Status,
		Notes:            body.Notes,
		Photos:           body.Photos,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBLeaseChecklistItemToRest(item),
	})
}

// DeleteLeaseChecklistItem godoc
//
//	@Summary		Delete lease checklist item
//	@Description	Remove a single item from a DRAFT or DISPUTED checklist
//	@Tags			LeaseChecklist
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id		path		string			true	"Lease ID"
//	@Param			checklist_id	path		string			true	"Lease checklist ID"
//	@Param			item_id			path		string			true	"Item ID"
//	@Success		204				{object}	nil				"Item deleted successfully"
//	@Failure		400				{object}	lib.HTTPError	"Checklist not editable"
//	@Failure		401				{object}	string			"Invalid or absent authentication token"
//	@Failure		404				{object}	lib.HTTPError	"Item not found"
//	@Failure		500				{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/leases/{lease_id}/checklists/{checklist_id}/items/{item_id} [delete]
func (h *LeaseChecklistHandler) DeleteLeaseChecklistItem(w http.ResponseWriter, r *http.Request) {
	checklistID := chi.URLParam(r, "checklist_id")
	itemID := chi.URLParam(r, "item_id")

	if err := h.itemService.DeleteLeaseChecklistItem(r.Context(), checklistID, itemID); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ─── Tenant-facing handlers ───────────────────────────────────────────────────

// TenantListLeaseChecklists godoc
//
//	@Summary		Tenant: list lease checklists
//	@Description	List submitted/acknowledged/disputed checklists visible to the tenant
//	@Tags			LeaseChecklist
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id	path		string						true	"Lease ID"
//	@Param			q			query		ListLeaseChecklistsQuery	true	"Filters"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputLeaseChecklist,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		401			{object}	string	"Invalid or absent authentication token"
//	@Failure		500			{object}	string	"An unexpected error occurred"
//	@Router			/api/v1/leases/{lease_id}/checklists [get]
func (h *LeaseChecklistHandler) TenantListLeaseChecklists(w http.ResponseWriter, r *http.Request) {
	leaseId := chi.URLParam(r, "lease_id")
	filterQuery, filterQueryErr := lib.GenerateQuery(r.URL.Query())
	if filterQueryErr != nil {
		HandleErrorResponse(w, filterQueryErr)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, filterQuery, w) {
		return
	}

	// Tenants only see non-DRAFT checklists
	statuses := []string{"SUBMITTED", "ACKNOWLEDGED", "DISPUTED"}
	input := repository.ListLeaseChecklistsFilter{
		FilterQuery: *filterQuery,
		LeaseId:     leaseId,
		Statuses:    statuses,
	}

	leaseChecklists, err := h.service.ListLeaseChecklists(r.Context(), input)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	count, countErr := h.service.CountLeaseChecklists(r.Context(), input)
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	result := make([]any, 0)
	for _, lc := range *leaseChecklists {
		result = append(result, transformations.DBLeaseChecklistToRest(&lc))
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, result, count))
}

// TenantGetLeaseChecklist godoc
//
//	@Summary		Tenant: get lease checklist
//	@Description	Get a single checklist (non-DRAFT) for the authenticated tenant
//	@Tags			LeaseChecklist
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id		path		string												true	"Lease ID"
//	@Param			checklist_id	path		string												true	"Checklist ID"
//	@Param			q				query		GetLeaseCheckListQuery								true	"Populate"
//	@Success		200				{object}	object{data=transformations.OutputLeaseChecklist}	"Checklist retrieved"
//	@Failure		401				{object}	string												"Invalid or absent authentication token"
//	@Failure		403				{object}	lib.HTTPError										"Forbidden"
//	@Failure		404				{object}	lib.HTTPError										"Not found"
//	@Failure		500				{object}	string												"An unexpected error occurred"
//	@Router			/api/v1/leases/{lease_id}/checklists/{checklist_id} [get]
func (h *LeaseChecklistHandler) TenantGetLeaseChecklist(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")
	checklistID := chi.URLParam(r, "checklist_id")
	populate := GetPopulateFields(r)

	checklist, err := h.service.GetOneLeaseChecklist(r.Context(), repository.GetLeaseCheckListQuery{
		ID:       checklistID,
		LeaseID:  leaseID,
		Populate: populate,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	if checklist.Status == "DRAFT" {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBLeaseChecklistToRest(checklist),
	})
}

type TenantAcknowledgeChecklistRequest struct {
	Action  string  `json:"action"  validate:"required,oneof=ACKNOWLEDGED DISPUTED" example:"ACKNOWLEDGED"`
	Comment *string `json:"comment" validate:"omitempty"`
}

// TenantAcknowledgeChecklist godoc
//
//	@Summary		Tenant: acknowledge or dispute checklist
//	@Description	Tenant acknowledges or disputes a SUBMITTED checklist
//	@Tags			LeaseChecklist
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id		path		string								true	"Lease ID"
//	@Param			checklist_id	path		string								true	"Checklist ID"
//	@Param			body			body		TenantAcknowledgeChecklistRequest	true	"Acknowledge or dispute"
//	@Success		200				{object}	object{data=transformations.OutputLeaseChecklist}
//	@Failure		400				{object}	lib.HTTPError	"Checklist not submitted"
//	@Failure		401				{object}	string			"Invalid or absent authentication token"
//	@Failure		404				{object}	lib.HTTPError	"Not found"
//	@Failure		409				{object}	lib.HTTPError	"Already responded in this round"
//	@Failure		422				{object}	lib.HTTPError	"Validation error"
//	@Failure		500				{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/leases/{lease_id}/checklists/{checklist_id}/acknowledge [post]
func (h *LeaseChecklistHandler) TenantAcknowledgeChecklist(w http.ResponseWriter, r *http.Request) {
	tenantAccount, ok := lib.TenantAccountFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	leaseID := chi.URLParam(r, "lease_id")
	checklistID := chi.URLParam(r, "checklist_id")

	var body TenantAcknowledgeChecklistRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	checklist, err := h.service.AcknowledgeLeaseChecklist(r.Context(), services.AcknowledgeLeaseChecklistInput{
		LeaseID:         leaseID,
		ChecklistID:     checklistID,
		TenantAccountID: tenantAccount.ID,
		Action:          body.Action,
		Comment:         body.Comment,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBLeaseChecklistToRest(checklist),
	})
}
