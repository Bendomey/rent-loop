package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/transformation"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)


type PropertyHandler struct {
	appCtx  pkg.AppContext
	service services.PropertyService
}

func NewPropertyHandler(appCtx pkg.AppContext, service services.PropertyService) *PropertyHandler {
	return &PropertyHandler{
		appCtx:  appCtx,
		service: service,
	}
}

// CreatePropertyRequest is the JSON payload accepted by CreateProperty.
//
// Fields:
//   - Name: required human-friendly name for the property (e.g., "East Legon Hills #3").
//   - Description: optional short description.
//   - Address/City/Region/Country/GPSAddress: required location information.
//   - Latitude/Longitude: required geolocation coordinates.
//   - Type: required property type ("SINGLE" or "MULTI").
//   - Status: property lifecycle status ("ACTIVE", "MAINTENANCE", or "INACTIVE").
//   - ClientID: required ID of the owning client.
//   - CreatedByID: required ID of the user creating this property.
//   - Tags/Images: optional labels and image URLs/keys.
type CreatePropertyRequest struct {
	Name        string   `json:"name"`
	Description *string  `json:"description,omitempty"`
	Address     string   `json:"address"`
	City        string   `json:"city"`
	Region      string   `json:"region"`
	Country     string   `json:"country"`
	Latitude    float64  `json:"latitude"`
	Longitude   float64  `json:"longitude"`
	GPSAddress  string   `json:"gps_address"`
	Type        string   `json:"type"`      
	Status      string   `json:"status"`      
	CreatedByID string   `json:"createdById"`
	Tags        []string `json:"tags"`
	Images      []string `json:"images,omitempty"`
}

// CreateProperty godoc
// @Summary      Create a new property
// @Description  Create a new property under a client with geolocation and metadata
// @Tags         Properties
// @Accept       json
// @Produce      json
// @Param        body  body      handlers.CreatePropertyRequest  true  "Property details"
// @Success      201   {object}  object{data=transformation.OutputProperty}
// @Failure      400   {object}  lib.HTTPError
// @Failure      500   {object}  string
// @Router       /api/v1/properties [post]
func (h *PropertyHandler) CreateProperty(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	var req CreatePropertyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		lib.RespondWithError(h.appCtx, w, http.StatusBadRequest, "invalid request payload")
		return
	}

	input := services.CreatePropertyInput{
		Name:        req.Name,
		Description: req.Description,
		Address:     req.Address,
		City:        req.City,
		Region:      req.Region,
		Country:     req.Country,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		GPSAddress:  req.GPSAddress,
		Type:        req.Type,
		Status:      req.Status,
		ClientID:    req.ClientID,
		CreatedByID: req.CreatedByID,
		Tags:        req.Tags,
		Images:      req.Images,
	}

	property, err := h.service.CreateProperty(r.Context(), input)
	if err != nil {
		switch err.Error() {
		case "name is required",
			"address, city, region, country and gpsAddress are required",
			"clientId is required",
			"createdById is required",
			"invalid type:  (must be SINGLE or MULTI)",
			"invalid status:  (must be ACTIVE, MAINTENANCE or INACTIVE)":
			lib.RespondWithError(h.appCtx, w, http.StatusBadRequest, err.Error())
			return
		}
		lib.RespondWithError(h.appCtx, w, http.StatusInternalServerError, "could not create property")
		return
	}

	lib.LogInfo(h.appCtx, "Property created successfully", map[string]any{
		"id":       property.ID,
		"name":     property.Name,
		"clientId": property.ClientID,
	})

	output := transformation.TransformProperty(*property)
	// Wrap in {"data": ...} to match the @Success schema above.
	lib.RespondWithJSON(w, http.StatusCreated, map[string]any{
		"data": output,
	})
}

// GetProperty godoc
// @Summary      Get a property by ID
// @Description  Retrieve a single property resource by its ID
// @Tags         Properties
// @Accept       json
// @Produce      json
// @Param        propertyId  path      string  true  "Property ID"
// @Success      200         {object}  object{data=transformation.OutputProperty}
// @Failure      400         {object}  lib.HTTPError
// @Failure      404         {object}  lib.HTTPError
// @Failure      500         {object}  string
// @Router       /api/v1/properties/{propertyId} [get]
func (h *PropertyHandler) GetProperty(w http.ResponseWriter, r *http.Request) {
	propertyId := chi.URLParam(r, "propertyId")
	if propertyId == "" {
		lib.RespondWithError(h.appCtx, w, http.StatusBadRequest, "propertyId is required")
		return
	}

	property, err := h.service.GetProperty(r.Context(), propertyId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			lib.RespondWithError(h.appCtx, w, http.StatusNotFound, "property not found")
			return
		}
		lib.RespondWithError(h.appCtx, w, http.StatusInternalServerError, "could not retrieve property")
		return
	}

	output := transformation.TransformProperty(*property)
	// Wrap in {"data": ...} to match the @Success schema above.
	lib.RespondWithJSON(w, http.StatusOK, map[string]any{
		"data": output,
	})
}