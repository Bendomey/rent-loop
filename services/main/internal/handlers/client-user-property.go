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
	Role string `json:"role" validate:"oneof=MANAGER STAFF"`
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
func (h *ClientUserPropertyHandler) ListClientUserToProperties(w http.ResponseWriter, r *http.Request) {
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
