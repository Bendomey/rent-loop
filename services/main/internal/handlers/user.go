package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Bendomey/goutilities/pkg/signjwt"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/dgrijalva/jwt-go"
)

type UserHandler struct {
	service             services.UserService
	refreshTokenService services.RefreshTokenService
	appCtx              pkg.AppContext
}

func NewUserHandler(
	appCtx pkg.AppContext,
	service services.UserService,
	refreshTokenService services.RefreshTokenService,
) UserHandler {
	return UserHandler{service, refreshTokenService, appCtx}
}

type LoginUserRequest struct {
	Email    string `json:"email"    validate:"required,email" example:"user@example.com"`
	Password string `json:"password" validate:"required,min=6" example:"password123"`
}

// LoginUser godoc
//
//	@Summary		Login user and return token (Admin)
//	@Description	Login user with email and password, returns user with client_users and token (Admin)
//	@Tags			Users
//	@Accept			json
//	@Produce		json
//	@Param			body	body		LoginUserRequest									true	"Login credentials"
//	@Success		200		{object}	object{data=transformations.OutputUserWithToken}	"User authenticated successfully"
//	@Failure		400		{object}	lib.HTTPError										"Error occurred when authenticating user"
//	@Failure		404		{object}	lib.HTTPError										"User not found"
//	@Failure		500		{object}	string												"An unexpected error occurred"
//	@Router			/api/v1/admin/users/login [post]
func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var body LoginUserRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	result, err := h.service.LoginUser(r.Context(), services.LoginUserInput{
		Email:     body.Email,
		Password:  body.Password,
		UserAgent: UserAgentFromRequest(r),
		IPAddress: ClientIPFromRequest(r),
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBUserToRestWithToken(&result.User, transformations.TokenPair{
			Token:            result.Token,
			ExpiresIn:        result.ExpiresIn,
			RefreshToken:     result.RefreshToken,
			RefreshExpiresIn: result.RefreshExpiresIn,
		}),
	})
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required" example:"3f2504e0-4f89-11d3-9a0c-0305e82c3301:sSx1"`
}

// RefreshToken godoc
//
//	@Summary		Exchange a refresh token for a new token pair (Admin)
//	@Description	Rotates the presented refresh token and returns a new access token plus a new refresh token. No Authorization header is required — the refresh token itself is the credential. (Admin)
//	@Tags			Users
//	@Accept			json
//	@Produce		json
//	@Param			body	body		RefreshTokenRequest								true	"Refresh token"
//	@Success		200		{object}	object{data=transformations.OutputTokenPair}	"Token pair refreshed successfully"
//	@Failure		401		{object}	lib.HTTPError									"Refresh token is invalid, revoked, or expired"
//	@Failure		422		{object}	lib.HTTPError									"Validation error occurred"
//	@Failure		500		{object}	string											"An unexpected error occurred"
//	@Router			/api/v1/admin/users/refresh [post]
func (h *UserHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var body RefreshTokenRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	rotated, err := h.refreshTokenService.Rotate(r.Context(), body.RefreshToken)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	accessTTL := time.Duration(h.appCtx.Config.AuthTokenTTL.AccessTokenHours) * time.Hour
	token, signErr := signjwt.SignJWT(jwt.MapClaims{
		"id":  rotated.UserID,
		"exp": time.Now().Add(accessTTL).Unix(),
	}, h.appCtx.Config.TokenSecrets.ClientUserSecret)
	if signErr != nil {
		HandleErrorResponse(w, pkg.InternalServerError(signErr.Error(), &pkg.RentLoopErrorParams{
			Err:      signErr,
			Metadata: map[string]string{"function": "RefreshToken", "action": "signing access token"},
		}))
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.TokenPairToRest(transformations.TokenPair{
			Token:            token,
			ExpiresIn:        int(accessTTL.Seconds()),
			RefreshToken:     rotated.Token,
			RefreshExpiresIn: int(h.refreshTokenService.TTL().Seconds()),
		}),
	})
}

// Logout godoc
//
//	@Summary		Revoke a refresh token (Admin)
//	@Description	Ends one session by revoking the presented refresh token. Always returns 204, even for an unknown or already-revoked token — logout must never block a client from clearing its local state. Other sessions for the same user are unaffected. (Admin)
//	@Tags			Users
//	@Accept			json
//	@Param			body	body	RefreshTokenRequest	true	"Refresh token to revoke"
//	@Success		204		"Session revoked"
//	@Failure		422		{object}	lib.HTTPError	"Validation error occurred"
//	@Failure		500		{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/users/logout [post]
func (h *UserHandler) Logout(w http.ResponseWriter, r *http.Request) {
	var body RefreshTokenRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	if err := h.refreshTokenService.Revoke(r.Context(), body.RefreshToken); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetMe godoc
//
//	@Summary		Get the currently authenticated user (Admin)
//	@Description	Get the currently authenticated user with all client memberships (Admin)
//	@Tags			Users
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Success		200	{object}	object{data=transformations.OutputUser}	"User retrieved successfully"
//	@Failure		401	{object}	string									"Invalid or absent authentication token"
//	@Failure		404	{object}	lib.HTTPError							"User not found"
//	@Failure		500	{object}	string									"An unexpected error occurred"
//	@Router			/api/v1/admin/users/me [get]
func (h *UserHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.UserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := h.service.GetMe(r.Context(), currentUser.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBUserToRest(user),
	})
}

