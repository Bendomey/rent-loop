package handlers

import (
	"encoding/json"
	"net/http"
	"slices"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type ClientUserHandler struct {
	service services.ClientUserService
	appCtx  pkg.AppContext
}

func NewClientUserHandler(appCtx pkg.AppContext, service services.ClientUserService) ClientUserHandler {
	return ClientUserHandler{service, appCtx}
}

type CreateClientUserRequest struct {
	Name  string `json:"name" validate:"required,min=2,max=100" example:"John Doe"`
	Email string `json:"email" validate:"required,email" example:"client-user@example.com"`
	Phone string `json:"phone" validate:"required,e164" example:"+2334567890"`
	Role  string `json:"role" validate:"required,oneof=ADMIN STAFF" example:"ADMIN"`
}

// CreateClientUser godoc
// @Summary Creates new client user
// @Description Create a new client user
// @Tags ClientUsers
// @Accept json
// @Security BearerAuth
// @Produce json
// @Param body body CreateClientUserRequest true "Create Client User Request Body"
// @Success 201 {object} object{data=transformations.OutputClientUser} "Client user created successfully"
// @Failure 400 {object} lib.HTTPError "Error occured when creating a client user"
// @Failure 401 {object} string "Invalid or absent authentication token"
// @Failure 500 {object} string "An unexpected error occured"
// @Router /api/v1/client-users [post]
func (h *ClientUserHandler) CreateClientUser(w http.ResponseWriter, r *http.Request) {
	currentClient, currentClientOk := lib.ClientUserFromContext(r.Context())

	if !currentClientOk || slices.Contains([]string{"ADMIN", "OWNER"}, currentClient.Role) == false {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreateClientUserRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusInternalServerError)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)

	if !isPassedValidation {
		return
	}

	clientUser, err := h.service.CreateClientUser(r.Context(), services.CreateClientUserInput{
		Name:     body.Name,
		Email:    body.Email,
		Phone:    body.Phone,
		Role:     body.Role,
		ClientID: currentClient.ID,
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
		"data": transformations.DBClientUserToRest(clientUser),
	})
}
