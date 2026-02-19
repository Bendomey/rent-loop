package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type SigningHandler struct {
	service services.SigningService
	appCtx  pkg.AppContext
}

func NewSigningHandler(appCtx pkg.AppContext, service services.SigningService) SigningHandler {
	return SigningHandler{service: service, appCtx: appCtx}
}

type GenerateTokenRequest struct {
	DocumentID          string  `json:"document_id"           validate:"required,uuid4"`
	Role                string  `json:"role"                  validate:"required,oneof=TENANT PM_WITNESS TENANT_WITNESS"`
	TenantApplicationID *string `json:"tenant_application_id" validate:"omitempty,uuid4"`
	LeaseID             *string `json:"lease_id"              validate:"omitempty,uuid4"`
	SignerName          *string `json:"signer_name"           validate:"omitempty"`
	SignerEmail         *string `json:"signer_email"          validate:"omitempty,email"`
	SignerPhone         *string `json:"signer_phone"          validate:"omitempty"`
}

// GenerateToken godoc
//
//	@Summary		Generate a signing token
//	@Description	Generate a signing token for a document signer
//	@Tags			Signing
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body		GenerateTokenRequest									true	"Token details"
//	@Success		201		{object}	object{data=transformations.OutputAdminSigningToken}	"Token created successfully"
//	@Failure		400		{object}	lib.HTTPError
//	@Failure		401		{object}	string
//	@Failure		500		{object}	string
//	@Router			/api/v1/signing [post]
func (h *SigningHandler) GenerateToken(w http.ResponseWriter, r *http.Request) {
	currentUser, currentUserOk := lib.ClientUserFromContext(r.Context())
	if !currentUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body GenerateTokenRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	token, err := h.service.GenerateToken(r.Context(), services.GenerateTokenInput{
		DocumentID:          body.DocumentID,
		TenantApplicationID: body.TenantApplicationID,
		LeaseID:             body.LeaseID,
		Role:                body.Role,
		SignerName:          body.SignerName,
		SignerEmail:         body.SignerEmail,
		SignerPhone:         body.SignerPhone,
		CreatedByID:         currentUser.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminSigningTokenToRest(token),
	})
}

type VerifySigningTokenQuery struct {
	lib.GetOneQueryInput
}

// VerifyToken godoc
//
//	@Summary		Verify a signing token
//	@Description	Validate a signing token and return document + signer info
//	@Tags			Signing
//	@Produce		json
//	@Param			token	path		string											true	"Signing token"
//	@Param			q		query		VerifySigningTokenQuery							true	"Query parameters for token verification"
//	@Success		200		{object}	object{data=transformations.OutputSigningToken}	"Token verified successfully"
//	@Failure		400		{object}	lib.HTTPError
//	@Failure		404		{object}	lib.HTTPError
//	@Router			/api/v1/signing/{token}/verify [get]
func (h *SigningHandler) VerifyToken(w http.ResponseWriter, r *http.Request) {
	tokenStr := chi.URLParam(r, "token")

	populate := GetPopulateFields(r)

	token, err := h.service.VerifyToken(r.Context(), tokenStr, populate)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBSigningTokenToRest(token),
	})
}

type SignDocumentRequest struct {
	SignatureUrl string  `json:"signature_url" validate:"required,url"`
	SignerName   *string `json:"signer_name"   validate:"omitempty"`
}

// SignDocument godoc
//
//	@Summary		Submit a signature
//	@Description	Submit a signature for a document using a signing token
//	@Tags			Signing
//	@Accept			json
//	@Produce		json
//	@Param			token	path		string													true	"Signing token"
//	@Param			body	body		SignDocumentRequest										true	"Signature details"
//	@Success		201		{object}	object{data=transformations.OutputDocumentSignature}	"Signature created"
//	@Failure		400		{object}	lib.HTTPError
//	@Failure		404		{object}	lib.HTTPError
//	@Failure		500		{object}	string
//	@Router			/api/v1/signing/{token}/sign [post]
func (h *SigningHandler) SignDocument(w http.ResponseWriter, r *http.Request) {
	tokenStr := chi.URLParam(r, "token")

	var body SignDocumentRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	// Extract IP address from X-Forwarded-For or fallback to RemoteAddr
	ipAddress := r.Header.Get("X-Forwarded-For")
	if ipAddress != "" {
		// X-Forwarded-For can contain multiple IPs; take the first one
		ipAddress = strings.Split(ipAddress, ",")[0]
		ipAddress = strings.TrimSpace(ipAddress)
	} else {
		ipAddress = r.RemoteAddr
	}

	sig, err := h.service.SignDocument(r.Context(), services.SignDocumentInput{
		TokenStr:     tokenStr,
		SignatureUrl: body.SignatureUrl,
		SignerName:   body.SignerName,
		IPAddress:    ipAddress,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBDocumentSignatureToRest(sig),
	})
}

type SignDocumentPMRequest struct {
	DocumentID          string  `json:"document_id"           validate:"required,uuid4"`
	SignatureUrl        string  `json:"signature_url"         validate:"required,url"`
	TenantApplicationID *string `json:"tenant_application_id" validate:"omitempty,uuid4"`
	LeaseID             *string `json:"lease_id"              validate:"omitempty,uuid4"`
}

// SignDocumentPM godoc
//
//	@Summary		Submit a signature
//	@Description	Submit a signature for a document using tenant application or lease context (for PMs)
//	@Tags			Signing
//	@Accept			json
//	@Produce		json
//	@Param			body	body		SignDocumentPMRequest									true	"Signature details"
//	@Success		201		{object}	object{data=transformations.OutputDocumentSignature}	"Signature created"
//	@Failure		400		{object}	lib.HTTPError
//	@Failure		404		{object}	lib.HTTPError
//	@Failure		500		{object}	string
//	@Router			/api/v1/signing/direct [post]
func (h *SigningHandler) SignDocumentPM(w http.ResponseWriter, r *http.Request) {
	currentUser, currentUserOk := lib.ClientUserFromContext(r.Context())
	if !currentUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body SignDocumentPMRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	sig, err := h.service.SignDocumentByPM(r.Context(), services.SignDocumentPMInput{
		DocumentID:          body.DocumentID,
		SignatureUrl:        body.SignatureUrl,
		TenantApplicationID: body.TenantApplicationID,
		LeaseID:             body.LeaseID,
		SignedByID:          currentUser.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBDocumentSignatureToRest(sig),
	})
}
