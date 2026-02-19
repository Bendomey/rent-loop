package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type DocumentHandler struct {
	service services.DocumentService
	appCtx  pkg.AppContext
}

func NewDocumentHandler(appCtx pkg.AppContext, service services.DocumentService) DocumentHandler {
	return DocumentHandler{service, appCtx}
}

type CreateDocumentRequest struct {
	Title      string    `json:"title"                 validate:"required"        example:"Lease Agreement"`
	Content    string    `json:"content"               validate:"required,json"`
	Size       int64     `json:"size"                  validate:"required"        example:"2048"`
	Tags       *[]string `json:"tags"                  validate:"omitempty,dive"  example:"LEASE_AGREEMENT,INSPECTION_REPORT"`
	PropertyID *string   `json:"property_id,omitempty" validate:"omitempty,uuid4" example:"550e8400-e29b-41d4-a716-446655440000"`
}

// CreateDocument godoc
//
//	@Summary		Create a new document
//	@Description	Create a new document
//	@Tags			Documents
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body		CreateDocumentRequest								true	"Document details"
//	@Success		201		{object}	object{data=transformations.OutputAdminDocument}	"Document created successfully"
//	@Failure		400		{object}	lib.HTTPError
//	@Failure		401		{object}	string
//	@Failure		500		{object}	string
//	@Router			/api/v1/documents [post]
func (h *DocumentHandler) CreateDocument(w http.ResponseWriter, r *http.Request) {
	currentUser, currentUserOk := lib.ClientUserFromContext(r.Context())

	if !currentUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreateDocumentRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)

	if !isPassedValidation {
		return
	}

	var contentData map[string]interface{}
	if marshalErr := json.Unmarshal([]byte(body.Content), &contentData); marshalErr != nil {
		http.Error(w, "Invalid JSON format in content field", http.StatusUnprocessableEntity)
		return
	}

	document, err := h.service.Create(r.Context(), services.CreateDocumentInput{
		Title:        body.Title,
		Content:      contentData,
		Size:         body.Size,
		Tags:         body.Tags,
		PropertyID:   body.PropertyID,
		ClientUserID: currentUser.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminDocumentToRestDocument(document),
	})
}

type UpdateDocumentRequest struct {
	Title      *string   `json:"title,omitempty"       validate:"omitempty"       example:"Updated Lease Agreement"`
	Content    *string   `json:"content,omitempty"     validate:"omitempty,json"`
	Size       *int64    `json:"size,omitempty"        validate:"omitempty,min=1" example:"3072"`
	Tags       *[]string `json:"tags,omitempty"        validate:"omitempty,dive"  example:"LEASE_AGREEMENT,INSPECTION_REPORT"`
	PropertyID *string   `json:"property_id,omitempty" validate:"omitempty,uuid4" example:"550e8400-e29b-41d4-a716-446655440000"`
}

// UpdateDocument godoc
//
//	@Summary		Update an existing document
//	@Description	Update an existing document
//	@Tags			Documents
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			document_id	path		string												true	"Document ID"	format(uuid4)
//	@Param			body		body		UpdateDocumentRequest								true	"Document details"
//	@Success		200			{object}	object{data=transformations.OutputAdminDocument}	"Document Updated successfully"
//	@Failure		400			{object}	lib.HTTPError
//	@Failure		401			{object}	string
//	@Failure		500			{object}	string
//	@Router			/api/v1/documents/{document_id} [patch]
func (h *DocumentHandler) UpdateDocument(w http.ResponseWriter, r *http.Request) {
	currentUser, currentUserOk := lib.ClientUserFromContext(r.Context())

	if !currentUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body UpdateDocumentRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)

	if !isPassedValidation {
		return
	}

	documentID := chi.URLParam(r, "document_id")

	var contentData *map[string]interface{} = nil
	if body.Content != nil {
		if marshalErr := json.Unmarshal([]byte(*body.Content), &contentData); marshalErr != nil {
			http.Error(w, "Invalid JSON format in content field", http.StatusUnprocessableEntity)
			return
		}
	}

	document, err := h.service.Update(r.Context(), services.UpdateDocumentInput{
		DocumentID:   documentID,
		Title:        body.Title,
		Content:      contentData,
		Size:         body.Size,
		Tags:         body.Tags,
		PropertyID:   body.PropertyID,
		ClientUserID: currentUser.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminDocumentToRestDocument(document),
	})
}

