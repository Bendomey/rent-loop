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

type CreateUnitRequest struct {
	Name                string          `json:"name"                  validate:"required"                                                                                            example:"Unit 101"                        description:"Name of the unit"`
	Description         *string         `json:"description"           validate:"omitempty"                                                                                           example:"Spacious apartment with balcony" description:"Optional description of the unit"`
	Images              *[]string       `json:"images"                validate:"omitempty,dive,url"                                                                                  example:"http://www.images/unit101.jpg"   description:"List of image URLs for the unit"`
	Tags                *[]string       `json:"tags"                  validate:"omitempty,dive"                                                                                      example:"apartment,balcony"               description:"Tags associated with the unit"`
	Type                string          `json:"type"                  validate:"required,oneof=APARTMENT HOUSE STUDIO OFFICE RETAIL"                                                 example:"APARTMENT"                       description:"Type of the unit (e.g., APARTMENT, HOUSE, STUDIO, OFFICE, RETAIL)"`
	Status              string          `json:"status"                validate:"required,oneof=Unit.Status.Draft Unit.Status.Available Unit.Status.Occupied Unit.Status.Maintenance" example:"Unit.Status.Available"           description:"Current status of the unit (e.g., Unit.Status.Draft Unit.Status.Available Unit.Status.Occupied Unit.Status.Maintenance)"`
	Area                *float64        `json:"area"                  validate:"omitempty"                                                                                           example:"120.5"                           description:"Area of the unit in square feet or square meters"`
	RentFee             int64           `json:"rent_fee"              validate:"required"                                                                                            example:"1500"                            description:"Rent amount"`
	RentFeeCurrency     string          `json:"rent_fee_currency"     validate:"required"                                                                                            example:"USD"                             description:"Currency for the rent fee"`
	PaymentFrequency    string          `json:"payment_frequency"     validate:"required,oneof=WEEKLY DAILY MONTHLY QUARTERLY BIANNUALLY ANNUALLY"                                   example:"WEEKLY"                          description:"Payment frequency (e.g., WEEKLY, DAILY, MONTHLY, QUARTERLY, BIANNUALLY, ANNUALLY)"`
	Features            *map[string]any `json:"features"              validate:"omitempty"                                                                                                                                     description:"Additional metadata in JSON format"`
	MaxOccupantsAllowed int             `json:"max_occupants_allowed" validate:"required"                                                                                            example:"4"                               description:"Maximum number of occupants allowed"`
}

// CreateUnit godoc
//
//	@Summary		Create unit
//	@Description	Create unit
//	@Tags			Units
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string				true	"Property ID"
//	@Param			block_id	path		string				true	"Property block ID"
//	@Param			body		body		CreateUnitRequest	true	"Unit"
//	@Success		201			{object}	object{data=transformations.OutputUnit}
//	@Failure		400			{object}	lib.HTTPError	"Error occurred when creating a unit"
//	@Failure		401			{object}	string			"Invalid or absent authentication token"
//	@Failure		403			{object}	lib.HTTPError	"Forbidden access"
//	@Failure		422			{object}	lib.HTTPError	"Invalid request body"
//	@Failure		500			{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/properties/{property_id}/blocks/{block_id}/units [post]
func (h *UnitHandler) CreateUnit(w http.ResponseWriter, r *http.Request) {
	currentClientUser, clientUserOk := lib.ClientUserFromContext(r.Context())
	if !clientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	propertyID := chi.URLParam(r, "property_id")
	propertyBlockID := chi.URLParam(r, "block_id")

	var body CreateUnitRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := services.CreateUnitInput{
		PropertyID:          propertyID,
		PropertyBlockID:     propertyBlockID,
		Name:                body.Name,
		Description:         body.Description,
		Images:              body.Images,
		Tags:                body.Tags,
		Type:                body.Type,
		Status:              body.Status,
		Area:                body.Area,
		RentFee:             body.RentFee,
		RentFeeCurrency:     body.RentFeeCurrency,
		PaymentFrequency:    body.PaymentFrequency,
		Features:            body.Features,
		MaxOccupantsAllowed: body.MaxOccupantsAllowed,
		CreatedByID:         currentClientUser.ID,
	}

	unit, createUnitErr := h.service.CreateUnit(r.Context(), input)
	if createUnitErr != nil {
		HandleErrorResponse(w, createUnitErr)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBUnitToRest(unit),
	})
}

