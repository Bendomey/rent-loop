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

type ClientUserPropertyHandler struct {
	service services.ClientUserPropertyService
	appCtx  pkg.AppContext
}

func NewClientUserPropertyHandler(
	appCtx pkg.AppContext,
	service services.ClientUserPropertyService,
) ClientUserPropertyHandler {
	return ClientUserPropertyHandler{
		appCtx:  appCtx,
		service: service,
	}
}

type ListMyPropertiesFilterRequest struct {
	lib.FilterQueryInput
	Role string   `json:"role" validate:"oneof=MANAGER STAFF"`
	IDs  []string `json:"ids"  validate:"omitempty,dive,uuid4" example:"a8098c1a-f86e-11da-bd1a-00112444be1e" description:"List of client user property IDs to filter by" collectionFormat:"multi"`
}

// GetMyProperties godoc
//
//	@Summary		Get my properties
//	@Description	Get my properties
//	@Tags			ClientUserProperties
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			q	query		ListMyPropertiesFilterRequest	true	"Properties"
//	@Success		200	{object}	object{data=object{rows=[]transformations.OutputClientUserProperty,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400	{object}	lib.HTTPError
//	@Failure		401	{object}	string
//	@Failure		500	{object}	string
//	@Router			/api/v1/properties/me [get]
func (h *ClientUserPropertyHandler) ListClientUserProperties(w http.ResponseWriter, r *http.Request) {
	clientUser, clientUserOk := lib.ClientUserFromContext(r.Context())

	if !clientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		HandleErrorResponse(w, filterErr)
		return
	}

	isFiltersPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFiltersPassedValidation {
		return
	}

	input := repository.ListClientUserPropertiesFilter{
		FilterQuery:  *filterQuery,
		ClientUserID: &clientUser.ID,
		Role:         lib.NullOrString(r.URL.Query().Get("role")),
		IDs:          lib.NullOrStringArray(r.URL.Query()["ids"]),
	}

	properties, propertiesErr := h.service.ListClientUserProperties(r.Context(), input)
	if propertiesErr != nil {
		HandleErrorResponse(w, propertiesErr)
		return
	}

	count, countErr := h.service.CountClientUserProperties(r.Context(), input)
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	clientUserPropertiesTransformed := make([]any, 0)
	for _, clientUserProperty := range properties {
		clientUserPropertiesTransformed = append(
			clientUserPropertiesTransformed,
			transformations.DBClientUserPropertyToRest(&clientUserProperty),
		)
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, clientUserPropertiesTransformed, count))
}

type ListAllClientUserPropertiesFilterRequest struct {
	lib.FilterQueryInput
	ClientUserID string   `json:"client_user_id" validate:"uuid4"                example:"a8098c1a-f86e-11da-bd1a-00112444be1e" description:"Client user ID"`
	PropertyID   string   `json:"property_id"    validate:"uuid4"                example:"a8098c1a-f86e-11da-bd1a-00112444be1e" description:"Property ID"`
	Role         string   `json:"role"           validate:"oneof=MANAGER STAFF"`
	IDs          []string `json:"ids"            validate:"omitempty,dive,uuid4" example:"a8098c1a-f86e-11da-bd1a-00112444be1e" description:"List of client user property IDs to filter by" collectionFormat:"multi"`
}

// ListAllClientUserProperties godoc
//
//	@Summary		List all client user properties
//	@Description	List all client user properties
//	@Tags			ClientUserProperties
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			q	query		ListAllClientUserPropertiesFilterRequest	true	"Client user properties"
//	@Success		200	{object}	object{data=object{rows=[]transformations.OutputClientUserProperty,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400	{object}	lib.HTTPError
//	@Failure		401	{object}	string
//	@Failure		500	{object}	string
//	@Router			/api/v1/client-user-properties [get]
func (h *ClientUserPropertyHandler) ListAllClientUserProperties(w http.ResponseWriter, r *http.Request) {
	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		HandleErrorResponse(w, filterErr)
		return
	}

	isFiltersPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFiltersPassedValidation {
		return
	}

	input := repository.ListClientUserPropertiesFilter{
		FilterQuery:  *filterQuery,
		ClientUserID: lib.NullOrString(r.URL.Query().Get("client_user_id")),
		PropertyID:   lib.NullOrString(r.URL.Query().Get("property_id")),
		Role:         lib.NullOrString(r.URL.Query().Get("role")),
		IDs:          lib.NullOrStringArray(r.URL.Query()["ids"]),
	}

	properties, propertiesErr := h.service.ListClientUserProperties(r.Context(), input)
	if propertiesErr != nil {
		HandleErrorResponse(w, propertiesErr)
		return
	}

	count, countErr := h.service.CountClientUserProperties(r.Context(), input)
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	clientUserPropertiesTransformed := make([]any, 0)
	for _, clientUserProperty := range properties {
		clientUserPropertiesTransformed = append(
			clientUserPropertiesTransformed,
			transformations.DBClientUserPropertyToRest(&clientUserProperty),
		)
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, clientUserPropertiesTransformed, count))
}

