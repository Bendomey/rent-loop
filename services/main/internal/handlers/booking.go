package handlers

import (
	"encoding/json"
	"net/http"
	"slices"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type BookingHandler struct {
	appCtx               pkg.AppContext
	bookingService       services.BookingService
	unitDateBlockService services.UnitDateBlockService
	propertyService      services.PropertyService
	unitService          services.UnitService
}

func NewBookingHandler(appCtx pkg.AppContext, svcs services.Services) BookingHandler {
	return BookingHandler{
		appCtx:               appCtx,
		bookingService:       svcs.BookingService,
		unitDateBlockService: svcs.UnitDateBlockService,
		propertyService:      svcs.PropertyService,
		unitService:          svcs.UnitService,
	}
}

// ---- Request bodies ----

type CreateBookingRequest struct {
	UnitID         string    `json:"unit_id"          validate:"required,uuid4"`
	CheckInDate    time.Time `json:"check_in_date"    validate:"required"`
	CheckOutDate   time.Time `json:"check_out_date"   validate:"required"`
	Rate           int64     `json:"rate"             validate:"required,gt=0"`
	Notes          string    `json:"notes"`
	GuestFirstName string    `json:"guest_first_name" validate:"required"`
	GuestLastName  string    `json:"guest_last_name"  validate:"required"`
	GuestPhone     string    `json:"guest_phone"      validate:"required"`
	GuestEmail     *string   `json:"guest_email"      validate:"omitempty,email"`
	GuestGender    string    `json:"guest_gender"     validate:"required,oneof=MALE FEMALE"`
	GuestIDType    *string   `json:"guest_id_type"    validate:"omitempty"`
	GuestIDNumber  *string   `json:"guest_id_number"  validate:"omitempty"`
}

type CancelBookingRequest struct {
	Reason string `json:"reason" validate:"required"`
}

type CreateDateBlockRequest struct {
	StartDate time.Time `json:"start_date" validate:"required"`
	EndDate   time.Time `json:"end_date"   validate:"required"`
	BlockType string    `json:"block_type" validate:"required,oneof=MAINTENANCE PERSONAL OTHER"`
	Reason    string    `json:"reason"`
}

type PublicCreateBookingRequest struct {
	CheckInDate  time.Time `json:"check_in_date"  validate:"required"`
	CheckOutDate time.Time `json:"check_out_date" validate:"required"`
	FirstName    string    `json:"first_name"     validate:"required"`
	LastName     string    `json:"last_name"      validate:"required"`
	Phone        string    `json:"phone"          validate:"required"`
	Email        *string   `json:"email"          validate:"omitempty,email"`
	Gender       string    `json:"gender"         validate:"required,oneof=MALE FEMALE"`
	IDType       *string   `json:"id_type"        validate:"omitempty"`
	IDNumber     *string   `json:"id_number"      validate:"omitempty"`
}

// ---- Manager handlers ----

// CreateBooking godoc
//
//	@Summary	Create a booking (manager)
//	@Tags		Booking
//	@Accept		json
//	@Security	BearerAuth
//	@Produce	json
//
//	@Param		client_id	path		string					true	"Client ID"
//
//	@Param		property_id	path		string					true	"Property ID"
//	@Param		body		body		CreateBookingRequest	true	"Create booking request"
//	@Success	201			{object}	object{data=transformations.AdminOutputBooking}
//	@Failure	400			{object}	lib.HTTPError
//	@Failure	401			{object}	string
//	@Failure	500			{object}	string
//	@Router		/api/v1/admin/clients/{client_id}/properties/{property_id}/bookings [post]
func (h *BookingHandler) CreateBooking(w http.ResponseWriter, r *http.Request) {
	propertyID := chi.URLParam(r, "property_id")

	clientUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreateBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	property, propErr := h.propertyService.GetProperty(r.Context(), repository.GetPropertyQuery{ID: propertyID})
	if propErr != nil {
		HandleErrorResponse(w, propErr)
		return
	}

	// make sure property supports booking mode
	if !slices.Contains(property.Modes, "BOOKING") {
		http.Error(w, "this property does not support bookings", http.StatusBadRequest)
		return
	}

	unit, unitErr := h.unitService.GetUnitByID(r.Context(), body.UnitID)
	if unitErr != nil {
		HandleErrorResponse(w, unitErr)
		return
	}

	clientUserID := clientUser.ID
	booking, err := h.bookingService.CreateBooking(r.Context(), services.CreateBookingInput{
		UnitID:                body.UnitID,
		PropertyID:            propertyID,
		CheckInDate:           body.CheckInDate,
		CheckOutDate:          body.CheckOutDate,
		Rate:                  body.Rate,
		Currency:              unit.RentFeeCurrency,
		BookingSource:         "MANAGER",
		CreatedByClientUserID: &clientUserID,
		Notes:                 body.Notes,
		GuestFirstName:        body.GuestFirstName,
		GuestLastName:         body.GuestLastName,
		GuestPhone:            body.GuestPhone,
		GuestEmail:            body.GuestEmail,
		GuestIDNumber:         body.GuestIDNumber,
		GuestIDType:           body.GuestIDType,
		GuestGender:           body.GuestGender,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{"data": transformations.DBBookingToRest(booking)})
}

type ListBookingsFilterRequest struct {
	lib.FilterQueryInput
	Status *string `json:"status,omitempty"  validate:"omitempty,oneof=PENDING CONFIRMED CHECKED_IN CANCELLED" example:"PENDING"`
	UnitID *string `json:"unit_id,omitempty" validate:"omitempty,uuid4"                                        example:"550e8400-e29b-41d4-a716-446655440000"`
}

// ListBookings godoc
//
//	@Summary		List bookings for a property
//	@Description	Get a list of bookings for a property, with optional filtering by status. This endpoint is intended for manager use to view all bookings for their properties.
//	@Tags			Booking
//	@Security		BearerAuth
//	@Produce		json
//	@Param			q			query		ListBookingsFilterRequest	false	"Filters"
//
//	@Param			client_id	path		string						true	"Client ID"
//
//	@Param			property_id	path		string						true	"Property ID"
//	@Param			status		query		string						false	"Filter by status"
//	@Success		200			{object}	object{data=object{rows=[]transformations.AdminOutputBooking,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400			{object}	lib.HTTPError
//	@Failure		401			{object}	string
//	@Failure		500			{object}	string
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/bookings [get]
func (h *BookingHandler) ListBookings(w http.ResponseWriter, r *http.Request) {
	propertyID := chi.URLParam(r, "property_id")

	filters := ListBookingsFilterRequest{
		Status: lib.NullOrString(r.URL.Query().Get("status")),
		UnitID: lib.NullOrString(r.URL.Query().Get("unit_id")),
	}

	if !lib.ValidateRequest(h.appCtx.Validator, filters, w) {
		return
	}

	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		HandleErrorResponse(w, filterErr)
		return
	}

	input := repository.ListBookingsFilter{
		PropertyID: &propertyID,
		Status:     filters.Status,
		UnitID:     filters.UnitID,
	}

	bookings, listErr := h.bookingService.ListBookings(r.Context(), *filterQuery, input)
	if listErr != nil {
		HandleErrorResponse(w, listErr)
		return
	}

	count, countErr := h.bookingService.CountBookings(r.Context(), *filterQuery, input)
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	rows := make([]interface{}, len(bookings))
	for i := range bookings {
		rows[i] = transformations.DBBookingToRest(&bookings[i])
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, count))
}

