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

type MaintenanceRequestHandler struct {
	service              services.MaintenanceRequestService
	tenantAccountService services.TenantAccountService
	appCtx               pkg.AppContext
}

func NewMaintenanceRequestHandler(
	appCtx pkg.AppContext,
	service services.MaintenanceRequestService,
	tenantAccountService services.TenantAccountService,
) MaintenanceRequestHandler {
	return MaintenanceRequestHandler{service: service, tenantAccountService: tenantAccountService, appCtx: appCtx}
}

// ─── Request Bodies ───────────────────────────────────────────────────────────

type CreateMaintenanceRequestBody struct {
	UnitID      string   `json:"unit_id"     validate:"required,uuid4"`
	Title       string   `json:"title"       validate:"required"`
	Description string   `json:"description" validate:"required"`
	Priority    string   `json:"priority"    validate:"required,oneof=LOW MEDIUM HIGH EMERGENCY"`
	Category    string   `json:"category"    validate:"required,oneof=PLUMBING ELECTRICAL HVAC OTHER"`
	Visibility  string   `json:"visibility"  validate:"required,oneof=TENANT_VISIBLE INTERNAL_ONLY"`
	Attachments []string `json:"attachments" validate:"omitempty"`
}

type UpdateMaintenanceRequestBody struct {
	Title       *string   `json:"title"       validate:"omitempty"`
	Description *string   `json:"description" validate:"omitempty"`
	Priority    *string   `json:"priority"    validate:"omitempty,oneof=LOW MEDIUM HIGH EMERGENCY"`
	Category    *string   `json:"category"    validate:"omitempty,oneof=PLUMBING ELECTRICAL HVAC OTHER"`
	Visibility  *string   `json:"visibility"  validate:"omitempty,oneof=TENANT_VISIBLE INTERNAL_ONLY"`
	Attachments *[]string `json:"attachments" validate:"omitempty"`
}

type AssignWorkerBody struct {
	WorkerID string `json:"worker_id" validate:"required,uuid4"`
}

type AssignManagerBody struct {
	ManagerID string `json:"manager_id" validate:"required,uuid4"`
}

type UpdateStatusBody struct {
	Status             string  `json:"status"              validate:"required,oneof=NEW IN_PROGRESS IN_REVIEW RESOLVED CANCELED"`
	CancellationReason *string `json:"cancellation_reason" validate:"omitempty"`
}

type CreateCommentBody struct {
	Content string `json:"content" validate:"required"`
}

type UpdateCommentBody struct {
	Content string `json:"content" validate:"required"`
}

type ListActivityLogsQuery struct {
	lib.FilterQueryInput
	Action                  *string `json:"action"                      query:"action"`
	PerformedByClientUserID *string `json:"performed_by_client_user_id" query:"performed_by_client_user_id"`
}

type ListExpensesQuery struct {
	lib.FilterQueryInput
	PaidBy           *string `json:"paid_by"            query:"paid_by"`
	BillableToTenant *bool   `json:"billable_to_tenant" query:"billable_to_tenant"`
}

type AddExpenseBody struct {
	Description      string `json:"description"        validate:"required"`
	Amount           int64  `json:"amount"             validate:"required,gt=0"`
	Currency         string `json:"currency"           validate:"omitempty"`
	PaidBy           string `json:"paid_by"            validate:"required,oneof=BUSINESS TENANT OWNER"`
	BillableToTenant bool   `json:"billable_to_tenant"`
}

type TenantCreateMaintenanceRequestBody struct {
	Title       string   `json:"title"       validate:"required"`
	Description string   `json:"description" validate:"required"`
	Priority    string   `json:"priority"    validate:"required,oneof=LOW MEDIUM HIGH EMERGENCY"`
	Category    string   `json:"category"    validate:"required,oneof=PLUMBING ELECTRICAL HVAC OTHER"`
	Attachments []string `json:"attachments" validate:"omitempty"`
}

// ─── PM/Admin Handlers ────────────────────────────────────────────────────────

