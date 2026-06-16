package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/dgrijalva/jwt-go"
)

type AnalyticsHandler struct {
	appCtx        pkg.AppContext
	clientService services.ClientService
}

func NewAnalyticsHandler(appCtx pkg.AppContext, clientService services.ClientService) AnalyticsHandler {
	return AnalyticsHandler{appCtx: appCtx, clientService: clientService}
}

type analyticsTokenResponse struct {
	Token string `json:"token"`
}

// GetAnalyticsToken godoc
//
//	@Summary		Get Cube.js analytics token
//	@Description	Returns a signed JWT for querying the Cube.js analytics API. The token is scoped to the authenticated client.
//	@Tags			Analytics
//	@Produce		json
//	@Param			currency	query	string	false	"Reporting currency override (e.g. GHS, USD). Defaults to the client's configured currency."
//	@Security		BearerAuth
//	@Success		200	{object}	object{data=analyticsTokenResponse}	"Signed Cube.js JWT"
//	@Failure		400	{object}	string								"Unsupported currency"
//	@Failure		401	{object}	string								"Unauthorized"
//	@Failure		500	{object}	string								"Failed to generate token"
//	@Router			/api/v1/admin/clients/{client_id}/analytics/token [get]
func (h *AnalyticsHandler) GetToken(w http.ResponseWriter, r *http.Request) {
	clientCtx, ok := lib.ClientUserFromContext(r.Context())
	if !ok || clientCtx == nil {
		http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
		return
	}

	var reportingCurrency string
	if currencyParam := r.URL.Query().Get("currency"); currencyParam != "" {
		if !lib.IsSupportedCurrency(currencyParam) {
			http.Error(w, "UnsupportedCurrency", http.StatusBadRequest)
			return
		}
		reportingCurrency = currencyParam
	} else {
		client, err := h.clientService.GetClient(r.Context(), clientCtx.ClientID)
		if err != nil {
			http.Error(w, "Failed to load client", http.StatusInternalServerError)
			return
		}
		reportingCurrency = client.Currency
	}

	now := time.Now()
	claims := jwt.MapClaims{
		// Cube.js reads the security context from the "u" key
		"u": map[string]interface{}{
			"clientId":          clientCtx.ClientID,
			"reportingCurrency": reportingCurrency,
		},
		"iat": now.Unix(),
		"exp": now.Add(time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(h.appCtx.Config.CubeApiSecret))
	if err != nil {
		http.Error(w, "Failed to generate analytics token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if encErr := json.NewEncoder(w).Encode(map[string]interface{}{
		"data": analyticsTokenResponse{Token: signed},
	}); encErr != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}
