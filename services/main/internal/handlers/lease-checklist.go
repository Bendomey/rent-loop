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
	appCtx  pkg.AppContext
	service services.LeaseChecklistService
}

func NewLeaseChecklistHandler(appCtx pkg.AppContext, service services.LeaseChecklistService) LeaseChecklistHandler {
	return LeaseChecklistHandler{appCtx: appCtx, service: service}
}

type CreateLeaseChecklistItemRequest struct {
	Description string `json:"description" validate:"required"                                  example:"Checked in"`
	Status      string `json:"status"      validate:"required,oneof=FUNCTIONAL DAMAGED MISSING" example:"FUNCTIONAL"`
}

type CreateLeaseChecklistRequest struct {
	Type           string                            `json:"type"            example:"CHECK_IN" validate:"required,oneof=CHECK_IN CHECK_OUT ROUTINE"`
	ChecklistItems []CreateLeaseChecklistItemRequest `json:"checklist_items"                    validate:"required,dive,required"`
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
		})
	}

	input := services.CreateLeaseChecklistInput{
		LeaseId:        leaseID,
		Type:           body.Type,
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
	Type *string  `json:"type,omitempty" validate:"omitempty,oneof=CHECK_IN CHECK_OUT ROUTINE" example:"CHECK_IN"                             description:"Lease checklist type"`
	IDs  []string `json:"ids"            validate:"omitempty,dive,uuid4"                       example:"a8098c1a-f86e-11da-bd1a-00112444be1e" description:"List of lease checklist IDs to filter by" collectionFormat:"multi"`
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
		IDs:         lib.NullOrStringArray(r.URL.Query()["ids"]),
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