type GetClientUserPropertyWithPopulateQuery struct {
	lib.GetOneQueryInput
}

// FetchClientUserPropertyWithPopulate godoc
//
//	@Summary		Fetch client user property with populate
//	@Description	Fetch client user property with populate
//	@Tags			ClientUserProperties
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			client_user_property_id	path		string													true	"Client user property ID"
//	@Param			q						query		GetClientUserPropertyWithPopulateQuery					true	"Client user property"
//	@Success		200						{object}	object{data=transformations.OutputClientUserProperty}	"Client user property retrieved successfully"
//	@Failure		401						{object}	string													"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError											"Client user property not found"
//	@Failure		500						{object}	string													"An unexpected error occurred"
//	@Router			/api/v1/client-user-properties/{client_user_property_id} [get]
func (h *ClientUserPropertyHandler) FetchClientUserPropertyWithPopulate(w http.ResponseWriter, r *http.Request) {
	clientUserPropertyId := chi.URLParam(r, "client_user_property_id")

	populateQuery := GetPopulateFields(r)

	input := repository.ClientUserPropertyWithPopulateQuery{
		ClientUserPropertyID: clientUserPropertyId,
		Populate:             populateQuery,
	}

	clientUserProperty, clientUserPropertyErr := h.service.FetchClientUserPropertyWithPopulate(r.Context(), input)
	if clientUserPropertyErr != nil {
		HandleErrorResponse(w, clientUserPropertyErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBClientUserPropertyToRest(clientUserProperty),
	})
}

type LinkClientUserToPropertiesRequest struct {
	PropertyIDs []string `json:"property_ids" validate:"required,min=1,dive,uuid4"    example:"a8098c1a-f86e-11da-bd1a-00112444be1e" description:"List of property UUIDs to link"`
	Role        string   `json:"role"         validate:"required,oneof=MANAGER STAFF" example:"MANAGER"                              description:"Role of the client user for the properties (MANAGER or STAFF)"`
}

