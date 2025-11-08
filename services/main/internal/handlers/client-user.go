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

type ClientUserHandler struct {
	service services.ClientUserService
	appCtx  pkg.AppContext
}

func NewClientUserHandler(
	appCtx pkg.AppContext,
	service services.ClientUserService,
) ClientUserHandler {
	return ClientUserHandler{service, appCtx}
}

type CreateClientUserRequest struct {
	Name  string `json:"name"  validate:"required,min=2"             example:"John Doe"`
	Email string `json:"email" validate:"required,email"             example:"client-user@example.com"`
	Phone string `json:"phone" validate:"required,e164"              example:"+233281234569"`
	Role  string `json:"role"  validate:"required,oneof=ADMIN STAFF" example:"ADMIN"`
}

// CreateClientUser godoc
//
//	@Summary		Creates new client user
//	@Description	Create a new client user
//	@Tags			ClientUsers
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body		CreateClientUserRequest							true	"Create Client User Request Body"
//	@Success		201		{object}	object{data=transformations.OutputClientUser}	"Client user created successfully"
//	@Failure		400		{object}	lib.HTTPError									"Error occurred when creating a client user"
//	@Failure		401		{object}	string											"Invalid or absent authentication token"
//	@Failure		500		{object}	string											"An unexpected error occurred"
//	@Router			/api/v1/client-users [post]
func (h *ClientUserHandler) CreateClientUser(w http.ResponseWriter, r *http.Request) {
	currentClientUser, currentClientUserOk := lib.ClientUserFromContext(r.Context())

	if !currentClientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreateClientUserRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)

	if !isPassedValidation {
		return
	}

	clientUser, err := h.service.CreateClientUser(r.Context(), services.CreateClientUserInput{
		Name:        body.Name,
		Email:       body.Email,
		Phone:       body.Phone,
		Role:        body.Role,
		ClientID:    currentClientUser.ClientID,
		CreatedByID: currentClientUser.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBClientUserToRest(clientUser),
	})
}

type LoginClientUserRequest struct {
	Email    string `json:"email"    validate:"required,email" example:"client-user@example.com"`
	Password string `json:"password" validate:"required,min=6" example:"password123"`
}

// AuthenticateClientUser godoc
//
//	@Summary		Authenticates client user and returns token
//	@Description	Authenticate client user and returns client user and token
//	@Tags			ClientUsers
//	@Accept			json
//	@Produce		json
//	@Param			body	body		LoginClientUserRequest									true	"Client user login credentials"
//	@Success		200		{object}	object{data=transformations.OutputClientUserWithToken}	"Client user authenticated successfully"
//	@Failure		400		{object}	lib.HTTPError											"Error occurred when authenticating a client user"
//	@Failure		500		{object}	string													"An unexpected error occurred"
//	@Router			/api/v1/client-users/login [post]
func (h *ClientUserHandler) AuthenticateClientUser(w http.ResponseWriter, r *http.Request) {
	var body LoginClientUserRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)

	if !isPassedValidation {
		return
	}

	clientUserWithToken, err := h.service.AuthenticateClientUser(
		r.Context(),
		services.AuthenticateClientUserInput{
			Email:    body.Email,
			Password: body.Password,
		},
	)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBClientUserToRestWithToken(
			&clientUserWithToken.ClientUser,
			clientUserWithToken.Token,
		),
	})
}

// GetCurrentClientUser godoc
//
//	@Summary		Get the currently authenticated client user
//	@Description	Get the currently authenticated client user
//	@Tags			ClientUsers
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Success		200	{object}	object{data=transformations.OutputClientUser}
//	@Failure		400	{object}	lib.HTTPError
//	@Failure		401	{object}	string
//	@Failure		500	{object}	string
//	@Router			/api/v1/client-users/me [get]
func (h *ClientUserHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	currentClientUser, clientUserOk := lib.ClientUserFromContext(r.Context())

	if !clientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	clientUser, err := h.service.GetClientUser(r.Context(), currentClientUser.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBClientUserToRest(clientUser),
	})
}

type SendForgotPasswordResetLinkRequest struct {
	Email string `json:"email" validate:"required,email" example:"client-user@example.com"`
}

// SendForgotPasswordResetLink godoc
//
//	@Summary		Sends forgot password reset link to client user
//	@Description	Sends forgot password reset link to client user
//	@Tags			ClientUsers
//	@Accept			json
//	@Param			body	body	SendForgotPasswordResetLinkRequest	true	"Send Forgot Password Reset Link Request Body"
//	@Success		204		"Forgot password reset link sent successfully"
//	@Failure		400		{object}	lib.HTTPError	"Error occurred when sending forgot password reset link to client user"
//	@Failure		500		{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/client-users/forgot-password [post]
func (h *ClientUserHandler) SendForgotPasswordResetLink(w http.ResponseWriter, r *http.Request) {
	var body SendForgotPasswordResetLinkRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)

	if !isPassedValidation {
		return
	}

	_, err := h.service.SendForgotPasswordResetLink(r.Context(), body.Email)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type ResetPasswordRequest struct {
	NewPassword string `json:"newPassword" validate:"required,min=6" example:"newpassword123"`
}