// Create godoc
//
//	@Summary		Create a maintenance request (Admin)
//	@Description	Create a new maintenance request (Admin)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		CreateMaintenanceRequestBody								true	"Request details"
//	@Success		201		{object}	object{data=transformations.AdminOutputMaintenanceRequest}	"Maintenance request created successfully"
//	@Failure		400		{object}	lib.HTTPError												"Error occurred when creating maintenance request"
//	@Failure		401		{object}	string														"Invalid or absent authentication token"
//	@Failure		422		{object}	lib.HTTPError												"Validation error"
//	@Failure		500		{object}	string														"An unexpected error occurred"
//	@Router			/api/v1/admin/maintenance-requests [post]
func (h *MaintenanceRequestHandler) Create(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreateMaintenanceRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	mr, err := h.service.CreateByAdmin(r.Context(), services.CreateMaintenanceRequestByAdminInput{
		UnitID:       body.UnitID,
		ClientUserID: currentUser.ID,
		Title:        body.Title,
		Desc:         body.Description,
		Priority:     body.Priority,
		Category:     body.Category,
		Visibility:   body.Visibility,
		Attachments:  body.Attachments,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBMaintenanceRequestToRest(mr),
	})
}

type ListMaintenanceRequestsQuery struct {
	lib.FilterQueryInput
	Status            []string `json:"status"              query:"status"              description:"Filter by status (NEW, IN_PROGRESS, IN_REVIEW, RESOLVED, CANCELED)"`
	Priority          *string  `json:"priority"            query:"priority"            description:"Filter by priority (LOW, MEDIUM, HIGH, EMERGENCY)"`
	Category          *string  `json:"category"            query:"category"            description:"Filter by category (PLUMBING, ELECTRICAL, HVAC, OTHER)"`
	AssignedWorkerID  *string  `json:"assigned_worker_id"  query:"assigned_worker_id"  description:"Filter by assigned worker UUID"`
	AssignedManagerID *string  `json:"assigned_manager_id" query:"assigned_manager_id" description:"Filter by assigned manager UUID"`
	PropertyID        *string  `json:"property_id"         query:"property_id"         description:"Filter by property UUID"                                            validate:"omitempty,uuid4"`
	UnitID            *string  `json:"unit_id"             query:"unit_id"             description:"Filter by unit UUID"                                                validate:"omitempty,uuid4"`
	LeaseID           *string  `json:"lease_id"            query:"lease_id"            description:"Filter by lease UUID"                                               validate:"omitempty,uuid4"`
}

// List godoc
//
//	@Summary		List maintenance requests (Admin)
//	@Description	List maintenance requests with optional filters (Admin)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			q	query		ListMaintenanceRequestsQuery																						true	"Query parameters"
//	@Success		200	{object}	object{data=object{rows=[]transformations.AdminOutputMaintenanceRequest,meta=lib.HTTPReturnPaginatedMetaResponse}}	"Maintenance requests"
//	@Failure		400	{object}	lib.HTTPError																										"Error occurred when listing maintenance requests"
//	@Failure		401	{object}	string																												"Invalid or absent authentication token"
//	@Failure		500	{object}	string																												"An unexpected error occurred"
//	@Router			/api/v1/admin/maintenance-requests [get]
func (h *MaintenanceRequestHandler) List(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	filterQuery, err := lib.GenerateQuery(r.URL.Query())
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	clientID := currentUser.ClientID
	filters := repository.ListMaintenanceRequestsFilter{
		ClientID:          &clientID,
		Statuses:          r.URL.Query()["status"],
		Priority:          lib.NullOrString(r.URL.Query().Get("priority")),
		Category:          lib.NullOrString(r.URL.Query().Get("category")),
		AssignedWorkerID:  lib.NullOrString(r.URL.Query().Get("assigned_worker_id")),
		AssignedManagerID: lib.NullOrString(r.URL.Query().Get("assigned_manager_id")),
		PropertyID:        lib.NullOrString(r.URL.Query().Get("property_id")),
		UnitID:            lib.NullOrString(r.URL.Query().Get("unit_id")),
		LeaseID:           lib.NullOrString(r.URL.Query().Get("lease_id")),
	}

	mrs, listErr := h.service.ListMaintenanceRequests(r.Context(), *filterQuery, filters)
	count, countErr := h.service.CountMaintenanceRequests(r.Context(), *filterQuery, filters)
	if listErr != nil {
		HandleErrorResponse(w, listErr)
		return
	}
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	rows := make([]any, len(mrs))
	for i := range mrs {
		rows[i] = transformations.DBMaintenanceRequestToRest(&mrs[i])
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, count))
}

