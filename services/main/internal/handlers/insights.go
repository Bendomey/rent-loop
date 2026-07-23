package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type InsightsHandler struct {
	service services.InsightsService
	appCtx  pkg.AppContext
}

func NewInsightsHandler(appCtx pkg.AppContext, service services.InsightsService) InsightsHandler {
	return InsightsHandler{service: service, appCtx: appCtx}
}

type InsightsRiskPropertyOutput struct {
	PropertyID string `json:"property_id"`
	Name       string `json:"name"`
	Address    string `json:"address"`
	Value      int64  `json:"value"`
}

type InsightsRiskPropertiesOutput struct {
	Type       string                       `json:"type"`
	Properties []InsightsRiskPropertyOutput `json:"properties"`
}

// ListRiskProperties godoc
//
//	@Summary		List properties affected by an Insights risk category (Admin)
//	@Description	Per-property breakdown backing an Insights risk-summary modal: outstanding rent, leases expiring in the next 60 days, or open maintenance requests. Only properties with a non-zero value are returned, sorted descending.
//	@Tags			Insights
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			type		query		string										true	"Risk category"																			Enums(outstanding_rent, expiring_leases, maintenance)
//	@Param			property_id	query		[]string									false	"Property ID(s) to narrow results to; omit to see every property the caller can access"	collectionFormat(multi)
//	@Success		200			{object}	object{data=InsightsRiskPropertiesOutput}	"Affected properties"
//	@Failure		400			{object}	lib.HTTPError								"Missing or invalid type"
//	@Failure		401			{object}	string										"Invalid or absent authentication token"
//	@Failure		403			{object}	string										"Requested property_id is outside the caller's access scope"
//	@Failure		500			{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/insights/risk-properties [get]
func (h *InsightsHandler) ListRiskProperties(w http.ResponseWriter, r *http.Request) {
	riskType := services.RiskType(r.URL.Query().Get("type"))
	switch riskType {
	case services.RiskTypeOutstandingRent, services.RiskTypeExpiringLeases, services.RiskTypeMaintenance:
	default:
		http.Error(w, "InvalidRiskType", http.StatusBadRequest)
		return
	}

	propertyIDs, clientID, scopeOk := ResolvePropertyScopeFilter(w, r, h.appCtx)
	if !scopeOk {
		return
	}

	aggregates, err := h.service.ListRiskProperties(r.Context(), riskType, propertyIDs, clientID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	properties := make([]InsightsRiskPropertyOutput, len(aggregates))
	for i, agg := range aggregates {
		properties[i] = InsightsRiskPropertyOutput{
			PropertyID: agg.PropertyID,
			Name:       agg.PropertyName,
			Address:    agg.PropertyAddress,
			Value:      agg.Value,
		}
	}

	if encErr := json.NewEncoder(w).Encode(map[string]interface{}{
		"data": InsightsRiskPropertiesOutput{
			Type:       string(riskType),
			Properties: properties,
		},
	}); encErr != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}
