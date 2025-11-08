package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
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
