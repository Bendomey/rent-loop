package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type PaymentHandler struct {
	appCtx  pkg.AppContext
	service services.PaymentService
}

func NewPaymentHandler(appCtx pkg.AppContext, service services.PaymentService) PaymentHandler {
	return PaymentHandler{appCtx: appCtx, service: service}
}

type CreateOfflinePaymentRequest struct {
	PaymentAccountID string          `json:"payment_account_id" validate:"required,uuid4"                       example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b" description:"ID of the payment account used"`
	InvoiceID        string          `json:"invoice_id"         validate:"required,uuid4"                       example:"b50874ee-1a70-436e-ba24-572078895982" description:"ID of the invoice being paid"`
	Provider         string          `json:"provider"           validate:"required,oneof=MTN VODAFONE AIRTELTIGO PAYSTACK BANK_API CASH" example:"CASH"                                description:"Offline payment provider/method"`
	Amount           int64           `json:"amount"             validate:"required,gt=0"                        example:"100000"                              description:"Payment amount in smallest currency unit"`
	Reference        *string         `json:"reference,omitempty"                                                  example:"RCP-2024-001"                        description:"Optional reference number for the payment"`
	Metadata         *map[string]any `json:"metadata,omitempty"                                                                                                 description:"Additional metadata for the payment"`
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