type UpdateMeRequest struct {
	Name        lib.Optional[string] `json:"name"         validate:"omitempty,min=2" swaggertype:"string" example:"John Doe"`
	PhoneNumber lib.Optional[string] `json:"phone_number" validate:"omitempty,e164"  swaggertype:"string" example:"+233281234569"`
	Email       lib.Optional[string] `json:"email"        validate:"omitempty,email" swaggertype:"string" example:"john@example.com"`
}

// UpdateMe godoc
//
//	@Summary		Update the currently authenticated user (Admin)
//	@Description	Update the currently authenticated user's profile (Admin)
//	@Tags			Users
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body		UpdateMeRequest							true	"Update User Request Body"
//	@Success		200		{object}	object{data=transformations.OutputUser}	"User updated successfully"
//	@Failure		400		{object}	lib.HTTPError							"Error occurred when updating user"
//	@Failure		401		{object}	string									"Invalid or absent authentication token"
//	@Failure		404		{object}	lib.HTTPError							"User not found"
//	@Failure		422		{object}	lib.HTTPError							"Validation error occurred"
//	@Failure		500		{object}	string									"An unexpected error occurred"
//	@Router			/api/v1/admin/users/me [patch]
func (h *UserHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.UserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body UpdateMeRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	user, err := h.service.UpdateMe(r.Context(), services.UpdateUserMeInput{
		UserID:      currentUser.ID,
		Name:        body.Name,
		PhoneNumber: body.PhoneNumber,
		Email:       body.Email,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBUserToRest(user),
	})
}

type UpdatePasswordRequest struct {
	OldPassword string `json:"old_password" validate:"required,min=6" example:"oldpassword123"`
	NewPassword string `json:"new_password" validate:"required,min=6" example:"newpassword123"`
}

// UpdatePassword godoc
//
//	@Summary		Update the currently authenticated user's password (Admin)
//	@Description	Update the currently authenticated user's password (Admin)
//	@Tags			Users
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body	UpdatePasswordRequest	true	"Update Password Request Body"
//	@Success		204		"Password updated successfully"
//	@Failure		400		{object}	lib.HTTPError	"Error occurred when updating password"
//	@Failure		401		{object}	string			"Invalid or absent authentication token"
//	@Failure		404		{object}	lib.HTTPError	"User not found"
//	@Failure		422		{object}	lib.HTTPError	"Validation error occurred"
//	@Failure		500		{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/users/me/password [patch]
func (h *UserHandler) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.UserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body UpdatePasswordRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	_, err := h.service.UpdatePassword(r.Context(), services.UpdateUserPasswordInput{
		UserID:      currentUser.ID,
		OldPassword: body.OldPassword,
		NewPassword: body.NewPassword,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email" example:"user@example.com"`
}

// ForgotPassword godoc
//
//	@Summary		Send forgot password reset link to user (Admin)
//	@Description	Send forgot password reset link to user (Admin)
//	@Tags			Users
//	@Accept			json
//	@Param			body	body	ForgotPasswordRequest	true	"Forgot Password Request Body"
//	@Success		204		"Reset link sent successfully"
//	@Failure		400		{object}	lib.HTTPError	"Error occurred when sending reset link"
//	@Failure		404		{object}	lib.HTTPError	"User not found"
//	@Failure		500		{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/users/forgot-password [post]
func (h *UserHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var body ForgotPasswordRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	_, err := h.service.SendForgotPasswordResetLink(r.Context(), body.Email)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type UserResetPasswordRequest struct {
	NewPassword string `json:"new_password" validate:"required,min=6" example:"newpassword123"`
}

// ResetPassword godoc
//
//	@Summary		Reset user password (Admin)
//	@Description	Reset user password using the reset token from the forgot-password email (Admin)
//	@Tags			Users
//	@Accept			json
//	@Security		BearerAuth
//	@Param			body	body	UserResetPasswordRequest	true	"Reset Password Request Body"
//	@Success		204		"Password reset successfully"
//	@Failure		400		{object}	lib.HTTPError	"Error occurred when resetting password"
//	@Failure		401		{object}	string			"Invalid or absent authentication token"
//	@Failure		500		{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/users/reset-password [post]
func (h *UserHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.UserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body UserResetPasswordRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	_, err := h.service.ResetPassword(r.Context(), services.ResetUserPasswordInput{
		UserID:      currentUser.ID,
		NewPassword: body.NewPassword,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