// Get godoc
//
//	@Summary		Get a single maintenance request (Admin)
//	@Description	Get a maintenance request by ID (Admin)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		string														true	"Maintenance Request ID"
//	@Param			q	query		GetMaintenanceRequestQuery									true	"Query parameters"
//	@Success		200	{object}	object{data=transformations.AdminOutputMaintenanceRequest}	"Maintenance request"
//	@Failure		401	{object}	string														"Invalid or absent authentication token"
//	@Failure		404	{object}	lib.HTTPError												"Maintenance request not found"
//	@Failure		500	{object}	string														"An unexpected error occurred"
//	@Router			/api/v1/admin/maintenance-requests/{maintenance_request_id} [get]
type GetMaintenanceRequestQuery struct {
	lib.GetOneQueryInput
}

func (h *MaintenanceRequestHandler) Get(w http.ResponseWriter, r *http.Request) {
	_, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	mr, err := h.service.GetMaintenanceRequest(r.Context(), repository.GetMaintenanceRequestQuery{
		ID:       chi.URLParam(r, "maintenance_request_id"),
		Populate: GetPopulateFields(r),
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBMaintenanceRequestToRest(mr),
	})
}

// Update godoc
//
//	@Summary		Update a maintenance request (Admin)
//	@Description	Update an existing maintenance request (Admin)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id		path		string														true	"Maintenance Request ID"
//	@Param			body	body		UpdateMaintenanceRequestBody								true	"Fields to update"
//	@Success		200		{object}	object{data=transformations.AdminOutputMaintenanceRequest}	"Maintenance request updated successfully"
//	@Failure		400		{object}	lib.HTTPError												"Error occurred when updating maintenance request"
//	@Failure		401		{object}	string														"Invalid or absent authentication token"
//	@Failure		404		{object}	lib.HTTPError												"Maintenance request not found"
//	@Failure		422		{object}	lib.HTTPError												"Validation error"
//	@Failure		500		{object}	string														"An unexpected error occurred"
//	@Router			/api/v1/admin/maintenance-requests/{maintenance_request_id} [patch]
func (h *MaintenanceRequestHandler) Update(w http.ResponseWriter, r *http.Request) {
	_, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body UpdateMaintenanceRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	mr, err := h.service.UpdateMaintenanceRequest(r.Context(), services.UpdateMaintenanceRequestInput{
		ID:          chi.URLParam(r, "maintenance_request_id"),
		Title:       body.Title,
		Desc:        body.Description,
		Priority:    body.Priority,
		Category:    body.Category,
		Visibility:  body.Visibility,
		Attachments: body.Attachments,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBMaintenanceRequestToRest(mr),
	})
}

// AssignWorker godoc
//
//	@Summary		Assign a worker to a maintenance request
//	@Description	Assign a worker to an existing maintenance request (Admin)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id		path		string				true	"Maintenance Request ID"
//	@Param			body	body		AssignWorkerBody	true	"Worker ID"
//	@Success		200		{object}	object{data=bool}	"Worker assigned successfully"
//	@Failure		400		{object}	lib.HTTPError		"Error occurred when assigning worker"
//	@Failure		401		{object}	string				"Invalid or absent authentication token"
//	@Failure		404		{object}	lib.HTTPError		"Maintenance request not found"
//	@Failure		422		{object}	lib.HTTPError		"Validation error"
//	@Failure		500		{object}	string				"An unexpected error occurred"
//	@Router			/api/v1/admin/maintenance-requests/{maintenance_request_id}/assign-worker [post]
func (h *MaintenanceRequestHandler) AssignWorker(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body AssignWorkerBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	if err := h.service.AssignWorker(r.Context(), services.AssignMaintenanceWorkerInput{
		RequestID: chi.URLParam(r, "maintenance_request_id"),
		WorkerID:  body.WorkerID,
		ActorID:   currentUser.ID,
	}); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": true})
}

