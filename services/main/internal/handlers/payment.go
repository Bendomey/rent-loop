package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type PaymentHandler struct {
	appCtx   pkg.AppContext
	service  services.PaymentService
	services services.Services
}

func NewPaymentHandler(appCtx pkg.AppContext, services services.Services) PaymentHandler {
	return PaymentHandler{appCtx: appCtx, service: services.PaymentService, services: services}
}

type CreateOfflinePaymentRequest struct {
	PaymentAccountID string          `json:"payment_account_id"  validate:"required,uuid4"                                                example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b" description:"ID of the payment account used"`
	InvoiceID        string          `json:"invoice_id"          validate:"required,uuid4"                                                example:"b50874ee-1a70-436e-ba24-572078895982" description:"ID of the invoice being paid"`
	Provider         string          `json:"provider"            validate:"required,oneof=MTN VODAFONE AIRTELTIGO PAYSTACK BANK_API CASH" example:"CASH"                                 description:"Offline payment provider/method"`
	Amount           int64           `json:"amount"              validate:"required,gt=0"                                                 example:"100000"                               description:"Payment amount in smallest currency unit"`
	Reference        *string         `json:"reference,omitempty"                                                                          example:"RCP-2024-001"                         description:"Optional reference number for the payment"`
	Metadata         *map[string]any `json:"metadata,omitempty"                                                                                                                          description:"Additional metadata for the payment"`
}

// CreateOfflinePayment godoc
//
//	@Summary		Create an offline payment
//	@Description	Record an offline payment for an invoice. The payment will be created in PENDING status and requires verification by a property manager.
//	@Tags			Payments
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body		CreateOfflinePaymentRequest					true	"Create Offline Payment Request Body"
//	@Success		201		{object}	object{data=transformations.OutputPayment}	"Payment created successfully"
//	@Failure		400		{object}	lib.HTTPError								"Error occurred when creating payment"
//	@Failure		401		{object}	string										"Invalid or absent authentication token"
//	@Failure		422		{object}	lib.HTTPError								"Validation error"
//	@Failure		500		{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/payments/offline [post]
func (h *PaymentHandler) CreateOfflinePayment(w http.ResponseWriter, r *http.Request) {
	var body CreateOfflinePaymentRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	payment, err := h.service.CreateOfflinePayment(r.Context(), services.CreateOfflinePaymentInput{
		PaymentAccountID: body.PaymentAccountID,
		InvoiceID:        body.InvoiceID,
		Provider:         body.Provider,
		Amount:           body.Amount,
		Reference:        body.Reference,
		Metadata:         body.Metadata,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBPaymentToRest(payment),
	})
}

type VerifyPaymentRequest struct {
	IsSuccessful bool            `json:"is_successful"      validate:"required" example:"true" description:"Whether the payment was successful"`
	Metadata     *map[string]any `json:"metadata,omitempty"                                    description:"Additional verification metadata"`
}

// VerifyPayment godoc
//
//	@Summary		Verify an offline payment (Admin)
//	@Description	Mark a PENDING offline payment as SUCCESSFUL or FAILED. Updates the invoice status accordingly.
//	@Tags			Payments
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string										true	"Property ID"
//	@Param			payment_id	path		string										true	"Payment ID"
//	@Param			body		body		VerifyPaymentRequest						true	"Verify Payment Request Body"
//	@Success		200			{object}	object{data=transformations.OutputPayment}	"Payment verified"
//	@Failure		400			{object}	lib.HTTPError								"Invalid request or payment not verifiable"
//	@Failure		401			{object}	string										"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError								"Payment not found"
//	@Failure		422			{object}	lib.HTTPError								"Validation error"
//	@Failure		500			{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/admin/properties/{property_id}/payments/{payment_id}/verify [patch]
func (h *PaymentHandler) VerifyPayment(w http.ResponseWriter, r *http.Request) {
	clientUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	paymentID := chi.URLParam(r, "payment_id")

	var body VerifyPaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	payment, err := h.service.VerifyOfflinePayment(r.Context(), services.VerifyOfflinePaymentInput{
		PaymentID:    paymentID,
		VerifiedByID: clientUser.ID,
		IsSuccessful: body.IsSuccessful,
		Metadata:     body.Metadata,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBPaymentToRest(payment),
	})
}
