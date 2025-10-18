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

type ClientApplicationHandler struct {
	service services.ClientApplicationService
	appCtx  pkg.AppContext
}

func NewClientApplicationHandler(appCtx pkg.AppContext, service services.ClientApplicationService) ClientApplicationHandler {
	return ClientApplicationHandler{service, appCtx}
}

type CreateClientApplicationRequest struct {
	Type               string  `json:"type" validate:"required,oneof=INDIVIDUAL COMPANY"`                            // INDIVIDUAL | COMPANY
	SubType            string  `json:"subType" validate:"required,oneof=LANDLORD PROPERTY_MANAGER DEVELOPER AGENCY"` // INDIVIDUAL = LANDLORD; COMPANY = PROPERTY_MANAGER | DEVELOPER | AGENCY
	Name               string  `json:"name" validate:"required"`                                                     // company name or individual full name
	Address            string  `json:"address" validate:"required"`
	Country            string  `json:"country" validate:"required,min=3,max=255"`
	Region             string  `json:"region" validate:"required,min=3,max=255"`
	City               string  `json:"city" validate:"required,min=3,max=255"`
	Latitude           float64 `json:"latitude" validate:"required"`
	Longitude          float64 `json:"longitude" validate:"required"`
	ContactName        string  `json:"contactName" validate:"required"`
	ContactPhoneNumber string  `json:"contactPhoneNumber" validate:"required"`
	ContactEmail       string  `json:"contactEmail" validate:"required,email"`
}

// CreateClientApplication godoc
// @Summary      Create a new client application
// @Description  Create a new client application
// @Tags         ClientApplications
// @Accept       json
// @Produce      json
// @Param        body  body      CreateClientApplicationRequest  true  "Client Application details"
// @Success      201  {object}  object{data=transformations.OutputClientApplication}
// @Failure      400  {object}  lib.HTTPError
// @Failure      500  {object}  string
// @Router       /api/v1/clients/apply [post]
func (h *ClientApplicationHandler) CreateClientApplication(w http.ResponseWriter, r *http.Request) {

	var body CreateClientApplicationRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusInternalServerError)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)

	if !isPassedValidation {
		return
	}

	clientApplication, err := h.service.CreateClientApplication(r.Context(), services.CreateClientApplicationInput{
		Type:               body.Type,
		SubType:            body.SubType,
		Name:               body.Name,
		Address:            body.Address,
		Country:            body.Country,
		Region:             body.Region,
		City:               body.City,
		Latitude:           body.Latitude,
		Longitude:          body.Longitude,
		ContactName:        body.ContactName,
		ContactPhoneNumber: body.ContactPhoneNumber,
		ContactEmail:       body.ContactEmail,
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
		"data": transformations.DBClientApplicationToRestClientApplication(clientApplication),
	})

}

// GetClientApplicationById godoc
// @Summary      Get clientApplication by ID
// @Description  Get clientApplication by ID
// @Tags         ClientApplications
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "ClientApplication ID"
// @Success      200  {object}  object{data=transformations.OutputClientApplication}
// @Failure      400  {object}  lib.HTTPError
// @Failure      401  {object}  string
// @Failure      500  {object}  string
// @Router       /api/v1/client-applications/{id} [get]
func (h *ClientApplicationHandler) GetClientApplicationById(w http.ResponseWriter, r *http.Request) {
	currentAdmin, adminOk := lib.AdminFromContext(r.Context())

	if !adminOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	clientApplication, err := h.service.GetClientApplication(r.Context(), currentAdmin.ID)

	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{
			"errors": map[string]string{
				"message": err.Error(),
			},
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBClientApplicationToRestClientApplication(clientApplication),
	})
}

type RejectClientApplicationRequest struct {
	Reason string `json:"reason" validate:"required,min=3,max=255"`
}