// AssignManager godoc
//
//	@Summary		Assign a manager to a maintenance request
//	@Description	Assign a manager to an existing maintenance request (Admin)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id		path		string				true	"Maintenance Request ID"
//	@Param			body	body		AssignManagerBody	true	"Manager ID"
//	@Success		200		{object}	object{data=bool}	"Manager assigned successfully"
//	@Failure		400		{object}	lib.HTTPError		"Error occurred when assigning manager"
//	@Failure		401		{object}	string				"Invalid or absent authentication token"
//	@Failure		404		{object}	lib.HTTPError		"Maintenance request not found"
//	@Failure		422		{object}	lib.HTTPError		"Validation error"
//	@Failure		500		{object}	string				"An unexpected error occurred"
//	@Router			/api/v1/admin/maintenance-requests/{maintenance_request_id}/assign-manager [post]
func (h *MaintenanceRequestHandler) AssignManager(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body AssignManagerBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	if err := h.service.AssignManager(r.Context(), services.AssignMaintenanceManagerInput{
		RequestID: chi.URLParam(r, "maintenance_request_id"),
		ManagerID: body.ManagerID,
		ActorID:   currentUser.ID,
	}); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": true})
}

// UpdateStatus godoc
//
//	@Summary		Update the status of a maintenance request
//	@Description	Transition a maintenance request to a new status (Admin)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id		path		string				true	"Maintenance Request ID"
//	@Param			body	body		UpdateStatusBody	true	"New status"
//	@Success		200		{object}	object{data=bool}	"Status updated successfully"
//	@Failure		400		{object}	lib.HTTPError		"Error occurred when updating status"
//	@Failure		401		{object}	string				"Invalid or absent authentication token"
//	@Failure		404		{object}	lib.HTTPError		"Maintenance request not found"
//	@Failure		422		{object}	lib.HTTPError		"Validation error"
//	@Failure		500		{object}	string				"An unexpected error occurred"
//	@Router			/api/v1/admin/maintenance-requests/{maintenance_request_id}/status [patch]
func (h *MaintenanceRequestHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body UpdateStatusBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	if err := h.service.UpdateStatus(r.Context(), services.UpdateMaintenanceStatusInput{
		RequestID:          chi.URLParam(r, "maintenance_request_id"),
		NewStatus:          body.Status,
		ActorType:          "CLIENT_USER",
		ActorID:            currentUser.ID,
		CancellationReason: body.CancellationReason,
	}); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": true})
}

// ListActivityLogs godoc
//
//	@Summary		List activity logs for a maintenance request
//	@Description	List all activity logs for a maintenance request with pagination (Admin)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			maintenance_request_id	path		string																												true	"Maintenance Request ID"
//	@Param			q						query		ListActivityLogsQuery																								true	"Query parameters"
//	@Success		200						{object}	object{data=object{rows=[]transformations.OutputMaintenanceActivityLog,meta=lib.HTTPReturnPaginatedMetaResponse}}	"Activity logs"
//	@Failure		401						{object}	string																												"Invalid or absent authentication token"
//	@Failure		500						{object}	string																												"An unexpected error occurred"
//	@Router			/api/v1/admin/maintenance-requests/{maintenance_request_id}/activity_logs [get]
func (h *MaintenanceRequestHandler) ListActivityLogs(w http.ResponseWriter, r *http.Request) {
	_, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	filterQuery, err := lib.GenerateQuery(r.URL.Query())
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	filters := repository.ListMaintenanceRequestActivityLogsFilter{
		MaintenanceRequestID:    chi.URLParam(r, "maintenance_request_id"),
		Action:                  lib.NullOrString(r.URL.Query().Get("action")),
		PerformedByClientUserID: lib.NullOrString(r.URL.Query().Get("performed_by_client_user_id")),
	}

	logs, listErr := h.service.ListActivityLogs(r.Context(), *filterQuery, filters)
	if listErr != nil {
		HandleErrorResponse(w, listErr)
		return
	}

	count, countErr := h.service.CountActivityLogs(r.Context(), *filterQuery, filters)
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	rows := make([]any, len(logs))
	for i := range logs {
		rows[i] = transformations.DBMaintenanceActivityLogToRest(&logs[i])
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, count))
}