// LinkClientUserToProperties godoc
//
//	@Summary		Link client user to properties
//	@Description	Link client user to properties
//	@Tags			ClientUserProperties
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			client_user_id	path		string								true	"Client user ID"
//	@Param			body			body		LinkClientUserToPropertiesRequest	true	"Link Client User To Properties Request Body"
//	@Success		204				{object}	nil									"Client user linked to properties successfully"
//	@Failure		400				{object}	lib.HTTPError						"Invalid request body"
//	@Failure		422				{object}	string								"Validation error occured"
//	@Failure		500				{object}	string								"An unexpected error occurred"
//	@Router			/api/v1/client-users/{client_user_id}/properties:link [post]
func (h *ClientUserPropertyHandler) LinkClientUserToProperties(w http.ResponseWriter, r *http.Request) {
	clientUser, clientUserOk := lib.ClientUserFromContext(r.Context())
	if !clientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	clientUserId := chi.URLParam(r, "client_user_id")
	var body LinkClientUserToPropertiesRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := services.LinkClientUserToPropertiesInput{
		PropertyIDs:  body.PropertyIDs,
		Role:         body.Role,
		ClientUserID: clientUserId,
		CreatedByID:  clientUser.ID,
	}

	linkClientUserToPropertiesErr := h.service.LinkClientUserToProperties(r.Context(), input)
	if linkClientUserToPropertiesErr != nil {
		HandleErrorResponse(w, linkClientUserToPropertiesErr)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type UnlinkClientUserFromPropertyRequest struct {
	PropertyIDs []string `json:"property_ids" validate:"required,min=1,dive,uuid4" example:"a8098c1a-f86e-11da-bd1a-00112444be1e" description:"List of property IDs to unlink"`
}

// UnlinkClientUserFromProperties godoc
//
//	@Summary		Unlink client user from properties
//	@Description	Unlink client user from properties
//	@Tags			ClientUserProperties
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			client_user_id	path		string								true	"Client user ID"
//	@Param			body			body		UnlinkClientUserFromPropertyRequest	true	"Unlink Client User From Properties Request Body"
//	@Success		204				{object}	nil									"Client user unlinked from properties successfully"
//	@Failure		422				{object}	lib.HTTPError						"Validation error occured"
//	@Failure		500				{object}	string								"An unexpected error occurred"
//	@Router			/api/v1/client-users/{client_user_id}/properties:unlink [delete]
func (h *ClientUserPropertyHandler) UnlinkClientUserFromProperties(w http.ResponseWriter, r *http.Request) {
	clientUserId := chi.URLParam(r, "client_user_id")
	var body UnlinkClientUserFromPropertyRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := repository.UnlinkClientUserFromPropertyQuery{
		ClientUserID: clientUserId,
		PropertyIDs:  body.PropertyIDs,
	}

	unlinkClientUserFromPropertiesErr := h.service.UnlinkByClientUserID(r.Context(), input)
	if unlinkClientUserFromPropertiesErr != nil {
		HandleErrorResponse(w, unlinkClientUserFromPropertiesErr)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type LinkPropertyToClientUsersRequest struct {
	ClientUserIDs []string `json:"client_user_ids" validate:"required,min=1,dive,uuid4"    example:"a8098c1a-f86e-11da-bd1a-00112444be1e" description:"List of client user UUIDs to link"`
	Role          string   `json:"role"            validate:"required,oneof=MANAGER STAFF" example:"MANAGER"                              description:"Role of the client user for the properties (MANAGER or STAFF)"`
}

// LinkPropertyToClientUsers godoc
//
//	@Summary		Link property to client users
//	@Description	Link property to client users
//	@Tags			ClientUserProperties
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string								true	"Property ID"
//	@Param			body		body		LinkPropertyToClientUsersRequest	true	"Link Property To Client Users Request Body"
//	@Success		204			{object}	nil									"Property linked to client users successfully"
//	@Failure		422			{object}	string								"Validation error occured"
//	@Failure		500			{object}	string								"An unexpected error occurred"
//	@Router			/api/v1/properties/{property_id}/client-users:link [post]
func (h *ClientUserPropertyHandler) LinkPropertyToClientUsers(w http.ResponseWriter, r *http.Request) {
	clientUser, clientUserOk := lib.ClientUserFromContext(r.Context())
	if !clientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	propertyId := chi.URLParam(r, "property_id")
	var body LinkPropertyToClientUsersRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := services.LinkPropertyToClientUsersInput{
		ClientUserIDs: body.ClientUserIDs,
		Role:          body.Role,
		PropertyID:    propertyId,
		CreatedByID:   clientUser.ID,
	}

	linkPropertyToClientUsersErr := h.service.LinkPropertyToClientUsers(r.Context(), input)
	if linkPropertyToClientUsersErr != nil {
		HandleErrorResponse(w, linkPropertyToClientUsersErr)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type UnlinkPropertyFromClientUsersRequest struct {
	ClientUserIDs []string `json:"client_user_ids" validate:"required,min=1,dive,uuid4" example:"a8098c1a-f86e-11da-bd1a-00112444be1e" description:"List of client user UUIDs to link"`
}

// UnlinkPropertyFromClientUsers godoc
//
//	@Summary		Unlink property from client users
//	@Description	Unlink property from client users
//	@Tags			ClientUserProperties
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string									true	"Property ID"
//	@Param			body		body		UnlinkPropertyFromClientUsersRequest	true	"Unlink Property From Client Users Request Body"
//	@Success		204			{object}	nil										"Property unlinked from client users successfully"
//	@Failure		422			{object}	lib.HTTPError							"Validation error occured"
//	@Failure		500			{object}	string									"An unexpected error occurred"
//	@Router			/api/v1/properties/{property_id}/client-users:unlink [delete]
func (h *ClientUserPropertyHandler) UnlinkPropertyFromClientUsers(w http.ResponseWriter, r *http.Request) {
	propertyId := chi.URLParam(r, "property_id")
	var body UnlinkPropertyFromClientUsersRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := repository.UnlinkPropertyFromClientUsersQuery{
		PropertyID:    propertyId,
		ClientUserIDs: body.ClientUserIDs,
	}

	unlinkClientUserFromPropertiesErr := h.service.UnlinkPropertyFromClientUsers(r.Context(), input)
	if unlinkClientUserFromPropertiesErr != nil {
		HandleErrorResponse(w, unlinkClientUserFromPropertiesErr)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