// RejectClientApplication godoc
// @Summary      Reject a client application
// @Description  Admin rejects a client application with a reason
// @Tags         ClientApplications
// @Accept       json
// @Produce      json
// @Param        applicationId  path  string  true  "Client Application ID"
// @Param        body  body  RejectClientApplicationRequest  true  "Rejection reason"
// @Success      200  {object}  object{data=transformations.OutputClientApplication}
// @Failure      400  {object}  lib.HTTPError
// @Failure      401  {object}  string
// @Failure      404  {object}  lib.HTTPError
// @Failure      500  {object}  lib.HTTPError
// @Router       /api/v1/client-applications/{applicationId}/reject [patch]
func (h *ClientApplicationHandler) RejectClientApplication(w http.ResponseWriter, r *http.Request) {

	currentAdmin, adminOk := lib.AdminFromContext(r.Context())

	if !adminOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	applicationId := chi.URLParam(r, "applicationId")

	var body RejectClientApplicationRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	clientApplication, err := h.service.RejectClientApplication(r.Context(), applicationId, body.Reason, currentAdmin.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBClientApplicationToRestClientApplication(clientApplication),
	})
}

// ApproveClientApplication godoc
// @Summary      Approve a client application
// @Description  Admin approves a client's application after review
// @Tags         ClientApplications
// @Accept       json
// @Produce      json
// @Param        applicationId  path  string  true  "Client Application ID"
// @Success      200  {object}  object{data=transformations.OutputClientApplication}
// @Failure      400  {object}  lib.HTTPError
// @Failure      401  {object}  string
// @Failure      404  {object}  lib.HTTPError
// @Failure      500  {object}  lib.HTTPError
// @Router       /api/v1/client-applications/{applicationId}/reject [patch]
func (h *ClientApplicationHandler) ApproveClientApplication(w http.ResponseWriter, r *http.Request) {

	currentAdmin, adminOk := lib.AdminFromContext(r.Context())

	if !adminOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	applicationId := chi.URLParam(r, "applicationId")

	clientApplication, err := h.service.ApproveClientApplication(r.Context(), applicationId, currentAdmin.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBClientApplicationToRestClientApplication(clientApplication),
	})
}

type ListClientApplicationsFilterRequest struct {
}

// GetClientApplications godoc
// @Summary      Get all ClientApplications
// @Description  Get all ClientApplications
// @Tags         ClientApplications
// @Accept       json
// @Produce      json
// @Param        q  query      ListClientApplicationsFilterRequest  true  "ClientApplications"
// @Success      200  {object}  object{data=object{rows=[]transformations.OutputClientApplication,meta=lib.HTTPReturnPaginatedMetaResponse}}
// @Failure      400  {object}  lib.HTTPError
// @Failure      401  {object}  string
// @Failure      500  {object}  string
// @Router       /api/v1/client-applications [get]
func (h *ClientApplicationHandler) ListClientApplications(w http.ResponseWriter, r *http.Request) {
	_, adminOk := lib.AdminFromContext(r.Context())

	if !adminOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	filters := ListClientApplicationsFilterRequest{}

	isFiltersPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filters, w)
	if !isFiltersPassedValidation {
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

	isFilterQueryPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFilterQueryPassedValidation {
		return
	}

	clientApplications, clientApplicationsErr := h.service.ListClientApplications(r.Context(), *filterQuery, repository.ListClientApplicationsFilter{})

	if clientApplicationsErr != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]any{
			"errors": map[string]string{
				"message": clientApplicationsErr.Error(),
			},
		})
		return
	}

	count, countsErr := h.service.CountClientApplications(r.Context(), *filterQuery, repository.ListClientApplicationsFilter{})

	if countsErr != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]any{
			"errors": map[string]string{
				"message": countsErr.Error(),
			},
		})
		return
	}

	clientApplicationsTransformed := make([]interface{}, 0)
	for _, clientApplication := range clientApplications {
		clientApplicationsTransformed = append(clientApplicationsTransformed, transformations.DBClientApplicationToRestClientApplication(&clientApplication))
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": map[string]any{
			"rows": clientApplicationsTransformed,
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