// CreateComment godoc
//
//	@Summary		Create a comment on a maintenance request
//	@Description	Add a new comment to a maintenance request (Admin)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			maintenance_request_id	path		string				true	"Maintenance Request ID"
//	@Param			body					body		CreateCommentBody	true	"Comment content"
//	@Success		201						{object}	object{data=bool}	"Comment created"
//	@Failure		400						{object}	lib.HTTPError		"Invalid request"
//	@Failure		401						{object}	string				"Unauthorized"
//	@Failure		404						{object}	lib.HTTPError		"Maintenance request not found"
//	@Failure		422						{object}	lib.HTTPError		"Validation error"
//	@Failure		500						{object}	string				"An unexpected error occurred"
//	@Router			/api/v1/admin/maintenance-requests/{maintenance_request_id}/comments [post]
func (h *MaintenanceRequestHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreateCommentBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	comment, err := h.service.CreateComment(r.Context(), services.CreateMaintenanceCommentInput{
		RequestID:    chi.URLParam(r, "maintenance_request_id"),
		Content:      body.Content,
		ClientUserID: currentUser.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBMaintenanceRequestCommentToRest(comment),
	})
}

// ListCommentsQuery holds optional filters for listing comments.
type ListCommentsQuery struct {
	lib.FilterQueryInput
	CreatedByClientUserID *string `json:"created_by_client_user_id" query:"created_by_client_user_id" description:"Filter by the client user who created the comment" validate:"omitempty,uuid4"`
}

// ListComments godoc
//
//	@Summary		List comments for a maintenance request
//	@Description	List all comments on a maintenance request with pagination. Optionally filter by the creating client user.
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			maintenance_request_id	path		string																													true	"Maintenance Request ID"
//	@Param			q						query		ListCommentsQuery																										true	"Query parameters"
//	@Success		200						{object}	object{data=object{rows=[]transformations.OutputMaintenanceRequestComment,meta=lib.HTTPReturnPaginatedMetaResponse}}	"Paginated list of comments"
//	@Failure		401						{object}	string																													"Invalid or absent authentication token"
//	@Failure		500						{object}	string																													"An unexpected error occurred"
//	@Router			/api/v1/admin/maintenance-requests/{maintenance_request_id}/comments [get]
func (h *MaintenanceRequestHandler) ListComments(w http.ResponseWriter, r *http.Request) {
	_, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	filterQuery, err := lib.GenerateQuery(r.URL.Query())
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	filters := repository.ListMaintenanceRequestCommentsFilter{
		MaintenanceRequestID:  chi.URLParam(r, "maintenance_request_id"),
		CreatedByClientUserID: lib.NullOrString(r.URL.Query().Get("created_by_client_user_id")),
	}

	comments, listErr := h.service.ListComments(r.Context(), *filterQuery, filters)
	count, countErr := h.service.CountComments(r.Context(), *filterQuery, filters)
	if listErr != nil {
		HandleErrorResponse(w, listErr)
		return
	}
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	rows := make([]any, len(comments))
	for i := range comments {
		rows[i] = transformations.DBMaintenanceRequestCommentToRest(&comments[i])
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, count))
}

// UpdateComment godoc
//
//	@Summary		Update a comment on a maintenance request
//	@Description	Update an existing comment (Admin)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			maintenance_request_id	path		string				true	"Maintenance Request ID"
//	@Param			comment_id				path		string				true	"Comment ID"
//	@Param			body					body		UpdateCommentBody	true	"Updated content"
//	@Success		200						{object}	object{data=bool}	"Comment updated"
//	@Failure		400						{object}	lib.HTTPError		"Invalid request"
//	@Failure		401						{object}	string				"Unauthorized"
//	@Failure		404						{object}	lib.HTTPError		"Comment not found"
//	@Failure		422						{object}	lib.HTTPError		"Validation error"
//	@Failure		500						{object}	string				"An unexpected error occurred"
//	@Router			/api/v1/admin/maintenance-requests/{maintenance_request_id}/comments/{comment_id} [patch]
func (h *MaintenanceRequestHandler) UpdateComment(w http.ResponseWriter, r *http.Request) {
	_, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body UpdateCommentBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	comment, err := h.service.UpdateComment(r.Context(), services.UpdateMaintenanceCommentInput{
		ID:      chi.URLParam(r, "comment_id"),
		Content: body.Content,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBMaintenanceRequestCommentToRest(comment),
	})
}

// DeleteComment godoc
//
//	@Summary		Delete a comment from a maintenance request
//	@Description	Remove a comment from a maintenance request (Admin)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			maintenance_request_id	path		string				true	"Maintenance Request ID"
//	@Param			comment_id				path		string				true	"Comment ID"
//	@Success		200						{object}	object{data=bool}	"Comment deleted"
//	@Failure		401						{object}	string				"Unauthorized"
//	@Failure		500						{object}	string				"An unexpected error occurred"
//	@Router			/api/v1/admin/maintenance-requests/{maintenance_request_id}/comments/{comment_id} [delete]
func (h *MaintenanceRequestHandler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	_, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.service.DeleteComment(r.Context(), chi.URLParam(r, "comment_id")); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": true})
}

