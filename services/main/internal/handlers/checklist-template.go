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

type ChecklistTemplateHandler struct {
	appCtx  pkg.AppContext
	service services.ChecklistTemplateService
}

func NewChecklistTemplateHandler(
	appCtx pkg.AppContext,
	service services.ChecklistTemplateService,
) ChecklistTemplateHandler {
	return ChecklistTemplateHandler{appCtx: appCtx, service: service}
}

type ListChecklistTemplatesQuery struct {
	lib.FilterQueryInput
}

// ListChecklistTemplates godoc
//
//	@Summary		List checklist templates
//	@Description	List all system-seeded checklist templates
//	@Tags			ChecklistTemplate
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			q	query		ListChecklistTemplatesQuery	true	"Filters"
//	@Success		200	{object}	object{data=object{rows=[]transformations.OutputChecklistTemplate,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400	{object}	lib.HTTPError
//	@Failure		401	{object}	string
//	@Failure		422	{object}	lib.HTTPError
//	@Failure		500	{object}	string
//	@Router			/api/v1/admin/checklist-templates [get]
func (h *ChecklistTemplateHandler) ListChecklistTemplates(w http.ResponseWriter, r *http.Request) {
	filterQuery, filterQueryErr := lib.GenerateQuery(r.URL.Query())
	if filterQueryErr != nil {
		HandleErrorResponse(w, filterQueryErr)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, filterQuery, w) {
		return
	}

	templates, err := h.service.ListChecklistTemplates(r.Context(), *filterQuery)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	count, countErr := h.service.CountChecklistTemplates(r.Context(), *filterQuery)
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	result := make([]any, 0, len(*templates))
	for _, t := range *templates {
		result = append(result, transformations.DBChecklistTemplateToRest(&t))
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, result, count))
}

// GetChecklistTemplate godoc
//
//	@Summary		Get checklist template
//	@Description	Get a single checklist template by ID
//	@Tags			ChecklistTemplate
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			template_id	path		string	true	"Template ID"
//	@Success		200			{object}	object{data=transformations.OutputChecklistTemplate}
//	@Failure		401			{object}	string
//	@Failure		404			{object}	lib.HTTPError
//	@Failure		500			{object}	string
//	@Router			/api/v1/admin/checklist-templates/{template_id} [get]
func (h *ChecklistTemplateHandler) GetChecklistTemplate(w http.ResponseWriter, r *http.Request) {
	templateID := chi.URLParam(r, "template_id")

	tmpl, err := h.service.GetChecklistTemplate(r.Context(), templateID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": transformations.DBChecklistTemplateToRest(tmpl)})
}