// DeleteDocument godoc
//
//	@Summary		Delete a document
//	@Description	Delete a document
//	@Tags			Documents
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			document_id	path		string	true	"Document ID"
//	@Success		204			{object}	nil
//	@Failure		400			{object}	lib.HTTPError
//	@Failure		401			{object}	string
//	@Failure		500			{object}	string
//	@Router			/api/v1/documents/{document_id} [delete]
func (h *DocumentHandler) DeleteDocument(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "document_id")

	err := h.service.Delete(r.Context(), documentID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type GetDocumentWithPopulateQuery struct {
	lib.GetOneQueryInput
}

// GetDocumentById godoc
//
//	@Summary		Get document by ID
//	@Description	Get document by ID
//	@Tags			Documents
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			document_id	path		string							true	"Document ID"
//	@Param			q			query		GetDocumentWithPopulateQuery	true	"Client user"
//	@Success		200			{object}	object{data=transformations.OutputAdminDocument}
//	@Failure		400			{object}	lib.HTTPError
//	@Failure		401			{object}	string
//	@Failure		500			{object}	string
//	@Router			/api/v1/documents/{document_id} [get]
func (h *DocumentHandler) GetDocumentById(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "document_id")

	populateFields := GetPopulateFields(r)

	filterQuery := repository.GetDocumentWithPopulateFilter{
		ID:       documentID,
		Populate: populateFields,
	}

	document, err := h.service.GetByIDWithPopulate(r.Context(), filterQuery)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminDocumentToRestDocument(document),
	})
}

type ListDocumentsFilterRequest struct {
	lib.FilterQueryInput
	PropertyID             *string   `json:"property_id"              validate:"omitempty,uuid4"      example:"550e8400-e29b-41d4-a716-446655440000"`
	PropertySlug           *string   `json:"property_slug"            validate:"omitempty"            example:"downtown-apartment-101"`
	OnlyGlobalDocuments    *bool     `json:"only_global_documents"    validate:"omitempty"            example:"true"                                 description:"Filter for documents without a property"`
	IncludeGlobalDocuments *bool     `json:"include_global_documents" validate:"omitempty"            example:"true"                                 description:"Include global documents along with property-specific documents"`
	Tags                   *[]string `json:"tags"                     validate:"omitempty,dive"       example:"LEASE_AGREEMENT,INSPECTION_REPORT"`
	IDs                    []string  `json:"ids"                      validate:"omitempty,dive,uuid4" example:"a8098c1a-f86e-11da-bd1a-00112444be1e" description:"List of document IDs to filter by"                               collectionFormat:"multi"`
}

// GetDocuments godoc
//
//	@Summary		Get all documents
//	@Description	Get all documents
//	@Tags			Documents
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			q	query		ListDocumentsFilterRequest	true	"Documents"
//	@Success		200	{object}	object{data=object{rows=[]transformations.OutputAdminDocument,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400	{object}	lib.HTTPError
//	@Failure		401	{object}	string
//	@Failure		500	{object}	string
//	@Router			/api/v1/documents [get]
func (h *DocumentHandler) ListDocuments(w http.ResponseWriter, r *http.Request) {
	currentUser, currentUserOk := lib.ClientUserFromContext(r.Context())

	if !currentUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	filters := ListDocumentsFilterRequest{
		PropertyID:             lib.NullOrString(r.URL.Query().Get("property_id")),
		PropertySlug:           lib.NullOrString(r.URL.Query().Get("property_slug")),
		OnlyGlobalDocuments:    lib.NullOrBool(r.URL.Query().Get("only_global_documents")),
		IncludeGlobalDocuments: lib.NullOrBool(r.URL.Query().Get("include_global_documents")),
		Tags:                   lib.NullOrStringArray(r.URL.Query()["tags"]),
		IDs:                    r.URL.Query()["ids"],
	}

	isFiltersPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filters, w)
	if !isFiltersPassedValidation {
		return
	}

	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		HandleErrorResponse(w, filterErr)
		return
	}

	isFilterQueryPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFilterQueryPassedValidation {
		return
	}

	input := repository.ListDocumentsFilter{
		PropertyID:             filters.PropertyID,
		PropertySlug:           filters.PropertySlug,
		OnlyGlobalDocuments:    filters.OnlyGlobalDocuments,
		IncludeGlobalDocuments: filters.IncludeGlobalDocuments,
		ClientID:               currentUser.ClientID,
		Tags:                   filters.Tags,
		IDs:                    lib.NullOrStringArray(filters.IDs),
	}

	documents, documentsErr := h.service.List(r.Context(), *filterQuery, input)

	if documentsErr != nil {
		HandleErrorResponse(w, documentsErr)
		return
	}

	count, countsErr := h.service.Count(r.Context(), *filterQuery, input)

	if countsErr != nil {
		HandleErrorResponse(w, countsErr)
		return
	}

	documentsTransformed := make([]interface{}, 0)
	for _, document := range documents {
		documentsTransformed = append(
			documentsTransformed,
			transformations.DBAdminDocumentToRestDocument(&document),
		)
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, documentsTransformed, count))
}
