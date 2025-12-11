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

type PropertyBlockHandler struct {
	appCtx  pkg.AppContext
	service services.PropertyBlockService
}

func NewPropertyBlockHandler(appCtx pkg.AppContext, service services.PropertyBlockService) PropertyBlockHandler {
	return PropertyBlockHandler{appCtx, service}
}

type CreatePropertyBlockRequest struct {
	Name        string   `json:"name"                  validate:"required,min=2,max=100"                                                                                    example:"Luxury Apartment"`
	Images      []string `json:"images,omitempty"      validate:"omitempty,dive,url"                                                                                        example:"https://example.com/image1.jpg,https://example.com/image2.jpg"`
	Description *string  `json:"description,omitempty" validate:"omitempty"                                                                                                 example:"Spacious apartment with sea view."`
	Status      string   `json:"status"                validate:"required,oneof=PropertyBlock.Status.Active PropertyBlock.Status.Maintenance PropertyBlock.Status.Inactive" example:"PropertyBlock.Status.Active"                                   description:"Current operational status of the property block"`
}

// CreatePropertyBlock godoc
//
//	@Summary		Create a new property block
//	@Description	Create a new property block
//	@Tags			PropertyBlocks
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string												true	"Property ID"
//	@Param			body		body		CreatePropertyBlockRequest							true	"Property block details"
//	@Success		201			{object}	object{data=transformations.OutputPropertyBlock}	"Property block created successfully"
//	@Failure		400			{object}	lib.HTTPError										"Error occurred when creating a property block"
//	@Failure		401			{object}	string												"Invalid or absent authentication token"
//	@Failure		403			{object}	lib.HTTPError										"Forbidden access"
//	@Failure		422			{object}	lib.HTTPError										"Invalid request body"
//	@Failure		500			{object}	string												"An unexpected error occurred"
//	@Router			/api/v1/properties/{property_id}/blocks [post]
func (h PropertyBlockHandler) CreatePropertyBlock(w http.ResponseWriter, r *http.Request) {
	propertyID := chi.URLParam(r, "property_id")

	var body CreatePropertyBlockRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := services.CreatePropertyBlockInput{
		PropertyID:  propertyID,
		Name:        body.Name,
		Images:      body.Images,
		Description: body.Description,
		Status:      body.Status,
	}
	propertyBlock, createPropertyBlockErr := h.service.CreatePropertyBlock(r.Context(), input)
	if createPropertyBlockErr != nil {
		HandleErrorResponse(w, createPropertyBlockErr)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBPropertyBlockToRest(propertyBlock),
	})
}

type PropertyBlockListQueryFilters struct {
	lib.FilterQueryInput
	Status *string `json:"status,omitempty" validate:"omitempty,oneof=PropertyBlock.Status.Active PropertyBlock.Status.Inactive PropertyBlock.Status.Maintenance" example:"PropertyBlock.Status.Active"`
}

// ListPropertyBlocks godoc
//
//	@Summary		List property blocks
//	@Description	List property blocks
//	@Tags			PropertyBlocks
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string							true	"Property ID"
//	@Param			q			query		PropertyBlockListQueryFilters	true	"Property blocks"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputPropertyBlock,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400			{object}	lib.HTTPError
//	@Failure		401			{object}	string
//	@Failure		500			{object}	string
//	@Router			/api/v1/properties/{property_id}/blocks [get]
func (h *PropertyBlockHandler) ListPropertyBlocks(w http.ResponseWriter, r *http.Request) {
	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		HandleErrorResponse(w, filterErr)
		return
	}

	isFilterPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFilterPassedValidation {
		return
	}

	input := repository.ListPropertyBlocksFilter{
		FilterQuery: *filterQuery,
		PropertyID:  chi.URLParam(r, "property_id"),
		Status:      lib.NullOrString(r.URL.Query().Get("status")),
	}

	propertyBlocks, propertyBlocksErr := h.service.ListPropertyBlocks(r.Context(), input)
	if propertyBlocksErr != nil {
		HandleErrorResponse(w, propertyBlocksErr)
		return
	}

	count, countErr := h.service.CountPropertyBlocks(r.Context(), input)
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	propertyBlocksTransformed := make([]any, 0)
	for _, propertyBlock := range propertyBlocks {
		propertyBlocksTransformed = append(
			propertyBlocksTransformed,
			transformations.DBPropertyBlockToRest(&propertyBlock),
		)
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, propertyBlocksTransformed, count))
}

type GetPropertyBlockQuery struct {
	lib.GetOneQueryInput
}