// AddExpense godoc
//
//	@Summary		Add an expense to a maintenance request
//	@Description	Record a new expense against a maintenance request (Admin)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id		path		string										true	"Maintenance Request ID"
//	@Param			body	body		AddExpenseBody								true	"Expense details"
//	@Success		201		{object}	object{data=transformations.OutputExpense}	"Expense added successfully"
//	@Failure		400		{object}	lib.HTTPError								"Error occurred when adding expense"
//	@Failure		401		{object}	string										"Invalid or absent authentication token"
//	@Failure		404		{object}	lib.HTTPError								"Maintenance request not found"
//	@Failure		422		{object}	lib.HTTPError								"Validation error"
//	@Failure		500		{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/admin/maintenance-requests/{maintenance_request_id}/expenses [post]
func (h *MaintenanceRequestHandler) AddExpense(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body AddExpenseBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	expense, err := h.service.AddExpense(r.Context(), services.AddMaintenanceExpenseInput{
		RequestID:        chi.URLParam(r, "maintenance_request_id"),
		Description:      body.Description,
		Amount:           body.Amount,
		Currency:         body.Currency,
		PaidBy:           body.PaidBy,
		BillableToTenant: body.BillableToTenant,
		ClientUserID:     currentUser.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBExpenseToRest(expense),
	})
}

// ListExpenses godoc
//
//	@Summary		List expenses for a maintenance request
//	@Description	List expenses with pagination and optional filters (Admin)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			maintenance_request_id	path		string																								true	"Maintenance Request ID"
//	@Param			q						query		ListExpensesQuery																					true	"Query parameters"
//	@Success		200						{object}	object{data=object{rows=[]transformations.OutputExpense,meta=lib.HTTPReturnPaginatedMetaResponse}}	"Expenses"
//	@Failure		401						{object}	string																								"Invalid or absent authentication token"
//	@Failure		500						{object}	string																								"An unexpected error occurred"
//	@Router			/api/v1/admin/maintenance-requests/{maintenance_request_id}/expenses [get]
func (h *MaintenanceRequestHandler) ListExpenses(w http.ResponseWriter, r *http.Request) {
	_, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	filterQuery, err := lib.GenerateQuery(r.URL.Query())
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	filters := repository.ListMaintenanceExpensesFilter{
		MaintenanceRequestID: chi.URLParam(r, "maintenance_request_id"),
		PaidBy:               lib.NullOrString(r.URL.Query().Get("paid_by")),
		BillableToTenant:     lib.NullOrBool(r.URL.Query().Get("billable_to_tenant")),
	}

	expenses, listErr := h.service.ListExpenses(r.Context(), *filterQuery, filters)
	count, countErr := h.service.CountExpenses(r.Context(), *filterQuery, filters)
	if listErr != nil {
		HandleErrorResponse(w, listErr)
		return
	}
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	rows := make([]any, len(expenses))
	for i := range expenses {
		rows[i] = transformations.DBExpenseToRest(&expenses[i])
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, count))
}

// DeleteExpense godoc
//
//	@Summary		Delete an expense from a maintenance request
//	@Description	Remove an expense record from a maintenance request (Admin)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id			path		string				true	"Maintenance Request ID"
//	@Param			expense_id	path		string				true	"Expense ID"
//	@Success		200			{object}	object{data=bool}	"Expense deleted successfully"
//	@Failure		401			{object}	string				"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError		"Expense not found"
//	@Failure		500			{object}	string				"An unexpected error occurred"
//	@Router			/api/v1/admin/maintenance-requests/{maintenance_request_id}/expenses/{expense_id} [delete]
func (h *MaintenanceRequestHandler) DeleteExpense(w http.ResponseWriter, r *http.Request) {
	_, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.service.DeleteExpense(r.Context(), chi.URLParam(r, "expense_id")); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": true})
}

