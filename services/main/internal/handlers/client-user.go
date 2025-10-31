package handlers

import (
	"encoding/json"
	"net/http"

	"fmt"
	"os"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	logger "github.com/sirupsen/logrus"
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

// SendPasswordResetLinkRequest represents the incoming JSON payload.
type SendPasswordResetLinkRequest struct {
	Email string `json:"email" validate:"required,email" example:"client-user@example.com"`
}

// SendResetLink godoc
//
//	@Summary		Send password reset link to client user
//	@Description	Generates a JWT token and sends a password reset link to the client user’s email
//	@Tags			ClientUsers
//	@Accept			json
//	@Produce		json
//	@Param			body	body		SendPasswordResetLinkRequest	true	"Client user email address"
//	@Success		204		"No Content"
//	@Failure		400		{object}	lib.HTTPError					"Invalid request"
//	@Failure		500		{object}	string							"Unexpected server error"
//	@Router			/api/v1/client-users/reset-password [post]
func (h *ClientUserHandler) SendResetLink(w http.ResponseWriter, r *http.Request) {
	var body SendPasswordResetLinkRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if ok := lib.ValidateRequest(h.appCtx.Validator, body, w); !ok {
		return
	}

	// Check if user exists
	clientUser, err := h.service.GetClientUserByEmail(r.Context(), body.Email)
	if err != nil {
		// For security, don't reveal whether the email exists
		w.WriteHeader(http.StatusNoContent)
		return
	}

	// Generate JWT token for password reset
	token, err := h.service.GeneratePasswordResetToken(clientUser)
	if err != nil {
		http.Error(w, "Failed to generate reset token", http.StatusInternalServerError)
		return
	}

	origin := r.Header.Get("Origin")
	if origin == "" {
		origin = os.Getenv("FRONTEND_ORIGIN")
		if origin == "" {
			origin = "http://localhost:3000"
		}
	}

	resetLink := fmt.Sprintf("%s/reset-your-password?token=%s", origin, token)

	message := lib.RenderTemplate(lib.CLIENT_USER_PASSWORD_RESET_BODY, map[string]string{
		"name":       clientUser.Name,
		"reset_link": resetLink,
	})

	logger.Info(message)

	go func() {
		if err := pkg.SendEmail(
			h.appCtx,
			pkg.SendEmailInput{
				Recipient: body.Email,
				Subject:   lib.CLIENT_USER_PASSWORD_RESET_SUBJECT,
				TextBody:  message,
			},
		); err != nil {
			logger.Error("Failed to send password reset email", "error", err)
		}
	}()

	w.WriteHeader(http.StatusNoContent)
}
