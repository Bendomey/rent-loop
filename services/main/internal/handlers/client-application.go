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
	Type               string  `json:"type" validate:"required,oneof=INDIVIDUAL COMPANY"`                             // INDIVIDUAL | COMPANY
	SubType            string  `json:"sub_type" validate:"required,oneof=LANDLORD PROPERTY_MANAGER DEVELOPER AGENCY"` // INDIVIDUAL = LANDLORD; COMPANY = PROPERTY_MANAGER | DEVELOPER | AGENCY
	Name               string  `json:"name" validate:"required"`
	Address            string  `json:"address" validate:"required"`
	Country            string  `json:"country" validate:"required"`
	Region             string  `json:"region" validate:"required"`
	City               string  `json:"city" validate:"required"`
	Latitude           float64 `json:"latitude" validate:"required"`
	Longitude          float64 `json:"longitude" validate:"required"`
	ContactName        string  `json:"contact_name" validate:"required"`
	ContactPhoneNumber string  `json:"contact_phone_number" validate:"required,e164"`
	ContactEmail       string  `json:"contact_email" validate:"required,email"`
	DateOfBirth        *string `json:"date_of_birth" validate:"omitempty,datetime=2006-01-02"`
	IDType             *string `json:"id_type" validate:"omitempty,oneof=DRIVERS_LICENSE PASSPORT NATIONAL_ID"`
	IDNumber           *string `json:"id_number"`
	IDExpiry           *string `json:"id_expiry" validate:"omitempty,datetime=2006-01-02"`
	IDDocumentURL      *string `json:"id_document_url" validate:"omitempty,url"`
	RegistrationNumber *string `json:"registration_number"`
	LogoURL            *string `json:"logo_url" validate:"omitempty,url"`
	Description        *string `json:"description"`
	WebsiteURL         *string `json:"website_url" validate:"omitempty,url"`
	SupportEmail       *string `json:"support_email" validate:"omitempty,email"`
	SupportPhone       *string `json:"support_phone" validate:"omitempty,e164"`
}