// GenerateExpenseInvoice godoc
//
//	@Summary		Generate a draft invoice from billable expenses
//	@Description	Create a draft invoice from all unbilled, billable expenses on a maintenance request (Admin)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		string				true	"Maintenance Request ID"
//	@Success		201	{object}	object{data=string}	"Invoice ID of the generated draft invoice"
//	@Failure		400	{object}	lib.HTTPError		"No billable expenses found or error generating invoice"
//	@Failure		401	{object}	string				"Invalid or absent authentication token"
//	@Failure		404	{object}	lib.HTTPError		"Maintenance request not found"
//	@Failure		500	{object}	string				"An unexpected error occurred"
//	@Router			/api/v1/admin/maintenance-requests/{maintenance_request_id}/expenses:invoice [post]
func (h *MaintenanceRequestHandler) GenerateExpenseInvoice(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	invoice, err := h.service.GenerateExpenseInvoice(
		r.Context(),
		chi.URLParam(r, "maintenance_request_id"),
		currentUser.ClientID,
	)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{"data": invoice.ID.String()})
}

// ─── Tenant Handlers ──────────────────────────────────────────────────────────

// TenantCreate godoc
//
//	@Summary		Create a maintenance request (Tenant)
//	@Description	Submit a new maintenance request for a lease (Tenant)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			lease_id	path		string													true	"Lease ID"
//	@Param			body		body		TenantCreateMaintenanceRequestBody						true	"Request details"
//	@Success		201			{object}	object{data=transformations.OutputMaintenanceRequest}	"Maintenance request created successfully"
//	@Failure		400			{object}	lib.HTTPError											"Error occurred when creating maintenance request"
//	@Failure		401			{object}	string													"Invalid or absent authentication token"
//	@Failure		422			{object}	lib.HTTPError											"Validation error"
//	@Failure		500			{object}	string													"An unexpected error occurred"
//	@Router			/api/v1/leases/{lease_id}/maintenance-requests [post]
func (h *MaintenanceRequestHandler) TenantCreate(w http.ResponseWriter, r *http.Request) {
	tenantAccount, ok := lib.TenantAccountFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	account, err := h.tenantAccountService.GetMe(r.Context(), tenantAccount.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	leaseID := chi.URLParam(r, "lease_id")

	var body TenantCreateMaintenanceRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	mr, err := h.service.CreateByTenant(r.Context(), services.CreateMaintenanceRequestByTenantInput{
		LeaseID:     leaseID,
		TenantID:    account.TenantId,
		Title:       body.Title,
		Desc:        body.Description,
		Priority:    body.Priority,
		Category:    body.Category,
		Attachments: body.Attachments,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBMaintenanceRequestToTenantRest(mr),
	})
}

type TenantListMaintenanceRequestsQuery struct {
	lib.FilterQueryInput
	Status   []string `json:"status"   query:"status"   validate:"omitempty,dive,oneof=NEW IN_PROGRESS IN_REVIEW RESOLVED CANCELED"`
	Priority *string  `json:"priority" query:"priority" validate:"omitempty,oneof=LOW MEDIUM HIGH EMERGENCY"`
	Category *string  `json:"category" query:"category" validate:"omitempty,oneof=PLUMBING ELECTRICAL HVAC OTHER"`
}

// TenantList godoc
//
//	@Summary		List maintenance requests (Tenant)
//	@Description	List all maintenance requests for a lease (Tenant)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			lease_id	path		string																											true	"Lease ID"
//	@Param			q			query		TenantListMaintenanceRequestsQuery																				true	"Query parameters"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputMaintenanceRequest,meta=lib.HTTPReturnPaginatedMetaResponse}}	"Maintenance requests"
//	@Failure		400			{object}	lib.HTTPError																									"Invalid query parameters"
//	@Failure		401			{object}	string																											"Invalid or absent authentication token"
//	@Failure		500			{object}	string																											"An unexpected error occurred"
//	@Router			/api/v1/leases/{lease_id}/maintenance-requests [get]
func (h *MaintenanceRequestHandler) TenantList(w http.ResponseWriter, r *http.Request) {
	tenantAccount, ok := lib.TenantAccountFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	account, err := h.tenantAccountService.GetMe(r.Context(), tenantAccount.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	query := TenantListMaintenanceRequestsQuery{
		Status:   r.URL.Query()["status"],
		Priority: lib.NullOrString(r.URL.Query().Get("priority")),
		Category: lib.NullOrString(r.URL.Query().Get("category")),
	}

	if !lib.ValidateRequest(h.appCtx.Validator, query, w) {
		return
	}

	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		HandleErrorResponse(w, filterErr)
		return
	}

	leaseID := chi.URLParam(r, "lease_id")
	tenantID := account.TenantId
	filters := repository.ListMaintenanceRequestsFilter{
		TenantID: &tenantID,
		LeaseID:  &leaseID,
		Statuses: query.Status,
		Priority: query.Priority,
		Category: query.Category,
	}

	mrs, listErr := h.service.ListMaintenanceRequests(r.Context(), *filterQuery, filters)
	count, countErr := h.service.CountMaintenanceRequests(r.Context(), *filterQuery, filters)
	if listErr != nil {
		HandleErrorResponse(w, listErr)
		return
	}
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	rows := make([]any, len(mrs))
	for i := range mrs {
		rows[i] = transformations.DBMaintenanceRequestToTenantRest(&mrs[i])
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, count))
}