// GetBooking godoc
//
//	@Summary		Get a booking by ID
//	@Description	Get a booking by ID. This endpoint is intended for manager use to view details of a specific booking for their properties. For tenants to view their own bookings, use the tenant-facing endpoint instead.
//	@Tags			Booking
//	@Security		BearerAuth
//	@Produce		json
//
//	@Param			client_id	path		string	true	"Client ID"
//
//	@Param			property_id	path		string	true	"Property ID"
//	@Param			booking_id	path		string	true	"Booking ID"
//	@Success		200			{object}	object{data=transformations.AdminOutputBooking}
//	@Failure		401			{object}	string
//	@Failure		404			{object}	lib.HTTPError
//	@Failure		500			{object}	string
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/bookings/{booking_id} [get]
func (h *BookingHandler) GetBooking(w http.ResponseWriter, r *http.Request) {
	bookingID := chi.URLParam(r, "booking_id")
	populateFields := GetPopulateFields(r)

	booking, err := h.bookingService.GetBooking(
		r.Context(),
		repository.GetBookingQuery{
			ID:       bookingID,
			Populate: populateFields,
		},
	)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": transformations.DBBookingToRest(booking)})
}

// ConfirmBooking godoc
//
//	@Summary	Confirm a pending booking
//	@Tags		Booking
//	@Security	BearerAuth
//	@Produce	json
//
//	@Param		client_id	path		string	true	"Client ID"
//	@Param		property_id	path		string	true	"Property ID"
//
//	@Param		booking_id	path		string	true	"Booking ID"
//	@Success	200			{object}	object{data=transformations.AdminOutputBooking}
//	@Failure	400			{object}	lib.HTTPError
//	@Failure	401			{object}	string
//	@Failure	500			{object}	string
//	@Router		/api/v1/admin/clients/{client_id}/properties/{property_id}/bookings/{booking_id}/confirm [put]
func (h *BookingHandler) ConfirmBooking(w http.ResponseWriter, r *http.Request) {
	bookingID := chi.URLParam(r, "booking_id")
	clientUser, _ := lib.ClientUserFromContext(r.Context())

	booking, err := h.bookingService.ConfirmBooking(r.Context(), services.ConfirmBookingInput{
		BookingID:    bookingID,
		ClientUserID: clientUser.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": transformations.DBBookingToRest(booking)})
}

// CheckInBooking godoc
//
//	@Summary	Mark a booking as checked in
//	@Tags		Booking
//	@Security	BearerAuth
//	@Produce	json
//	@Param		client_id	path		string	true	"Client ID"
//	@Param		property_id	path		string	true	"Property ID"
//	@Param		booking_id	path		string	true	"Booking ID"
//	@Success	200			{object}	object{data=transformations.AdminOutputBooking}
//	@Failure	400			{object}	lib.HTTPError
//	@Failure	401			{object}	string
//	@Failure	500			{object}	string
//	@Router		/api/v1/admin/clients/{client_id}/properties/{property_id}/bookings/{booking_id}/check-in [put]
func (h *BookingHandler) CheckInBooking(w http.ResponseWriter, r *http.Request) {
	bookingID := chi.URLParam(r, "booking_id")
	clientUser, _ := lib.ClientUserFromContext(r.Context())
	booking, err := h.bookingService.CheckInBooking(r.Context(), bookingID, clientUser.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": transformations.DBBookingToRest(booking)})
}

// CompleteBooking godoc
//
//	@Summary	Mark a booking as completed
//	@Tags		Booking
//	@Security	BearerAuth
//	@Produce	json
//	@Param		client_id	path		string	true	"Client ID"
//	@Param		property_id	path		string	true	"Property ID"
//	@Param		booking_id	path		string	true	"Booking ID"
//	@Success	200			{object}	object{data=transformations.AdminOutputBooking}
//	@Failure	400			{object}	lib.HTTPError
//	@Failure	401			{object}	string
//	@Failure	500			{object}	string
//	@Router		/api/v1/admin/clients/{client_id}/properties/{property_id}/bookings/{booking_id}/complete [put]
func (h *BookingHandler) CompleteBooking(w http.ResponseWriter, r *http.Request) {
	bookingID := chi.URLParam(r, "booking_id")
	clientUser, _ := lib.ClientUserFromContext(r.Context())

	booking, err := h.bookingService.CompleteBooking(r.Context(), bookingID, clientUser.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": transformations.DBBookingToRest(booking)})
}

// CancelBooking godoc
//
//	@Summary	Cancel a booking
//	@Tags		Booking
//	@Security	BearerAuth
//	@Accept		json
//	@Produce	json
//	@Param		client_id	path		string					true	"Client ID"
//	@Param		property_id	path		string					true	"Property ID"
//	@Param		booking_id	path		string					true	"Booking ID"
//	@Param		body		body		CancelBookingRequest	true	"Cancellation request"
//	@Success	200			{object}	object{data=transformations.AdminOutputBooking}
//	@Failure	400			{object}	lib.HTTPError
//	@Failure	401			{object}	string
//	@Failure	500			{object}	string
//	@Router		/api/v1/admin/clients/{client_id}/properties/{property_id}/bookings/{booking_id}/cancel [put]
func (h *BookingHandler) CancelBooking(w http.ResponseWriter, r *http.Request) {
	bookingID := chi.URLParam(r, "booking_id")
	clientUser, _ := lib.ClientUserFromContext(r.Context())

	var body CancelBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	booking, err := h.bookingService.CancelBooking(r.Context(), services.CancelBookingInput{
		BookingID:          bookingID,
		ClientUserID:       clientUser.ID,
		CancellationReason: body.Reason,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": transformations.DBBookingToRest(booking)})
}

type GetAvailabilityFilterRequest struct {
	From string `json:"from" validate:"required,datetime=2006-01-02T15:04:05Z07:00"`
	To   string `json:"to"   validate:"required,datetime=2006-01-02T15:04:05Z07:00"`
}

// GetAvailability godoc
//
//	@Summary	Get availability for a unit (manager)
//	@Tags		Booking
//	@Security	BearerAuth
//	@Produce	json
//
//	@Param		client_id	path		string	true	"Client ID"
//
//	@Param		property_id	path		string	true	"Property ID"
//	@Param		unit_id		path		string	true	"Unit ID"
//	@Param		from		query		string	true	"Start date (RFC3339)"
//	@Param		to			query		string	true	"End date (RFC3339)"
//	@Success	200			{object}	object{data=[]transformations.AdminOutputUnitDateBlock}
//	@Failure	400			{object}	lib.HTTPError
//	@Failure	401			{object}	string
//	@Failure	500			{object}	string
//	@Router		/api/v1/admin/clients/{client_id}/properties/{property_id}/units/{unit_id}/availability [get]
func (h *BookingHandler) GetAvailability(w http.ResponseWriter, r *http.Request) {
	unitID := chi.URLParam(r, "unit_id")

	filters := GetAvailabilityFilterRequest{
		From: r.URL.Query().Get("from"),
		To:   r.URL.Query().Get("to"),
	}

	if !lib.ValidateRequest(h.appCtx.Validator, filters, w) {
		return
	}

	from, err := time.Parse(time.RFC3339, filters.From)
	if err != nil {
		http.Error(w, "invalid 'from' date", http.StatusBadRequest)
		return
	}
	to, err := time.Parse(time.RFC3339, filters.To)
	if err != nil {
		http.Error(w, "invalid 'to' date", http.StatusBadRequest)
		return
	}

	blocks, err := h.unitDateBlockService.GetAvailability(r.Context(), unitID, from, to)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	out := make([]any, len(blocks))
	for i := range blocks {
		out[i] = transformations.DBUnitDateBlockToRest(&blocks[i])
	}

	json.NewEncoder(w).Encode(map[string]any{"data": out})
}

// CreateDateBlock godoc
//
//	@Summary	Create a manual date block for a unit
//	@Tags		Booking
//	@Security	BearerAuth
//	@Accept		json
//	@Produce	json
//
//	@Param		client_id	path		string					true	"Client ID"
//
//	@Param		property_id	path		string					true	"Property ID"
//	@Param		unit_id		path		string					true	"Unit ID"
//	@Param		body		body		CreateDateBlockRequest	true	"Date block request"
//	@Success	201			{object}	object{data=transformations.AdminOutputUnitDateBlock}
//	@Failure	400			{object}	lib.HTTPError
//	@Failure	401			{object}	string
//	@Failure	500			{object}	string
//	@Router		/api/v1/admin/clients/{client_id}/properties/{property_id}/units/{unit_id}/date-blocks [post]
func (h *BookingHandler) CreateDateBlock(w http.ResponseWriter, r *http.Request) {
	unitID := chi.URLParam(r, "unit_id")
	clientUser, _ := lib.ClientUserFromContext(r.Context())

	var body CreateDateBlockRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	block, err := h.unitDateBlockService.CreateManualBlock(r.Context(), services.CreateManualBlockInput{
		UnitID:                unitID,
		StartDate:             body.StartDate,
		EndDate:               body.EndDate,
		BlockType:             body.BlockType,
		Reason:                body.Reason,
		CreatedByClientUserID: clientUser.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{"data": transformations.DBUnitDateBlockToRest(block)})
}

// DeleteDateBlock godoc
//
//	@Summary	Delete a manual date block
//	@Tags		Booking
//	@Security	BearerAuth
//	@Produce	json
//
//	@Param		client_id	path		string	true	"Client ID"
//
//	@Param		property_id	path		string	true	"Property ID"
//	@Param		unit_id		path		string	true	"Unit ID"
//	@Param		block_id	path		string	true	"Block ID"
//	@Success	204			{object}	nil
//	@Failure	400			{object}	lib.HTTPError
//	@Failure	401			{object}	string
//	@Failure	404			{object}	lib.HTTPError
//	@Failure	500			{object}	string
//	@Router		/api/v1/admin/clients/{client_id}/properties/{property_id}/units/{unit_id}/date-blocks/{block_id} [delete]
func (h *BookingHandler) DeleteDateBlock(w http.ResponseWriter, r *http.Request) {
	blockID := chi.URLParam(r, "block_id")
	clientUser, _ := lib.ClientUserFromContext(r.Context())
	if err := h.unitDateBlockService.DeleteBlock(r.Context(), blockID, clientUser.ID); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ---- Public handlers (no auth) ----

// PublicGetAvailability godoc
//
//	@Summary	Get availability for a unit (public)
//	@Tags		Public
//	@Produce	json
//	@Param		unit_slug	path		string	true	"Unit Slug"
//	@Param		from		query		string	false	"Start date (RFC3339)"
//	@Param		to			query		string	false	"End date (RFC3339)"
//	@Success	200			{object}	object{data=[]transformations.PublicOutputUnitDateBlock}
//	@Failure	400			{object}	lib.HTTPError
//	@Failure	404			{object}	lib.HTTPError
//	@Failure	500			{object}	string
//	@Router		/api/v1/units/{unit_slug}/availability [get]
func (h *BookingHandler) PublicGetAvailability(w http.ResponseWriter, r *http.Request) {
	unitSlug := chi.URLParam(r, "unit_slug")

	unit, err := h.unitService.GetUnitBySlug(r.Context(), unitSlug)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	from, _ := time.Parse(time.RFC3339, r.URL.Query().Get("from"))
	to, _ := time.Parse(time.RFC3339, r.URL.Query().Get("to"))
	if from.IsZero() {
		from = time.Now()
	}
	if to.IsZero() {
		to = from.AddDate(0, 3, 0)
	}

	blocks, err := h.unitDateBlockService.GetAvailability(r.Context(), unit.ID.String(), from, to)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	out := make([]any, len(blocks))
	for i := range blocks {
		out[i] = transformations.DBUnitDateBlockToRest(&blocks[i])
	}
	json.NewEncoder(w).Encode(map[string]any{"data": out})
}

// PublicCreateBooking godoc
//
//	@Summary	Create a booking as a guest (public)
//	@Tags		Public
//	@Accept		json
//	@Produce	json
//	@Param		unit_slug	path		string						true	"Unit Slug"
//	@Param		body		body		PublicCreateBookingRequest	true	"Booking request"
//	@Success	201			{object}	object{data=transformations.PublicOutputBooking}
//	@Failure	400			{object}	lib.HTTPError
//	@Failure	404			{object}	lib.HTTPError
//	@Failure	500			{object}	string
//	@Router		/api/v1/units/{unit_slug}/bookings [post]
func (h *BookingHandler) PublicCreateBooking(w http.ResponseWriter, r *http.Request) {
	unitSlug := chi.URLParam(r, "unit_slug")

	var body PublicCreateBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	unit, unitErr := h.unitService.GetUnitBySlug(r.Context(), unitSlug)
	if unitErr != nil {
		HandleErrorResponse(w, unitErr)
		return
	}

	property, propErr := h.propertyService.GetProperty(r.Context(), repository.GetPropertyQuery{ID: unit.PropertyID})
	if propErr != nil {
		HandleErrorResponse(w, propErr)
		return
	}

	// make sure property supports booking mode
	if !slices.Contains(property.Modes, "BOOKING") {
		http.Error(w, "this property does not support bookings", http.StatusBadRequest)
		return
	}

	// calculate the rate based on the unit's rent fee and the length of stay based on frequency: WEEKLY | DAILY | MONTHLY | HOURLY
	rate := int64(0)
	switch unit.PaymentFrequency {
	case "HOURLY":
		rate = int64(body.CheckOutDate.Sub(body.CheckInDate).Hours()) * unit.RentFee
	case "DAILY":
		rate = int64(body.CheckOutDate.Sub(body.CheckInDate).Hours()/24) * unit.RentFee
	case "WEEKLY":
		rate = int64(body.CheckOutDate.Sub(body.CheckInDate).Hours()/(24*7)) * unit.RentFee
	case "MONTHLY":
		rate = int64(body.CheckOutDate.Sub(body.CheckInDate).Hours()/(24*30)) * unit.RentFee
	}

	booking, err := h.bookingService.CreateBooking(r.Context(), services.CreateBookingInput{
		UnitID:         unit.ID.String(),
		PropertyID:     unit.PropertyID,
		CheckInDate:    body.CheckInDate,
		CheckOutDate:   body.CheckOutDate,
		Rate:           rate,
		Currency:       unit.RentFeeCurrency,
		BookingSource:  "GUEST_LINK",
		GuestFirstName: body.FirstName,
		GuestLastName:  body.LastName,
		GuestPhone:     body.Phone,
		GuestEmail:     body.Email,
		GuestIDType:    body.IDType,
		GuestIDNumber:  body.IDNumber,
		GuestGender:    body.Gender,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{"data": transformations.DBPublicBookingToRest(booking)})
}

// PublicGetBookingTracking godoc
//
//	@Summary	Get booking status by tracking code (phone-verified)
//	@Tags		Public
//	@Produce	json
//	@Param		tracking_code	path		string	true	"Tracking Code"
//	@Param		phone			query		string	true	"Guest phone number"
//	@Success	200				{object}	object{data=transformations.PublicOutputBooking}
//	@Failure	400				{object}	lib.HTTPError
//	@Failure	403				{object}	string
//	@Failure	404				{object}	lib.HTTPError
//	@Failure	500				{object}	string
//	@Router		/api/v1/bookings/{tracking_code} [get]
func (h *BookingHandler) PublicGetBookingTracking(w http.ResponseWriter, r *http.Request) {
	trackingCode := chi.URLParam(r, "tracking_code")
	phone := r.URL.Query().Get("phone")

	booking, err := h.bookingService.GetBookingByTrackingCode(r.Context(), trackingCode)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	// Verify phone matches — protects guest data
	if booking.Tenant.Phone != phone {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).
			Encode(map[string]any{"errors": map[string]string{"message": "phone number does not match this booking"}})
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": transformations.DBPublicBookingToRest(booking)})
}
