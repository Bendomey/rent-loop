package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type SigningHandler struct {
	service  services.SigningService
	appCtx   pkg.AppContext
	services services.Services
}

func NewSigningHandler(appCtx pkg.AppContext, services services.Services) SigningHandler {
	return SigningHandler{service: services.SigningService, appCtx: appCtx, services: services}
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
//	@Summary		Generate a signing token (Admin)
//	@Description	Generate a signing token for a document signer (Admin)
//	@Tags			Signing
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body		GenerateTokenRequest									true	"Token details"
//	@Success		201		{object}	object{data=transformations.OutputAdminSigningToken}	"Token created successfully"
//	@Failure		400		{object}	lib.HTTPError
//	@Failure		401		{object}	string
//	@Failure		500		{object}	string
//	@Router			/api/v1/admin/signing [post]
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

type ListSigningTokensFilterRequest struct {
	lib.FilterQueryInput
	DocumentID          *string  `json:"document_id"           validate:"omitempty,uuid4"`
	TenantApplicationID *string  `json:"tenant_application_id" validate:"omitempty,uuid4"`
	LeaseID             *string  `json:"lease_id"              validate:"omitempty,uuid4"`
	Role                *string  `json:"role"                  validate:"omitempty,oneof=TENANT PM_WITNESS TENANT_WITNESS"`
	CreatedByID         *string  `json:"created_by_id"         validate:"omitempty,uuid4"`
	IDs                 []string `json:"ids"                   validate:"omitempty,dive,uuid4"`
}

// ListSigningTokens godoc
//
//	@Summary		List signing tokens (Admin)
//	@Description	List signing tokens with optional filters (Admin)
//	@Tags			Signing
//	@Produce		json
//	@Security		BearerAuth
//	@Param			q	query		ListSigningTokensFilterRequest	true	"Filter query"
//	@Success		200	{object}	object{data=object{rows=[]transformations.OutputAdminSigningToken,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400	{object}	lib.HTTPError
//	@Failure		401	{object}	string
//	@Failure		500	{object}	string
//	@Router			/api/v1/admin/signing-tokens [get]
func (h *SigningHandler) ListSigningTokens(w http.ResponseWriter, r *http.Request) {
	_, currentUserOk := lib.ClientUserFromContext(r.Context())
	if !currentUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	q := r.URL.Query()
	documentID := q.Get("document_id")
	tenantApplicationID := q.Get("tenant_application_id")
	leaseID := q.Get("lease_id")
	role := q.Get("role")
	createdByID := q.Get("created_by_id")

	filters := ListSigningTokensFilterRequest{
		IDs: q["ids"],
	}
	if documentID != "" {
		filters.DocumentID = &documentID
	}
	if tenantApplicationID != "" {
		filters.TenantApplicationID = &tenantApplicationID
	}
	if leaseID != "" {
		filters.LeaseID = &leaseID
	}
	if role != "" {
		filters.Role = &role
	}
	if createdByID != "" {
		filters.CreatedByID = &createdByID
	}

	if !lib.ValidateRequest(h.appCtx.Validator, filters, w) {
		return
	}

	filterQuery, filterErr := lib.GenerateQuery(q)
	if filterErr != nil {
		HandleErrorResponse(w, filterErr)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, filterQuery, w) {
		return
	}

	input := repository.ListSigningTokensFilter{
		DocumentID:          filters.DocumentID,
		TenantApplicationID: filters.TenantApplicationID,
		LeaseID:             filters.LeaseID,
		Role:                filters.Role,
		CreatedByID:         filters.CreatedByID,
		IDs:                 lib.NullOrStringArray(filters.IDs),
	}

	tokens, tokensErr := h.service.ListSigningTokens(r.Context(), *filterQuery, input)
	if tokensErr != nil {
		HandleErrorResponse(w, tokensErr)
		return
	}

	count, countErr := h.service.CountSigningTokens(r.Context(), *filterQuery, input)
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	rows := make([]interface{}, 0)
	for i := range *tokens {
		rows = append(rows, transformations.DBAdminSigningTokenToRest(&(*tokens)[i]))
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, count))
}

type UpdateSigningTokenRequest struct {
	SignerName  lib.Optional[string] `json:"signer_name"  validate:"omitempty"       swaggertype:"string" example:"Jane Doe"`
	SignerEmail lib.Optional[string] `json:"signer_email" validate:"omitempty,email" swaggertype:"string" example:"jane@example.com"`
	SignerPhone lib.Optional[string] `json:"signer_phone" validate:"omitempty"       swaggertype:"string" example:"+233201234567"`
}

// UpdateToken godoc
//
//	@Summary		Update a signing token (Admin)
//	@Description	Update signer details on a token that has not yet been used (Admin)
//	@Tags			Signing
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			signing_token_id	path		string						true	"Signing token ID"	format(uuid4)
//	@Param			body				body		UpdateSigningTokenRequest	true	"Signer details"
//	@Success		200					{object}	object{data=transformations.OutputAdminSigningToken}
//	@Failure		400					{object}	lib.HTTPError
//	@Failure		401					{object}	string
//	@Failure		404					{object}	lib.HTTPError
//	@Failure		500					{object}	string
//	@Router			/api/v1/admin/signing-tokens/{signing_token_id} [patch]
func (h *SigningHandler) UpdateToken(w http.ResponseWriter, r *http.Request) {
	_, currentUserOk := lib.ClientUserFromContext(r.Context())
	if !currentUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tokenID := chi.URLParam(r, "signing_token_id")

	var body UpdateSigningTokenRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	token, err := h.service.UpdateSigningTokenDetails(r.Context(), tokenID, services.UpdateSigningTokenDetailsInput{
		SignerName:  body.SignerName,
		SignerEmail: body.SignerEmail,
		SignerPhone: body.SignerPhone,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminSigningTokenToRest(token),
	})
}

// ResendToken godoc
//
//	@Summary		Resend a signing token (Admin)
//	@Description	Extend the token expiry by 7 days and resend the notification to the signer (Admin)
//	@Tags			Signing
//	@Security		BearerAuth
//	@Produce		json
//	@Param			signing_token_id	path		string	true	"Signing token ID"	format(uuid4)
//	@Success		200					{object}	object{data=transformations.OutputAdminSigningToken}
//	@Failure		400					{object}	lib.HTTPError
//	@Failure		401					{object}	string
//	@Failure		404					{object}	lib.HTTPError
//	@Failure		500					{object}	string
//	@Router			/api/v1/admin/signing-tokens/{signing_token_id}/resend [post]
func (h *SigningHandler) ResendToken(w http.ResponseWriter, r *http.Request) {
	_, currentUserOk := lib.ClientUserFromContext(r.Context())
	if !currentUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tokenID := chi.URLParam(r, "signing_token_id")

	token, err := h.service.ResendSigningToken(r.Context(), tokenID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminSigningTokenToRest(token),
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
//	@Summary		Submit a signature (Admin)
//	@Description	Submit a signature for a document using tenant application or lease context (for PMs) (Admin)
//	@Tags			Signing
//	@Accept			json
//	@Produce		json
//	@Param			body	body		SignDocumentPMRequest									true	"Signature details"
//	@Success		201		{object}	object{data=transformations.OutputDocumentSignature}	"Signature created"
//	@Failure		400		{object}	lib.HTTPError
//	@Failure		404		{object}	lib.HTTPError
//	@Failure		500		{object}	string
//	@Router			/api/v1/admin/signing/direct [post]
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
