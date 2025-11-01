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

type PropertyHandler struct {
	appCtx  pkg.AppContext
	service services.PropertyService
}

func NewPropertyHandler(appCtx pkg.AppContext, service services.PropertyService) PropertyHandler {
	return PropertyHandler{appCtx, service}
}

type CreatePropertyRequest struct {
	Type        string   `json:"type"                  validate:"required,oneof=SINGLE MULTI"                                                                example:"SINGLE"                                                description:"Type of the property. Options: SINGLE | MULTI."`
	Status      string   `json:"status"                validate:"required,oneof=Property.Status.Active Property.Status.Maintenance Property.Status.Inactive" example:"Property.Status.Active"                                description:"Current operational status of the property"`
	Name        string   `json:"name"                  validate:"required,min=3,max=100"                                                                     example:"Oceanview Apartment"                                   description:"Human-readable name of the property."`
	Description *string  `json:"description,omitempty"                                                                                                       example:"A luxurious apartment overlooking the Atlantic Ocean." description:"Brief description of the property."`
	Images      []string `json:"images,omitempty"      validate:"omitempty,dive,url"                                                                         example:"https://example.com/images/1.jpg"                      description:"Array of image URLs associated with the property."`
	Tags        []string `json:"tags,omitempty"        validate:"omitempty,dive,min=1,max=30"                                                                example:"beachfront,furnished"                                  description:"Tags for categorizing the property."`
	Latitude    float64  `json:"latitude"              validate:"required,latitude"                                                                          example:"5.6037"                                                description:"Latitude coordinate of the property."`
	Longitude   float64  `json:"longitude"             validate:"required,longitude"                                                                         example:"-0.1870"                                               description:"Longitude coordinate of the property."`
	Address     string   `json:"address"               validate:"required,min=5,max=200"                                                                     example:"12 Labone Crescent"                                    description:"Physical address of the property."`
	Country     string   `json:"country"               validate:"required,min=2,max=100"                                                                     example:"Ghana"                                                 description:"Country where the property is located."`
	Region      string   `json:"region"                validate:"required,min=2,max=100"                                                                     example:"Greater Accra"                                         description:"Region or administrative area where the property is located."`
	City        string   `json:"city"                  validate:"required,min=2,max=100"                                                                     example:"Accra"                                                 description:"City where the property is located."`
	GPSAddress  *string  `json:"gpsAddress,omitempty"                                                                                                        example:"GA-123-4567"                                           description:"GPS or digital address reference."`
}

// CreateProperty godoc
//
//	@Summary		Creates a new property
//	@Description	Create a new property
//	@Tags			Properties
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body		CreatePropertyRequest						true	"Create Property Request Body"
//	@Success		201		{object}	object{data=transformations.OutputProperty}	"Property created successfully"
//	@Failure		400		{object}	lib.HTTPError								"Error occurred when creating a property"
//	@Failure		401		{object}	string										"Invalid or absent authentication token"
//	@Failure		500		{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/properties [post]
func (h *PropertyHandler) CreateProperty(w http.ResponseWriter, r *http.Request) {
	currentClientUser, currentClientUserOk := lib.ClientUserFromContext(r.Context())

	if !currentClientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreatePropertyRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)

	if !isPassedValidation {
		return
	}

	property, err := h.service.CreateProperty(r.Context(), services.CreatePropertyInput{
		Type:        body.Type,
		Status:      body.Status,
		Name:        body.Name,
		Description: body.Description,
		Images:      body.Images,
		Tags:        body.Tags,
		Latitude:    body.Latitude,
		Longitude:   body.Longitude,
		Address:     body.Address,
		Country:     body.Country,
		Region:      body.Region,
		City:        body.City,
		GPSAddress:  body.GPSAddress,
		ClientID:    currentClientUser.ClientID,
		CreatedByID: currentClientUser.ID,
	})
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{
			"errors": map[string]string{
				"message": err.Error(),
			},
		})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBPropertyToRest(property),
	})
}

type ListPropertiesFilterRequest struct {
	lib.FilterQueryInput
	Status string `json:"status" validate:"oneof=Property.Status.Active Property.Status.Maintenance Property.Status.Inactive"`
	Type   string `json:"type"   validate:"oneof=SINGLE MULTI"`
}

// GetProperties godoc
//
//	@Summary		Get all properties
//	@Description	Get all properties
//	@Tags			Properties
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			q	query		ListPropertiesFilterRequest	true	"Properties"
//	@Success		200	{object}	object{data=object{rows=[]transformations.OutputProperty,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400	{object}	lib.HTTPError
//	@Failure		401	{object}	string
//	@Failure		500	{object}	string
//	@Router			/api/v1/properties [get]
func (h *PropertyHandler) ListProperties(w http.ResponseWriter, r *http.Request) {
	clientUser, clientUserOk := lib.ClientUserFromContext(r.Context())

	if !clientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{
			"errors": map[string]string{
				"message": filterErr.Error(),
			},
		})
		return
	}

	isFiltersPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFiltersPassedValidation {
		return
	}

	input := repository.ListPropertiesFilter{
		FilterQuery: *filterQuery,
		ClientID:    clientUser.ClientID,
		Status:      lib.NullOrString(r.URL.Query().Get("status")),
		Type:        lib.NullOrString(r.URL.Query().Get("type")),
	}

	properties, propertiesErr := h.service.ListProperties(r.Context(), input)
	if propertiesErr != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]any{
			"errors": map[string]string{
				"message": propertiesErr.Error(),
			},
		})
		return
	}

	count, countErr := h.service.CountProperties(r.Context(), input)
	if countErr != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]any{
			"errors": map[string]string{
				"message": countErr.Error(),
			},
		})

	}

	propertiesTransformed := make([]any, 0)
	for _, property := range properties {
		propertiesTransformed = append(
			propertiesTransformed,
			transformations.DBPropertyToRest(&property),
		)
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": map[string]any{
			"rows": propertiesTransformed,
			"meta": map[string]any{
				"page":              filterQuery.Page,
				"page_size":         filterQuery.PageSize,
				"order":             filterQuery.Order,
				"order_by":          filterQuery.OrderBy,
				"total":             count,
				"has_next_page":     (filterQuery.Page * filterQuery.PageSize) < int(count),
				"has_previous_page": filterQuery.Page > 1,
			},
		},
	})
}
