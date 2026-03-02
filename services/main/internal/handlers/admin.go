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

type AdminHandler struct {
	service services.AdminService
	appCtx  pkg.AppContext
}

func NewAdminHandler(appCtx pkg.AppContext, service services.AdminService) AdminHandler {
	return AdminHandler{service, appCtx}
}

type LoginRequest struct {
	Email    string `json:"email"    validate:"required,email"         example:"admin@example.com"`
	Password string `json:"password" validate:"required,min=8,max=255" example:"strongpassword123"`
}

// AuthenticateAdmin godoc
//
//	@Summary		Authenticate admin and return token (Admin)
//	@Description	Authenticate admin and return token (Admin)
//	@Tags			Admins
//	@Accept			json
//	@Produce		json
//	@Param			body	body		LoginRequest	true	"Login credentials"
//	@Success		200		{object}	object{data=transformations.OutputAdminWithToken}
//	@Failure		400		{object}	lib.HTTPError
//	@Failure		500		{object}	string
//	@Router			/api/v1/admin/admins/login [post]
func (h *AdminHandler) Authenticate(w http.ResponseWriter, r *http.Request) {
	var body LoginRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)

	if !isPassedValidation {
		return
	}

	adminWithToken, err := h.service.AuthenticateAdmin(r.Context(), services.LoginAdminInput{
		Email:    body.Email,
		Password: body.Password,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminWithTokenToRestAdminWithToken(
			&adminWithToken.Admin,
			adminWithToken.Token,
		),
	})
}

type CreateAdminRequest struct {
	Name  string `json:"name"  validate:"required,min=3,max=255"`
	Email string `json:"email" validate:"required,email"`
}

// CreateAdmin godoc
//
//	@Summary		Create a new admin (Admin)
//	@Description	Create a new admin (Admin)
//	@Tags			Admins
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body		CreateAdminRequest	true	"Admin details"
//	@Success		201		{object}	object{data=transformations.OutputAdmin}
//	@Failure		400		{object}	lib.HTTPError
//	@Failure		401		{object}	string
//	@Failure		500		{object}	string
//	@Router			/api/v1/admin/admins [post]
func (h *AdminHandler) CreateAdmin(w http.ResponseWriter, r *http.Request) {
	currentAdmin, currentAdminOk := lib.AdminFromContext(r.Context())

	if !currentAdminOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreateAdminRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)

	if !isPassedValidation {
		return
	}

	admin, err := h.service.CreateAdmin(r.Context(), services.CreateAdminInput{
		Name:        body.Name,
		Email:       body.Email,
		CreatedByID: currentAdmin.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminToRestAdmin(admin),
	})
}

// GetCurrentAdmin godoc
//
//	@Summary		Get the currently authenticated admin (Admin)
//	@Description	Get the currently authenticated admin (Admin)
//	@Tags			Admins
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Success		200	{object}	object{data=transformations.OutputAdmin}
//	@Failure		400	{object}	lib.HTTPError
//	@Failure		401	{object}	string
//	@Failure		500	{object}	string
//	@Router			/api/v1/admin/admins/me [get]
func (h *AdminHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	currentAdmin, adminOk := lib.AdminFromContext(r.Context())

	if !adminOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	admin, err := h.service.GetAdmin(r.Context(), currentAdmin.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminToRestAdmin(admin),
	})
}

// GetAdminById godoc
//
//	@Summary		Get admin by ID (Admin)
//	@Description	Get admin by ID (Admin)
//	@Tags			Admins
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			admin_id	path		string	true	"Admin ID"
//	@Success		200			{object}	object{data=transformations.OutputAdmin}
//	@Failure		400			{object}	lib.HTTPError
//	@Failure		401			{object}	string
//	@Failure		500			{object}	string
//	@Router			/api/v1/admin/admins/{admin_id} [get]
func (h *AdminHandler) GetAdminById(w http.ResponseWriter, r *http.Request) {
	adminId := chi.URLParam(r, "admin_id")

	admin, err := h.service.GetAdmin(r.Context(), adminId)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminToRestAdmin(admin),
	})
}

type ListAdminsFilterRequest struct {
	lib.FilterQueryInput
	IDs []string `json:"ids" validate:"omitempty,dive,uuid4" example:"a8098c1a-f86e-11da-bd1a-00112444be1e" description:"List of admin IDs to filter by" collectionFormat:"multi"`
}

// GetAdmins godoc
//
//	@Summary		Get all admins (Admin)
//	@Description	Get all admins (Admin)
//	@Tags			Admins
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			q	query		ListAdminsFilterRequest	true	"Admins"
//	@Success		200	{object}	object{data=object{rows=[]transformations.OutputAdmin,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400	{object}	lib.HTTPError
//	@Failure		401	{object}	string
//	@Failure		500	{object}	string
//	@Router			/api/v1/admin/admins [get]
func (h *AdminHandler) ListAdmins(w http.ResponseWriter, r *http.Request) {
	_, adminOk := lib.AdminFromContext(r.Context())

	if !adminOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	filters := ListAdminsFilterRequest{
		IDs: r.URL.Query()["ids"],
	}

	isFiltersPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filters, w)
	if !isFiltersPassedValidation {
		return
	}

	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		HandleErrorResponse(w, filterErr)
		return
	}

	isFilterQueryPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFilterQueryPassedValidation {
		return
	}

	input := repository.ListAdminsFilter{
		IDs: lib.NullOrStringArray(filters.IDs),
	}

	admins, adminsErr := h.service.ListAdmins(
		r.Context(),
		*filterQuery,
		input,
	)

	if adminsErr != nil {
		HandleErrorResponse(w, adminsErr)
		return
	}

	count, countsErr := h.service.CountAdmins(
		r.Context(),
		*filterQuery,
		input,
	)

	if countsErr != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]any{
			"errors": map[string]string{
				"message": countsErr.Error(),
			},
		})
		return
	}

	adminsTransformed := make([]interface{}, 0)
	for _, admin := range admins {
		adminsTransformed = append(adminsTransformed, transformations.DBAdminToRestAdmin(&admin))
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, adminsTransformed, count))
}