// CreateClientApplication godoc
//
//	@Summary		Create a new client application
//	@Description	Create a new client application
//	@Tags			ClientApplications
//	@Accept			json
//	@Produce		json
//	@Param			body	body		CreateClientApplicationRequest	true	"Client Application details"
//	@Success		201		{object}	object{data=transformations.OutputClientApplication}
//	@Failure		400		{object}	lib.HTTPError
//	@Failure		500		{object}	string
//	@Router			/api/v1/clients/apply [post]
func (h *ClientApplicationHandler) CreateClientApplication(w http.ResponseWriter, r *http.Request) {
	var body CreateClientApplicationRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
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
		DateOfBirth:        body.DateOfBirth,
		IDType:             body.IDType,
		IDNumber:           body.IDNumber,
		IDExpiry:           body.IDExpiry,
		IDDocumentURL:      body.IDDocumentURL,
		RegistrationNumber: body.RegistrationNumber,
		LogoURL:            body.LogoURL,
		Description:        body.Description,
		WebsiteURL:         body.WebsiteURL,
		SupportEmail:       body.SupportEmail,
		SupportPhone:       body.SupportPhone,
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
//
//	@Summary		Get clientApplication by ID
//	@Description	Get clientApplication by ID
//	@Tags			ClientApplications
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			application_id	path		string	true	"ClientApplication ID"
//	@Success		200				{object}	object{data=transformations.OutputClientApplication}
//	@Failure		400				{object}	lib.HTTPError
//	@Failure		401				{object}	string
//	@Failure		500				{object}	string
//	@Router			/api/v1/client-applications/{application_id} [get]
func (h *ClientApplicationHandler) GetClientApplicationById(w http.ResponseWriter, r *http.Request) {
	applicationId := chi.URLParam(r, "application_id")

	clientApplication, err := h.service.GetClientApplication(r.Context(), applicationId)
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
	Reason string `json:"reason" validate:"required"`
}

// RejectClientApplication godoc
//
//	@Summary		Reject a client application
//	@Description	Admin rejects a client application with a reason
//	@Tags			ClientApplications
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			application_id	path		string							true	"Client Application ID"
//	@Param			body			body		RejectClientApplicationRequest	true	"Rejection reason"
//	@Success		200				{object}	object{data=transformations.OutputClientApplication}
//	@Failure		400				{object}	lib.HTTPError
//	@Failure		401				{object}	string
//	@Failure		404				{object}	lib.HTTPError
//	@Failure		500				{object}	lib.HTTPError
//	@Router			/api/v1/client-applications/{application_id}/reject [patch]
func (h *ClientApplicationHandler) RejectClientApplication(w http.ResponseWriter, r *http.Request) {
	currentAdmin, adminOk := lib.AdminFromContext(r.Context())

	if !adminOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	applicationId := chi.URLParam(r, "application_id")

	var body RejectClientApplicationRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	clientApplication, err := h.service.RejectClientApplication(r.Context(), services.RejectClientApplicationInput{
		ClientApplicationId: applicationId,
		Reason:              body.Reason,
		AdminId:             currentAdmin.ID,
	})
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
//
//	@Summary		Approve a client application
//	@Description	Admin approves a client's application after review
//	@Tags			ClientApplications
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			application_id	path		string	true	"Client Application ID"
//	@Success		200				{object}	object{data=transformations.OutputClientApplication}
//	@Failure		400				{object}	lib.HTTPError
//	@Failure		401				{object}	string
//	@Failure		404				{object}	lib.HTTPError
//	@Failure		500				{object}	lib.HTTPError
//	@Router			/api/v1/client-applications/{application_id}/approve [patch]
func (h *ClientApplicationHandler) ApproveClientApplication(w http.ResponseWriter, r *http.Request) {
	currentAdmin, adminOk := lib.AdminFromContext(r.Context())

	if !adminOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	applicationId := chi.URLParam(r, "application_id")

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
	Status  *string `json:"status" validate:"omitempty,oneof=ClientApplication.Status.Pending ClientApplication.Status.Approved ClientApplication.Status.Rejected"`
	Type    *string `json:"type" validate:"omitempty,oneof=INDIVIDUAL COMPANY"`
	SubType *string `json:"sub_type" validate:"omitempty,oneof=LANDLORD PROPERTY_MANAGER DEVELOPER AGENCY"`
}

// GetClientApplications godoc
//
//	@Summary		Get all ClientApplications
//	@Description	Get all ClientApplications
//	@Tags			ClientApplications
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			q	query		ListClientApplicationsFilterRequest	true	"ClientApplications"
//	@Success		200	{object}	object{data=object{rows=[]transformations.OutputClientApplication,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400	{object}	lib.HTTPError
//	@Failure		401	{object}	string
//	@Failure		500	{object}	string
//	@Router			/api/v1/client-applications [get]
func (h *ClientApplicationHandler) ListClientApplications(w http.ResponseWriter, r *http.Request) {
	filters := ListClientApplicationsFilterRequest{
		Status:  lib.NullOrString(r.URL.Query().Get("status")),
		Type:    lib.NullOrString(r.URL.Query().Get("type")),
		SubType: lib.NullOrString(r.URL.Query().Get("sub_type")),
	}

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

	input := repository.ListClientApplicationsFilter{
		Status:  filters.Status,
		Type:    filters.Type,
		SubType: filters.SubType,
	}
	clientApplications, clientApplicationsErr := h.service.ListClientApplications(r.Context(), *filterQuery, input)

	if clientApplicationsErr != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]any{
			"errors": map[string]string{
				"message": clientApplicationsErr.Error(),
			},
		})
		return
	}

	count, countsErr := h.service.CountClientApplications(r.Context(), *filterQuery, input)

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

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, clientApplicationsTransformed, count))
}
