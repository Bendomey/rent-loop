package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type WaitlistHandler struct {
	service services.WaitlistService
	appCtx  pkg.AppContext
}

func NewWaitlistHandler(appCtx pkg.AppContext, service services.WaitlistService) WaitlistHandler {
	return WaitlistHandler{service, appCtx}
}

type CreateWaitlistEntryRequest struct {
	FullName    string `json:"full_name"    validate:"required"        example:"John Doe"`
	PhoneNumber string `json:"phone_number" validate:"required"        example:"+233201234567"`
	Email       string `json:"email"        validate:"omitempty,email" example:"john@example.com"`
}

// CreateWaitlistEntry godoc
//
//	@Summary		Join waitlist
//	@Description	Submit an entry to the Rentloop waitlist
//	@Tags			Waitlist
//	@Accept			json
//	@Produce		json
//	@Param			body	body		CreateWaitlistEntryRequest	true	"Waitlist entry"
//	@Success		201		{object}	object{data=object{full_name=string,phone_number=string,email=string}}
//	@Failure		400		{object}	lib.HTTPError
//	@Failure		422		{object}	string
//	@Failure		500		{object}	string
//	@Router			/api/v1/waitlist [post]
func (h *WaitlistHandler) CreateWaitlistEntry(w http.ResponseWriter, r *http.Request) {
	var body CreateWaitlistEntryRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	var email *string
	if body.Email != "" {
		email = &body.Email
	}

	entry, err := h.service.CreateWaitlistEntry(r.Context(), services.CreateWaitlistEntryInput{
		FullName:    body.FullName,
		PhoneNumber: body.PhoneNumber,
		Email:       email,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": map[string]any{
			"full_name":    entry.FullName,
			"phone_number": entry.PhoneNumber,
			"email":        entry.Email,
		},
	})
}