// TenantGet godoc
//
//	@Summary		Get a single maintenance request (Tenant)
//	@Description	Get a maintenance request by ID for a lease (Tenant)
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			lease_id	path		string													true	"Lease ID"
//	@Param			id			path		string													true	"Maintenance Request ID"
//	@Param			q			query		GetMaintenanceRequestQuery								true	"Query parameters"
//	@Success		200			{object}	object{data=transformations.OutputMaintenanceRequest}	"Maintenance request"
//	@Failure		401			{object}	string													"Invalid or absent authentication token"
//	@Failure		403			{object}	string													"Forbidden — request belongs to another tenant or is internal-only"
//	@Failure		404			{object}	lib.HTTPError											"Maintenance request not found"
//	@Failure		500			{object}	string													"An unexpected error occurred"
//	@Router			/api/v1/leases/{lease_id}/maintenance-requests/{maintenance_request_id} [get]
func (h *MaintenanceRequestHandler) TenantGet(w http.ResponseWriter, r *http.Request) {
	tenantAccount, ok := lib.TenantAccountFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	account, err := h.tenantAccountService.GetMe(r.Context(), tenantAccount.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	mr, err := h.service.GetMaintenanceRequest(r.Context(), repository.GetMaintenanceRequestQuery{
		ID:       chi.URLParam(r, "maintenance_request_id"),
		Populate: GetPopulateFields(r),
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	// Enforce visibility: tenants cannot view INTERNAL_ONLY requests
	if mr.Visibility == "INTERNAL_ONLY" {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// Enforce ownership: tenant can only view their own requests
	if mr.CreatedByTenantID == nil || *mr.CreatedByTenantID != account.TenantId {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBMaintenanceRequestToTenantRest(mr),
	})
}

// TenantStats godoc
//
//	@Summary		Get maintenance request stats (Tenant)
//	@Description	Returns the count of maintenance requests grouped by status for the given lease. Useful for displaying summary cards on the home screen.
//	@Tags			MaintenanceRequests
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			lease_id	path		string															true	"Lease ID"
//	@Success		200			{object}	object{data=transformations.MaintenanceRequestStatsResponse}	"Counts per status"
//	@Failure		401			{object}	string															"Invalid or absent authentication token"
//	@Failure		500			{object}	string															"An unexpected error occurred"
//	@Router			/api/v1/leases/{lease_id}/maintenance-requests/stats [get]
func (h *MaintenanceRequestHandler) TenantStats(w http.ResponseWriter, r *http.Request) {
	tenantAccount, ok := lib.TenantAccountFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	account, err := h.tenantAccountService.GetMe(r.Context(), tenantAccount.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	leaseID := chi.URLParam(r, "lease_id")
	tenantID := account.TenantId
	counts, err := h.service.GetMaintenanceRequestStats(r.Context(), repository.ListMaintenanceRequestsFilter{
		LeaseID:  &leaseID,
		TenantID: &tenantID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	resp := transformations.MaintenanceRequestStatsResponse{
		New:        counts["NEW"],
		InProgress: counts["IN_PROGRESS"],
		InReview:   counts["IN_REVIEW"],
		Resolved:   counts["RESOLVED"],
		Canceled:   counts["CANCELED"],
	}
	json.NewEncoder(w).Encode(map[string]any{"data": resp})
}
