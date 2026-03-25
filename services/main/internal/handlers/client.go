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

type ClientHandler interface {
	UpdateClient(w http.ResponseWriter, r *http.Request)
}

type clientHandler struct {
	appCtx  pkg.AppContext
	service services.ClientService
}

func NewClientHandler(appCtx pkg.AppContext, service services.ClientService) ClientHandler {
	return &clientHandler{appCtx, service}
}

type UpdateClientRequest struct {
	Type               *string              `json:"type"                validate:"omitempty,oneof=INDIVIDUAL COMPANY"`
	SubType            *string              `json:"sub_type"            validate:"omitempty,oneof=LANDLORD PROPERTY_MANAGER DEVELOPER AGENCY"`
	Name               *string              `json:"name"                validate:"omitempty,min=2"`
	Description        lib.Optional[string] `json:"description"         validate:"omitempty,max=500"  swaggertype:"string"`
	RegistrationNumber lib.Optional[string] `json:"registration_number"                               swaggertype:"string"`
	WebsiteUrl         lib.Optional[string] `json:"website_url"         validate:"omitempty,url"       swaggertype:"string"`
	SupportPhone       lib.Optional[string] `json:"support_phone"                                     swaggertype:"string"`
	SupportEmail       lib.Optional[string] `json:"support_email"       validate:"omitempty,email"     swaggertype:"string"`
}

// UpdateClient godoc
//
//	@Summary		Update client details
//	@Description	Update the client's type, sub type, or company details
//	@Tags			Clients
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			client_id	path		string				true	"Client ID"
//	@Param			body		body		UpdateClientRequest	true	"Update Client Request Body"
//	@Success		200			{object}	object{data=transformations.OutputClient}
//	@Failure		400			{object}	lib.HTTPError	"Error occurred when updating client"
//	@Failure		401			{object}	string			"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError	"Client not found"
//	@Failure		422			{object}	lib.HTTPError	"Validation error occurred"
//	@Failure		500			{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id} [patch]
func (h *clientHandler) UpdateClient(w http.ResponseWriter, r *http.Request) {
	currentClientUser, currentClientUserOk := lib.ClientUserFromContext(r.Context())
	if !currentClientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	clientID := chi.URLParam(r, "client_id")

	// Ensure users can only update their own client
	if clientID != currentClientUser.ClientID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var body UpdateClientRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := services.UpdateClientInput{
		ClientID:           clientID,
		Type:               body.Type,
		SubType:            body.SubType,
		Name:               body.Name,
		Description:        body.Description,
		RegistrationNumber: body.RegistrationNumber,
		WebsiteUrl:         body.WebsiteUrl,
		SupportPhone:       body.SupportPhone,
		SupportEmail:       body.SupportEmail,
	}
	// (Optional fields pass through as lib.Optional[string] — the service checks .IsSet)

	client, err := h.service.UpdateClient(r.Context(), input)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBClientToRestClient(client),
	})
}