// ResetClientUserPassword godoc
//
//	@Summary		Resets the password for a client user
//	@Description	Resets the password for a client user
//	@Tags			ClientUsers
//	@Accept			json
//	@Security		BearerAuth
//	@Param			body	body	ResetPasswordRequest	true	"Reset Password Request Body"
//	@Success		204		"Password reset successfully"
//	@Failure		400		{object}	lib.HTTPError	"Error occurred when resetting password for client user"
//	@Failure		500		{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/client-users/reset-password [post]
func (h *ClientUserHandler) ResetClientUserPassword(w http.ResponseWriter, r *http.Request) {
	currentClientUser, clientUserOk := lib.ClientUserFromContext(r.Context())

	if !clientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body ResetPasswordRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)

	if !isPassedValidation {
		return
	}

	_, err := h.service.ResetPassword(r.Context(), services.ResetClientUserPasswordInput{
		ID:          currentClientUser.ID,
		NewPassword: body.NewPassword,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type ListClientUsersFilterRequest struct {
	lib.FilterQueryInput
	Status string `json:"status" validate:"oneof=ClientUser.Status.Active ClientUser.Status.Inactive" example:"ClientUser.Status.Active"`
	Role   string `json:"role"   validate:"oneof=OWNER ADMIN STAFF"                                   example:"OWNER"`
}

// ListClientUsers godoc
//
//	@Summary		Get all client users
//	@Description	Get all client users
//	@Tags			ClientUsers
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			q	query		ListClientUsersFilterRequest	true	"Client users"
//	@Success		200	{object}	object{data=object{rows=[]transformations.OutputClientUser,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400	{object}	lib.HTTPError	"An error occurred while filtering client users"
//	@Failure		401	{object}	string			"Absent or invalid authentication token"
//	@Failure		500	{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/client-users [get]
func (h *ClientUserHandler) ListClientUsers(w http.ResponseWriter, r *http.Request) {
	currentClientUser, clientUserOk := lib.ClientUserFromContext(r.Context())
	if !clientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	filterQuery, filterQueryErr := lib.GenerateQuery(r.URL.Query())
	if filterQueryErr != nil {
		HandleErrorResponse(w, filterQueryErr)
		return
	}

	isFilterQueryPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFilterQueryPassedValidation {
		return
	}

	input := repository.ListClientUsersFilter{
		FilterQuery: *filterQuery,
		ClientID:    currentClientUser.ClientID,
		Status:      lib.NullOrString(r.URL.Query().Get("status")),
		Role:        lib.NullOrString(r.URL.Query().Get("role")),
	}

	clientUsers, clientUsersErr := h.service.ListClientUsers(r.Context(), input)
	if clientUsersErr != nil {
		HandleErrorResponse(w, clientUsersErr)
		return
	}

	clientUsersCount, clientUsersCountErr := h.service.CountClientUsers(r.Context(), input)
	if clientUsersCountErr != nil {
		HandleErrorResponse(w, clientUsersCountErr)
		return
	}

	clientUsersTransformed := make([]any, 0)
	for _, clientUser := range clientUsers {
		clientUsersTransformed = append(
			clientUsersTransformed,
			transformations.DBClientUserToRest(&clientUser),
		)
	}

	json.NewEncoder(w).
		Encode(lib.ReturnListResponse(filterQuery, clientUsersTransformed, clientUsersCount))
}

type GetClientUserWithPopulateQuery struct {
	lib.GetOneQueryInput
}

// @GetClientUserWithPopulate godoc
// @Summary		Get client user with populate
// @Description	Get client user with populate
// @Tags			ClientUsers
// @Accept			json
// @Security		BearerAuth
// @Produce		json
// @Param			client_user_id	path		string				true	"Client user ID"
// @Param			q				query		GetClientUserWithPopulateQuery	true	"Client user"
// @Success		200				{object}	object{data=transformations.OutputClientUser} "Client user retrieved successfully"
// @Failure		401				{object}	string			"Invalid or absent authentication token"
// @Failure		404				{object}	lib.HTTPError	"Client user not found"
// @Failure		500				{object}	string			"An unexpected error occurred"
// @Router			/api/v1/client-users/{client_user_id} [get]
func (c *ClientUserHandler) GetClientUserWithPopulate(w http.ResponseWriter, r *http.Request) {
	currentClientUser, clientUserOk := lib.ClientUserFromContext(r.Context())
	if !clientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	populateFields := GetPopulateFields(r)

	clientUserId := chi.URLParam(r, "client_user_id")

	query := repository.GetClientUserWithPopulateQuery{
		ID:       clientUserId,
		ClientID: currentClientUser.ClientID,
		Populate: populateFields,
	}
	clientUser, err := c.service.GetClientUserWithPopulate(r.Context(), query)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBClientUserToRest(clientUser),
	})
}