// GetPropertyBlock godoc
//
//	@Summary		Get property block by ID
//	@Description	Get property block by ID
//	@Tags			PropertyBlocks
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string												true	"Property ID"
//	@Param			block_id	path		string												true	"Property block ID"
//	@Param			q			query		GetPropertyBlockQuery								true	"Property blocks"
//	@Success		200			{object}	object{data=transformations.OutputPropertyBlock}	"Property block retrieved successfully"
//	@Failure		400			{object}	lib.HTTPError										"Error occurred when fetching a property block"
//	@Failure		401			{object}	string												"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError										"Property block not found"
//	@Failure		500			{object}	string												"An unexpected error occured"
//	@Router			/api/v1/properties/{property_id}/blocks/{block_id} [get]
func (h *PropertyBlockHandler) GetPropertyBlock(w http.ResponseWriter, r *http.Request) {
	populate := GetPopulateFields(r)

	propertyID := chi.URLParam(r, "property_id")
	propertyBlockID := chi.URLParam(r, "block_id")

	input := repository.GetPropertyBlockQuery{
		PropertyBlockID: propertyBlockID,
		PropertyID:      propertyID,
		Populate:        populate,
	}

	propertyBlock, getPropertyBlockErr := h.service.GetPropertyBlock(r.Context(), input)
	if getPropertyBlockErr != nil {
		HandleErrorResponse(w, getPropertyBlockErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBPropertyBlockToRest(propertyBlock),
	})
}

type UpdatePropertyBlockRequest struct {
	Name        *string   `json:"name,omitempty"        validate:"omitempty,min=2,max=100" example:"Luxury Apartment"`
	Images      *[]string `json:"images,omitempty"      validate:"omitempty,dive,url"      example:"https://example.com/image1.jpg,https://example.com/image2.jpg"`
	Description *string   `json:"description,omitempty" validate:"omitempty"               example:"Spacious apartment with sea view."`
}

// UpdatePropertyBlock godoc
//
//	@Summary		Update a property block
//	@Description	Update a property block
//	@Tags			PropertyBlocks
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string												true	"Property ID"
//	@Param			block_id	path		string												true	"Property block ID"
//	@Param			body		body		UpdatePropertyBlockRequest							true	"Property block details"
//	@Success		200			{object}	object{data=transformations.OutputPropertyBlock}	"Property block updated successfully"
//	@Failure		400			{object}	lib.HTTPError										"Error occurred when updating a property block"
//	@Failure		401			{object}	string												"Invalid or absent authentication token"
//	@Failure		403			{object}	lib.HTTPError										"Forbidden access"
//	@Failure		404			{object}	lib.HTTPError										"Property block not found"
//	@Failure		422			{object}	lib.HTTPError										"Invalid request body"
//	@Failure		500			{object}	string												"An unexpected error occurred"
//	@Router			/api/v1/properties/{property_id}/blocks/{block_id} [patch]
func (h *PropertyBlockHandler) UpdatePropertyBlock(w http.ResponseWriter, r *http.Request) {
	propertyID := chi.URLParam(r, "property_id")
	propertyBlockID := chi.URLParam(r, "block_id")

	var body UpdatePropertyBlockRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := services.UpdatePropertyBlockInput{
		PropertyBlockID: propertyBlockID,
		PropertyID:      propertyID,
		Name:            body.Name,
		Images:          body.Images,
		Description:     body.Description,
	}

	updatedPropertyBlock, updatePropertyBlockErr := h.service.UpdatePropertyBlock(r.Context(), input)
	if updatePropertyBlockErr != nil {
		HandleErrorResponse(w, updatePropertyBlockErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBPropertyBlockToRest(updatedPropertyBlock),
	})
}

// DeletePropertyBlock godoc
//
//	@Summary		Delete a property block
//	@Description	Delete a property block
//	@Tags			PropertyBlocks
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string			true	"Property ID"
//	@Param			block_id	path		string			true	"Property block ID"
//	@Success		204			{object}	nil				"Property block deleted successfully"
//	@Failure		400			{object}	lib.HTTPError	"Error occurred when deleting a property block"
//	@Failure		401			{object}	string			"Invalid or absent authentication token"
//	@Failure		403			{object}	lib.HTTPError	"Forbidden access"
//	@Failure		404			{object}	lib.HTTPError	"Property block not found"
//	@Failure		500			{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/properties/{property_id}/blocks/{block_id} [delete]
func (h *PropertyBlockHandler) DeletePropertyBlock(w http.ResponseWriter, r *http.Request) {
	propertyID := chi.URLParam(r, "property_id")
	propertyBlockID := chi.URLParam(r, "block_id")

	input := repository.DeletePropertyBlockInput{
		PropertyBlockID: propertyBlockID,
		PropertyID:      propertyID,
	}

	deletePropertyBlockErr := h.service.DeletePropertyBlock(r.Context(), input)
	if deletePropertyBlockErr != nil {
		HandleErrorResponse(w, deletePropertyBlockErr)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
