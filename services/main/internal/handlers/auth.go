package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type AuthHandler struct {
	appCtx  pkg.AppContext
	service services.AuthService
}

func NewAuthHandler(appCtx pkg.AppContext, service services.AuthService) AuthHandler {
	return AuthHandler{appCtx: appCtx, service: service}
}

type AuthCodeRequest struct {
	Channel []string `json:"channel" validate:"required,min=1,dive,oneof=EMAIL SMS" example:"EMAIL,SMS"         description:"Channels to send verification code"`
	Email   *string  `json:"email"   validate:"omitempty,email"                     example:"email@example.com" description:"Email address"`
	Phone   *string  `json:"phone"   validate:"omitempty,e164"                      example:"+233281234569"     description:"Phone number"`
}

// SendCode godoc
//
//	@Summary		Send verification code
//	@Description	Send verification code
//	@Tags			Auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		AuthCodeRequest	true	"Auth code request body"
//	@Success		204		{object}	nil				"No Content"
//	@Failure		400		{object}	lib.HTTPError	"Error occurred when sending verification code"
//	@Failure		422		{object}	lib.HTTPError	"Validation error"
//	@Failure		500		{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/auth/codes [post]
func (h *AuthHandler) SendCode(w http.ResponseWriter, r *http.Request) {
	var body AuthCodeRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := services.SendCodeInput{
		Channel: body.Channel,
		Email:   body.Email,
		Phone:   body.Phone,
	}

	err := h.service.SendCode(r.Context(), input)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type VerifyCodeRequest struct {
	Code  string  `json:"code"  validate:"required,len=6"  example:"123456"            description:"Verification code"`
	Email *string `json:"email" validate:"omitempty,email" example:"email@example.com" description:"Email address"`
	Phone *string `json:"phone" validate:"omitempty,e164"  example:"+233281234569"     description:"Phone number"`
}

// VerifyCode godoc
//
//	@Summary		Verify verification code
//	@Description	Verify verification code
//	@Tags			Auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		VerifyCodeRequest	true	"Verify code request body"
//	@Success		204		{object}	nil					"No Content"
//	@Failure		400		{object}	lib.HTTPError		"Error occurred when verifying verification code"
//	@Failure		422		{object}	lib.HTTPError		"Validation error"
//	@Failure		500		{object}	string				"An unexpected error occurred"
//	@Router			/api/v1/auth/codes/verify [post]
func (h *AuthHandler) VerifyCode(w http.ResponseWriter, r *http.Request) {
	var body VerifyCodeRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := services.VerifyCodeInput{
		Code:  body.Code,
		Email: body.Email,
		Phone: body.Phone,
	}

	err := h.service.VerifyCode(r.Context(), input)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// --- Tenant mobile auth ---

type SendTenantCodeRequest struct {
	Phone string `json:"phone" validate:"required,e164" example:"+233281234569" description:"Phone number"`
}

// SendTenantCode godoc
//
//	@Summary		Send tenant OTP
//	@Description	Send a 6-digit OTP to the phone number. Phone must belong to an existing tenant account.
//	@Tags			Auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		SendTenantCodeRequest	true	"Send tenant code request body"
//	@Success		204		{object}	nil						"No Content"
//	@Failure		400		{object}	lib.HTTPError			"Bad request"
//	@Failure		404		{object}	lib.HTTPError			"Tenant not found"
//	@Failure		422		{object}	lib.HTTPError			"Validation error"
//	@Failure		500		{object}	string					"An unexpected error occurred"
//	@Router			/api/v1/tenant-accounts/auth/codes [post]
func (h *AuthHandler) SendTenantCode(w http.ResponseWriter, r *http.Request) {
	var body SendTenantCodeRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	if err := h.service.SendTenantCode(r.Context(), body.Phone); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type VerifyTenantCodeRequest struct {
	Phone             string  `json:"phone"              validate:"required,e164"  example:"+233281234569" description:"Phone number"`
	Code              string  `json:"code"               validate:"required,len=6" example:"123456"        description:"Verification code"`
	NotificationToken *string `json:"notification_token" validate:"omitempty"      example:"fcm-token-abc" description:"FCM/device push notification token"`
}

type VerifyTenantCodeResponse struct {
	Token         string `json:"token"`
	TenantAccount any    `json:"tenant_account"`
}

// VerifyTenantCode godoc
//
//	@Summary		Verify tenant OTP
//	@Description	Verify the OTP and return a JWT for the tenant account on success.
//	@Tags			Auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		VerifyTenantCodeRequest		true	"Verify tenant code request body"
//	@Success		200		{object}	VerifyTenantCodeResponse	"JWT token"
//	@Failure		400		{object}	lib.HTTPError				"Invalid code"
//	@Failure		422		{object}	lib.HTTPError				"Validation error"
//	@Failure		500		{object}	string						"An unexpected error occurred"
//	@Router			/api/v1/tenant-accounts/auth/codes/verify [post]
func (h *AuthHandler) VerifyTenantCode(w http.ResponseWriter, r *http.Request) {
	var body VerifyTenantCodeRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	result, err := h.service.VerifyTenantCode(r.Context(), services.VerifyTenantCodeInput{
		Code:              body.Code,
		Phone:             body.Phone,
		NotificationToken: body.NotificationToken,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	if encodeErr := json.NewEncoder(w).Encode(VerifyTenantCodeResponse{
		Token:         result.Token,
		TenantAccount: transformations.DBTenantAccountToRest(result.TenantAccount),
	}); encodeErr != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
