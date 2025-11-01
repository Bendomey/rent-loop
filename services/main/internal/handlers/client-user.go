package handlers

import (
	"encoding/json"
	"net/http"

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
	Name  string `json:"name" validate:"required,min=2" example:"John Doe"`
	Email string `json:"email" validate:"required,email" example:"client-user@example.com"`
	Phone string `json:"phone" validate:"required,e164" example:"+233281234569"`
	Role  string `json:"role" validate:"required,oneof=ADMIN STAFF" example:"ADMIN"`
}

// CreateClientUser godoc
//
//	@Summary		Creates new client user
//	@Description	Create a new client user
//	@Tags			ClientUsers
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body		CreateClientUserRequest							true	"Create Client User Request Body"
//	@Success		201		{object}	object{data=transformations.OutputClientUser}	"Client user created successfully"
//	@Failure		400		{object}	lib.HTTPError									"Error occured when creating a client user"
//	@Failure		401		{object}	string											"Invalid or absent authentication token"
//	@Failure		500		{object}	string											"An unexpected error occured"
//	@Router			/api/v1/client-users [post]
func (h *ClientUserHandler) CreateClientUser(w http.ResponseWriter, r *http.Request) {
	currentClientUser, currentClientUserOk := lib.ClientUserFromContext(r.Context())

	if !currentClientUserOk {
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
		Name:        body.Name,
		Email:       body.Email,
		Phone:       body.Phone,
		Role:        body.Role,
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
		"data": transformations.DBClientUserToRest(clientUser),
	})
}

type LoginClientUserRequest struct {
	Email    string `json:"email" validate:"required,email" example:"client-user@example.com"`
	Password string `json:"password" validate:"required,min=6" example:"password123"`
}

// AuthenticateClientUser godoc
//
//	@Summary		Authenticates client user and returns token
//	@Description	Authenticate client user and returns client user and token
//	@Tags			ClientUsers
//	@Accept			json
//	@Produce		json
//	@Param			body	body		LoginClientUserRequest									true	"Client user login credentials"
//	@Success		200		{object}	object{data=transformations.OutputClientUserWithToken}	"Client user authenticated successfully"
//	@Failure		400		{object}	lib.HTTPError											"Error occured when authenticating a client user"
//	@Failure		500		{object}	string													"An unexpected error occured"
//	@Router			/api/v1/client-users/login [post]
func (h *ClientUserHandler) AuthenticateClientUser(w http.ResponseWriter, r *http.Request) {
	var body LoginClientUserRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusInternalServerError)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)

	if !isPassedValidation {
		return
	}

	clientUserWithToken, err := h.service.AuthenticateClientUser(r.Context(), services.AuthenticateClientUserInput{
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

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBClientUserToRestWithToken(&clientUserWithToken.ClientUser, clientUserWithToken.Token),
	})
}

// GetCurrentClientUser godoc
//
//	@Summary		Get the currently authenticated client user
//	@Description	Get the currently authenticated client user
//	@Tags			ClientUsers
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Success		200	{object}	object{data=transformations.OutputClientUser}
//	@Failure		400	{object}	lib.HTTPError
//	@Failure		401	{object}	string
//	@Failure		500	{object}	string
//	@Router			/api/v1/client-users/me [get]
func (h *ClientUserHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	currentClientUser, clientUserOk := lib.ClientUserFromContext(r.Context())

	if !clientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	clientUser, err := h.service.GetClientUser(r.Context(), currentClientUser.ID)
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
		"data": transformations.DBClientUserToRest(clientUser),
	})
}

type SendForgotPasswordResetLinkRequest struct {
	Email string `json:"email" validate:"required,email" example:"client-user@example.com"`
}

// SendForgotPasswordResetLink godoc
//
//	@Summary		Sends forgot password reset link to client user
//	@Description	Sends forgot password reset link to client user
//	@Tags			ClientUsers
//	@Accept			json
//	@Param			body	body		SendForgotPasswordResetLinkRequest						true  "Send Forgot Password Reset Link Request Body"
//	@Success		204		"Forgot password reset link sent successfully"
//	@Failure		400		{object}	lib.HTTPError											"Error occured when sending forgot password reset link to client user"
//	@Failure		500		{object}	string													"An unexpected error occured"
//	@Router			/api/v1/client-users/forgot-password [post]
func (h *ClientUserHandler) SendForgotPasswordResetLink(w http.ResponseWriter, r *http.Request) {
	var body SendForgotPasswordResetLinkRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusInternalServerError)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)

	if !isPassedValidation {
		return
	}

	_, err := h.service.SendForgotPasswordResetLink(r.Context(), body.Email)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{
			"errors": map[string]string{
				"message": err.Error(),
			},
		})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{})
}