type ListUnitsFilterRequest struct {
	lib.FilterQueryInput
	PropertyID       string   `json:"property_id"       validate:"omitempty"                                                                                            example:"prop_123"                                                                  description:"ID of the property to filter units by"`
	Status           string   `json:"status"            validate:"omitempty,oneof=Unit.Status.Draft Unit.Status.Available Unit.Status.Occupied Unit.Status.Maintenance" example:"Unit.Status.Active"                                                        description:"Status of the unit. Allowed values: Unit.Status.Active, Unit.Status.Inactive, Unit.Status.Maintenance"`
	Type             string   `json:"type"              validate:"omitempty,oneof=APARTMENT HOUSE STUDIO OFFICE RETAIL"                                                 example:"SINGLE"                                                                    description:"Type of unit. Allowed values: SINGLE, MULTI"`
	PaymentFrequency string   `json:"payment_frequency" validate:"omitempty,oneof=WEEKLY DAILY MONTHLY QUARTERLY BIANNUALLY ANNUALLY"                                   example:"WEEKLY"                                                                    description:"Payment frequency. Allowed values: WEEKLY, DAILY, MONTHLY, QUARTERLY, BIANNUALLY, ANNUALLY"`
	BlockIDs         []string `json:"block_ids"         validate:"omitempty,dive,uuid"                                                                                  example:"767d8e23-8c9f-4c51-85af-5908039869da,3d90d606-2a22-4487-9431-69736829094f" description:"List of block IDs to filter units by"                                                                  collectionFormat:"multi"`
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
		BlockIDs:         lib.NullOrStringArray(r.URL.Query()["block_ids"]),
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

type GetUnitQuery struct {
	lib.GetOneQueryInput
}

// GetUnit godoc
//
//	@Summary		Get unit
//	@Description	Get unit
//	@Tags			Units
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string									true	"Property ID"
//	@Param			unit_id		path		string									true	"Unit ID"
//	@Param			q			query		GetUnitQuery							true	"Units"
//	@Success		200			{object}	object{data=transformations.OutputUnit}	"Unit retrieved successfully"
//	@Failure		400			{object}	lib.HTTPError							"Error occurred when fetching a unit"
//	@Failure		401			{object}	string									"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError							"Unit not found"
//	@Failure		500			{object}	string									"An unexpected error occurred"
//	@Router			/api/v1/properties/{property_id}/units/{unit_id} [get]
func (s *UnitHandler) GetUnit(w http.ResponseWriter, r *http.Request) {
	propertyID := chi.URLParam(r, "property_id")
	unitID := chi.URLParam(r, "unit_id")

	populate := GetPopulateFields(r)

	query := repository.GetUnitQuery{
		PropertyID: propertyID,
		UnitID:     unitID,
		Populate:   populate,
	}

	unit, getUnitErr := s.service.GetUnit(r.Context(), query)
	if getUnitErr != nil {
		HandleErrorResponse(w, getUnitErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBUnitToRest(unit),
	})
}

type UpdateUnitRequest struct {
	Name                *string         `json:"name"                  validate:"omitempty"                                                          example:"Unit 101"                        description:"Name of the unit"`
	Description         *string         `json:"description"           validate:"omitempty"                                                          example:"Spacious apartment with balcony" description:"Optional description of the unit"`
	Images              *[]string       `json:"images"                validate:"omitempty,dive,url"                                                 example:"http://www.images/unit101.jpg"   description:"List of image URLs for the unit"`
	Tags                *[]string       `json:"tags"                  validate:"omitempty,dive"                                                     example:"apartment,balcony"               description:"Tags associated with the unit"`
	Type                *string         `json:"type"                  validate:"omitempty,oneof=APARTMENT HOUSE STUDIO OFFICE RETAIL"               example:"APARTMENT"                       description:"Type of the unit (e.g., APARTMENT, HOUSE, STUDIO, OFFICE, RETAIL)"`
	Area                *float64        `json:"area"                  validate:"omitempty"                                                          example:"120.5"                           description:"Area of the unit in square feet or square meters"`
	RentFee             *int64          `json:"rent_fee"              validate:"omitempty"                                                          example:"1500"                            description:"Rent amount"`
	RentFeeCurrency     *string         `json:"rent_fee_currency"     validate:"omitempty"                                                          example:"USD"                             description:"Currency for the rent fee"`
	PaymentFrequency    *string         `json:"payment_frequency"     validate:"omitempty,oneof=WEEKLY DAILY MONTHLY QUARTERLY BIANNUALLY ANNUALLY" example:"WEEKLY"                          description:"Payment frequency (e.g., WEEKLY, DAILY, MONTHLY, QUARTERLY, BIANNUALLY, ANNUALLY)"`
	Features            *map[string]any `json:"features"              validate:"omitempty"                                                                                                    description:"Additional metadata in JSON format"`
	MaxOccupantsAllowed *int            `json:"max_occupants_allowed" validate:"omitempty"                                                          example:"4"                               description:"Maximum number of occupants allowed"`
}

// UpdateUnit godoc
//
//	@Summary		Update unit
//	@Description	Update unit
//	@Tags			Units
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string				true	"Property ID"
//	@Param			unit_id		path		string				true	"Unit ID"
//	@Param			body		body		UpdateUnitRequest	true	"Unit"
//	@Success		200			{object}	object{data=transformations.OutputUnit}
//	@Failure		400			{object}	lib.HTTPError	"Error occurred when updating a unit"
//	@Failure		401			{object}	string			"Invalid or absent authentication token"
//	@Failure		403			{object}	lib.HTTPError	"Forbidden access"
//	@Failure		404			{object}	lib.HTTPError	"Unit not found"
//	@Failure		422			{object}	lib.HTTPError	"Invalid request body"
//	@Failure		500			{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/properties/{property_id}/units/{unit_id} [patch]
func (h *UnitHandler) UpdateUnit(w http.ResponseWriter, r *http.Request) {
	propertyID := chi.URLParam(r, "property_id")
	unitID := chi.URLParam(r, "unit_id")

	var body UpdateUnitRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := services.UpdateUnitInput{
		PropertyID:          propertyID,
		UnitID:              unitID,
		Name:                body.Name,
		Description:         body.Description,
		Images:              body.Images,
		Tags:                body.Tags,
		Type:                body.Type,
		Area:                body.Area,
		RentFee:             body.RentFee,
		RentFeeCurrency:     body.RentFeeCurrency,
		PaymentFrequency:    body.PaymentFrequency,
		Features:            body.Features,
		MaxOccupantsAllowed: body.MaxOccupantsAllowed,
	}

	unit, updateUnitErr := h.service.UpdateUnit(r.Context(), input)
	if updateUnitErr != nil {
		HandleErrorResponse(w, updateUnitErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBUnitToRest(unit),
	})
}
