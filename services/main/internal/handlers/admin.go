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

type AdminHandler struct {
	service services.AdminService
	appCtx  pkg.AppContext
}

func NewAdminHandler(appCtx pkg.AppContext, service services.AdminService) AdminHandler {
	return AdminHandler{service, appCtx}
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email" example:"admin@example.com"`
	Password string `json:"password" validate:"required,min=8,max=255" example:"strongpassword123"`
}

// AuthenticateAdmin godoc
// @Summary      Authenticate admin and return token
// @Description  Authenticate admin and return token
// @Tags         admins
// @Accept       json
// @Produce      json
// @Param        body  body      LoginRequest  true  "Login credentials"
// @Success      200  {object}  object{data=transformations.OutputAdminWithToken}
// @Failure      400  {object}  lib.HTTPError
// @Failure      500  {object}  string
// @Router       /api/v1/admins/login [post]
func (h *AdminHandler) Authenticate(w http.ResponseWriter, r *http.Request) {
	var body LoginRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusInternalServerError)
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
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{
			"errors": map[string]string{
				"message": err.Error(),
			},
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminWithTokenToRestAdminWithToken(&adminWithToken.Admin, adminWithToken.Token),
	})
}

type CreateAdminRequest struct {
	Name  string `json:"name" validate:"required,min=3,max=255"`
	Email string `json:"email" validate:"required,email"`
}

// CreateAdmin godoc
// @Summary      Create a new admin
// @Description  Create a new admin
// @Tags         admins
// @Accept       json
// @Security BearerAuth
// @Produce      json
// @Param        body  body      CreateAdminRequest  true  "Admin details"
// @Success      201  {object}  object{data=transformations.OutputAdmin}
// @Failure      400  {object}  lib.HTTPError
// @Failure      401  {object}  string
// @Failure      500  {object}  string
// @Router       /api/v1/admins [post]
func (h *AdminHandler) CreateAdmin(w http.ResponseWriter, r *http.Request) {
	currentAdmin, currentAdminOk := lib.AdminFromContext(r.Context())

	if !currentAdminOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreateAdminRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusInternalServerError)
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
		"data": transformations.DBAdminToRestAdmin(admin),
	})
}

// GetCurrentAdmin godoc
// @Summary      Get the currently authenticated admin
// @Description  Get the currently authenticated admin
// @Tags         admins
// @Accept       json
// @Security BearerAuth
// @Produce      json
// @Success      200  {object}  object{data=transformations.OutputAdmin}
// @Failure      400  {object}  lib.HTTPError
// @Failure      401  {object}  string
// @Failure      500  {object}  string
// @Router       /api/v1/admins/me [get]
func (h *AdminHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	currentAdmin, adminOk := lib.AdminFromContext(r.Context())

	if !adminOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	admin, err := h.service.GetAdmin(r.Context(), currentAdmin.ID)
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
		"data": transformations.DBAdminToRestAdmin(admin),
	})
}

// GetAdminById godoc
// @Summary      Get admin by ID
// @Description  Get admin by ID
// @Tags         admins
// @Accept       json
// @Security BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Admin ID"
// @Success      200  {object}  object{data=transformations.OutputAdmin}
// @Failure      400  {object}  lib.HTTPError
// @Failure      401  {object}  string
// @Failure      500  {object}  string
// @Router       /api/v1/admins/{id} [get]
func (h *AdminHandler) GetAdminById(w http.ResponseWriter, r *http.Request) {
	currentAdmin, adminOk := lib.AdminFromContext(r.Context())

	if !adminOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	admin, err := h.service.GetAdmin(r.Context(), currentAdmin.ID)
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
		"data": transformations.DBAdminToRestAdmin(admin),
	})
}

type ListAdminsFilterRequest struct{}

// GetAdmins godoc
// @Summary      Get all admins
// @Description  Get all admins
// @Tags         admins
// @Accept       json
// @Security BearerAuth
// @Produce      json
// @Param        q  query      ListAdminsFilterRequest  true  "Admins"
// @Success      200  {object}  object{data=object{rows=[]transformations.OutputAdmin,meta=lib.HTTPReturnPaginatedMetaResponse}}
// @Failure      400  {object}  lib.HTTPError
// @Failure      401  {object}  string
// @Failure      500  {object}  string
// @Router       /api/v1/admins [get]
func (h *AdminHandler) ListAdmins(w http.ResponseWriter, r *http.Request) {
	_, adminOk := lib.AdminFromContext(r.Context())

	if !adminOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	filters := ListAdminsFilterRequest{}

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

	admins, adminsErr := h.service.ListAdmins(r.Context(), *filterQuery, repository.ListAdminsFilter{})

	if adminsErr != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]any{
			"errors": map[string]string{
				"message": adminsErr.Error(),
			},
		})
		return
	}

	count, countsErr := h.service.CountAdmins(r.Context(), *filterQuery, repository.ListAdminsFilter{})

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

	json.NewEncoder(w).Encode(map[string]any{
		"data": map[string]any{
			"rows": adminsTransformed,
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
