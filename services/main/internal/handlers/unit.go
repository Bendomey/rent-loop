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

type UnitHandler struct {
	appCtx  pkg.AppContext
	service services.UnitService
}

func NewUnitHandler(appCtx pkg.AppContext, service services.UnitService) UnitHandler {
	return UnitHandler{appCtx, service}
}

type ListUnitsFilterRequest struct {
	lib.FilterQueryInput
	PropertyID       string   `json:"property_id"       validate:"omitempty"                                                                                            example:"prop_123"                                                                  description:"ID of the property to filter units by"`
	Status           string   `json:"status"            validate:"omitempty,oneof=Unit.Status.Draft Unit.Status.Available Unit.Status.Occupied Unit.Status.Maintenance" example:"Unit.Status.Active"                                                        description:"Status of the unit. Allowed values: Unit.Status.Active, Unit.Status.Inactive, Unit.Status.Maintenance"`
	Type             string   `json:"type"              validate:"omitempty,oneof=APARTMENT HOUSE STUDIO OFFICE RETAIL"                                                 example:"SINGLE"                                                                    description:"Type of unit. Allowed values: SINGLE, MULTI"`
	PaymentFrequency string   `json:"payment_frequency" validate:"omitempty,oneof=WEEKLY DAILY MONTHLY QUARTERLY BIANNUALLY ANNUALLY"                                   example:"WEEKLY"                                                                    description:"Payment frequency. Allowed values: WEEKLY, DAILY, MONTHLY, QUARTERLY, BIANNUALLY, ANNUALLY"`
	BlockIDs         []string `json:"block_ids"         validate:"omitempty,dive,uuid"                                                                                  example:"767d8e23-8c9f-4c51-85af-5908039869da,3d90d606-2a22-4487-9431-69736829094f" description:"List of block IDs to filter units by"`
}

// ListUnits godoc
//
//	@Summary		List units
//	@Description	List units
//	@Tags			Units
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string					true	"Property ID"
//	@Param			q			query		ListUnitsFilterRequest	true	"Units"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputUnit,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400			{object}	lib.HTTPError
//	@Failure		401			{object}	string
//	@Failure		500			{object}	string
//	@Router			/api/v1/properties/{property_id}/units [get]
func (h *UnitHandler) ListUnits(w http.ResponseWriter, r *http.Request) {
	propertyID := chi.URLParam(r, "property_id")
	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		HandleErrorResponse(w, filterErr)
		return
	}

	isFilterPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFilterPassedValidation {
		return
	}

	input := repository.ListUnitsFilter{
		FilterQuery:      *filterQuery,
		PropertyID:       propertyID,
		Status:           lib.NullOrString(r.URL.Query().Get("status")),
		Type:             lib.NullOrString(r.URL.Query().Get("type")),
		PaymentFrequency: lib.NullOrString(r.URL.Query().Get("payment_frequency")),
		BlockIDs:         lib.NullOrStringSlice(r.URL.Query().Get("block_ids")),
	}

	units, unitsErr := h.service.ListUnits(r.Context(), input)
	if unitsErr != nil {
		HandleErrorResponse(w, unitsErr)
		return
	}

	count, countErr := h.service.CountUnits(r.Context(), input)
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	unitsTransformed := make([]any, 0)
	for _, unit := range units {
		unitsTransformed = append(unitsTransformed, transformations.DBUnitToRest(&unit))
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, unitsTransformed, count))
}
