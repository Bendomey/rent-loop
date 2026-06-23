package services

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/lib/emailtemplates"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	log "github.com/sirupsen/logrus"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type BookingService interface {
	CreateBooking(ctx context.Context, input CreateBookingInput) (*models.Booking, error)
	UpdateBooking(ctx context.Context, input UpdateBookingInput) (*models.Booking, error)
	GetBooking(ctx context.Context, query repository.GetBookingQuery) (*models.Booking, error)
	ListBookings(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filter repository.ListBookingsFilter,
	) ([]models.Booking, error)
	CountBookings(ctx context.Context, filterQuery lib.FilterQuery, filter repository.ListBookingsFilter) (int64, error)
	ConfirmBooking(ctx context.Context, input ConfirmBookingInput) (*models.Booking, error)
	CheckInBooking(ctx context.Context, id string, clientUserID string) (*models.Booking, error)
	CompleteBooking(ctx context.Context, id string, clientUserID string) (*models.Booking, error)
	CancelBooking(ctx context.Context, input CancelBookingInput) (*models.Booking, error)
	GetBookingByTrackingCode(ctx context.Context, trackingCode string) (*models.Booking, error)
}

type bookingService struct {
	appCtx               pkg.AppContext
	repo                 repository.BookingRepository
	unitDateBlockService UnitDateBlockService
	unitDateBlockRepo    repository.UnitDateBlockRepository
	tenantService        TenantService
	invoiceService       InvoiceService
	unitService          UnitService
}

type BookingServiceDeps struct {
	AppCtx               pkg.AppContext
	Repo                 repository.BookingRepository
	UnitDateBlockService UnitDateBlockService
	UnitDateBlockRepo    repository.UnitDateBlockRepository
	TenantService        TenantService
	InvoiceService       InvoiceService
	UnitService          UnitService
}

func NewBookingService(deps BookingServiceDeps) BookingService {
	return &bookingService{
		appCtx:               deps.AppCtx,
		repo:                 deps.Repo,
		unitDateBlockService: deps.UnitDateBlockService,
		unitDateBlockRepo:    deps.UnitDateBlockRepo,
		tenantService:        deps.TenantService,
		invoiceService:       deps.InvoiceService,
		unitService:          deps.UnitService,
	}
}

type CreateBookingInput struct {
	UnitID                string
	PropertyID            string
	CheckInDate           time.Time
	CheckOutDate          time.Time
	Rate                  int64
	Currency              string
	StayFrequency         string
	BookingSource         string // MANAGER | GUEST_LINK
	CreatedByClientUserID *string
	Notes                 string
	// Guest info
	GuestFirstName string
	GuestLastName  string
	GuestPhone     string
	GuestEmail     *string
	GuestIDType    *string
	GuestIDNumber  *string
	GuestGender    string
}

type ConfirmBookingInput struct {
	BookingID    string
	ClientUserID string
}

type CancelBookingInput struct {
	BookingID          string
	ClientUserID       string
	CancellationReason string
}

type UpdateBookingInput struct {
	BookingID string

	Notes                  lib.Optional[string]
	Rate                   lib.Optional[int64]
	Currency               lib.Optional[string]
	RequiresUpfrontPayment lib.Optional[bool]
	CheckInDate            lib.Optional[time.Time]
	CheckOutDate           lib.Optional[time.Time]
	Meta                   lib.Optional[datatypes.JSON]
}

func (s *bookingService) CreateBooking(ctx context.Context, input CreateBookingInput) (*models.Booking, error) {
	if !input.CheckOutDate.After(input.CheckInDate) {
		return nil, errors.New("check_out_date must be after check_in_date")
	}

	unit, unitErr := s.unitService.GetUnit(ctx, repository.GetUnitQuery{
		PropertyID: input.PropertyID,
		UnitID:     input.UnitID,
		Populate:   &[]string{"Property"},
	})

	if unitErr != nil {
		return nil, unitErr
	}

	tenant, err := s.tenantService.FindOrCreateLightTenant(ctx, FindOrCreateLightTenantInput{
		FirstName:   input.GuestFirstName,
		LastName:    input.GuestLastName,
		Phone:       input.GuestPhone,
		Email:       input.GuestEmail,
		IDType:      input.GuestIDType,
		IDNumber:    input.GuestIDNumber,
		Gender:      input.GuestGender,
		CreatedById: input.CreatedByClientUserID,
	})
	if err != nil {
		return nil, err
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	booking := &models.Booking{
		UnitID:                input.UnitID,
		PropertyID:            input.PropertyID,
		TenantID:              tenant.ID.String(),
		CheckInDate:           input.CheckInDate,
		CheckOutDate:          input.CheckOutDate,
		Rate:                  input.Rate,
		Currency:              input.Currency,
		StayFrequency:         input.StayFrequency,
		Status:                "PENDING",
		BookingSource:         input.BookingSource,
		CreatedByClientUserID: input.CreatedByClientUserID,
		Notes:                 input.Notes,
	}

	// calculate the rate based on the unit's rent fee and the length of stay based on frequency: WEEKLY | DAILY | MONTHLY | HOURLY
	hours := input.CheckOutDate.Sub(input.CheckInDate).Hours()

	totalRate := int64(0)
	quantity := int64(0)
	paymentFrequency := "nights"
	switch unit.PaymentFrequency {
	case "HOURLY":
		quantity = int64(math.Ceil(hours))
		totalRate = quantity * input.Rate
		paymentFrequency = "hours"
	case "DAILY":
		quantity = int64(math.Ceil(hours / 24))
		totalRate = quantity * input.Rate
		paymentFrequency = "nights"
	case "WEEKLY":
		quantity = int64(math.Ceil(hours / (24 * 7)))
		totalRate = quantity * input.Rate
		paymentFrequency = "weeks"
	case "MONTHLY":
		quantity = int64(math.Ceil(hours / (24 * 30)))
		totalRate = quantity * input.Rate
		paymentFrequency = "months"
	}

	// create invoice record
	clientID := unit.Property.ClientID
	propertyID := unit.PropertyID
	bookingID := booking.ID.String()

	_, invoiceErr := s.invoiceService.CreateInvoice(transCtx, CreateInvoiceInput{
		ClientID:         &clientID,
		PropertyID:       &propertyID,
		PayerType:        "GUEST",
		PayeeType:        "PROPERTY_OWNER",
		PayeeClientID:    &clientID,
		ContextType:      "BOOKING_FEE",
		ContextBookingID: &bookingID,
		TotalAmount:      totalRate,
		SubTotal:         totalRate,
		Currency:         input.Currency,
		Status:           "DRAFT",
		DueDate:          nil,
		LineItems: []LineItemInput{
			{
				Label:       fmt.Sprintf("Booking for %s for %d %s", unit.Name, quantity, paymentFrequency),
				Category:    "BOOKING_FEE",
				Quantity:    quantity,
				UnitAmount:  input.Rate,
				TotalAmount: totalRate,
				Currency:    input.Currency,
			},
		},
	})

	if invoiceErr != nil {
		return nil, invoiceErr
	}

	if err := s.repo.Create(transCtx, booking); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateBooking",
				"action":   "creating booking record",
			},
		})
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"function": "CreateBooking",
				"action":   "committing transaction",
			},
		})
	}

	// reload booking data with tenant info for notification
	bookingReloaded, err := s.repo.GetByIDWithPopulate(ctx, repository.GetBookingQuery{
		ID:       booking.ID.String(),
		Populate: &[]string{"Tenant", "Unit"},
	})
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateBooking",
				"action":   "reloading booking data",
			},
		})
	}

	go s.sendBookingCreatedNotification(*bookingReloaded)

	return booking, nil
}

func (s *bookingService) UpdateBooking(ctx context.Context, input UpdateBookingInput) (*models.Booking, error) {
	booking, err := s.repo.GetByIDWithPopulate(
		ctx,
		repository.GetBookingQuery{ID: input.BookingID, Populate: &[]string{"Invoice"}},
	)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("BookingNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "UpdateBooking", "action": "fetching booking"},
		})
	}

	if booking.Status == "COMPLETED" || booking.Status == "CANCELLED" {
		return nil, pkg.BadRequestError("cannot update a completed or cancelled booking", &pkg.RentLoopErrorParams{
			Err:      errors.New("booking is in a terminal status"),
			Metadata: map[string]string{"function": "UpdateBooking"},
		})
	}

	// These fields are locked once the booking is confirmed.
	preConfirmOnly := input.Rate.IsSet || input.Currency.IsSet ||
		input.CheckInDate.IsSet || input.CheckOutDate.IsSet
	if preConfirmOnly && booking.Status != "PENDING" {
		return nil, pkg.BadRequestError(
			"rate, currency, dates, and invoice can only be changed before the booking is confirmed",
			&pkg.RentLoopErrorParams{
				Err:      errors.New("booking already confirmed"),
				Metadata: map[string]string{"function": "UpdateBooking"},
			},
		)
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	if input.Notes.IsSet {
		booking.Notes = *input.Notes.Value
	}
	if input.RequiresUpfrontPayment.IsSet {
		booking.RequiresUpfrontPayment = *input.RequiresUpfrontPayment.Value
	}
	if input.Meta.IsSet {
		booking.Meta = *input.Meta.Value
	}

	if input.CheckInDate.IsSet {
		booking.CheckInDate = *input.CheckInDate.Value
	}
	if input.CheckOutDate.IsSet {
		booking.CheckOutDate = *input.CheckOutDate.Value
	}

	if input.CheckInDate.IsSet || input.CheckOutDate.IsSet {
		if !booking.CheckOutDate.After(booking.CheckInDate) {
			return nil, pkg.BadRequestError("check_out_date must be after check_in_date", &pkg.RentLoopErrorParams{
				Err:      errors.New("invalid date range"),
				Metadata: map[string]string{"function": "UpdateBooking"},
			})
		}
	}

	if input.Rate.IsSet {
		booking.Rate = *input.Rate.Value
	}
	if input.Currency.IsSet {
		booking.Currency = *input.Currency.Value
	}

	// update invoice if updates affects pricing
	if input.Rate.IsSet || input.CheckInDate.IsSet || input.CheckOutDate.IsSet || input.Currency.IsSet {
		newBookingRate := booking.Rate

		unit, unitErr := s.unitService.GetUnit(ctx, repository.GetUnitQuery{
			PropertyID: booking.PropertyID,
			UnitID:     booking.UnitID,
		})

		if unitErr != nil {
			return nil, unitErr
		}

		// calculate the rate based on the unit's rent fee and the length of stay based on frequency: WEEKLY | DAILY | MONTHLY | HOURLY
		hours := booking.CheckOutDate.Sub(booking.CheckInDate).Hours()
		totalRate := int64(0)
		quantity := int64(0)
		paymentFrequency := "nights"
		switch unit.PaymentFrequency {
		case "HOURLY":
			quantity = int64(math.Ceil(hours))
			totalRate = quantity * newBookingRate
			paymentFrequency = "hours"
		case "DAILY":
			quantity = int64(math.Ceil(hours / 24))
			totalRate = quantity * newBookingRate
			paymentFrequency = "nights"
		case "WEEKLY":
			quantity = int64(math.Ceil(hours / (24 * 7)))
			totalRate = quantity * newBookingRate
			paymentFrequency = "weeks"
		case "MONTHLY":
			quantity = int64(math.Ceil(hours / (24 * 30)))
			totalRate = quantity * newBookingRate
			paymentFrequency = "months"
		}

		if booking.Invoice == nil || booking.Invoice.ID.String() == "" {
			return nil, pkg.InternalServerError("Booking invoice not loaded", &pkg.RentLoopErrorParams{
				Err:      errors.New("invoice missing from booking"),
				Metadata: map[string]string{"function": "UpdateBooking", "action": "resolving booking invoice"},
			})
		}

		lineItems, lineItemsErr := s.invoiceService.GetLineItems(transCtx, booking.Invoice.ID.String())
		if lineItemsErr != nil {
			transaction.Rollback()
			return nil, pkg.InternalServerError(lineItemsErr.Error(), &pkg.RentLoopErrorParams{
				Err: lineItemsErr,
				Metadata: map[string]string{
					"function": "UpdateBooking",
					"action":   "fetching booking invoice line items",
				},
			})
		}

		var bookingLineItem *models.InvoiceLineItem
		for i := range lineItems {
			if lineItems[i].Category == "BOOKING_FEE" {
				bookingLineItem = &lineItems[i]
				break
			}
		}

		if bookingLineItem == nil {
			return nil, pkg.NotFoundError("BookingInvoiceLineItemNotFound", &pkg.RentLoopErrorParams{
				Err:      errors.New("booking invoice line item not found"),
				Metadata: map[string]string{"function": "UpdateBooking", "action": "finding booking fee line item"},
			})
		}

		label := fmt.Sprintf("Booking for %s for %d %s", unit.Name, quantity, paymentFrequency)
		if _, updateErr := s.invoiceService.UpdateLineItem(transCtx, UpdateLineItemInput{
			InvoiceID:   booking.Invoice.ID.String(),
			LineItemID:  bookingLineItem.ID.String(),
			Label:       &label,
			Quantity:    &quantity,
			UnitAmount:  &newBookingRate,
			TotalAmount: &totalRate,
			Currency:    &booking.Currency,
		}); updateErr != nil {
			transaction.Rollback()
			return nil, updateErr
		}
	}

	if err := s.repo.Update(transCtx, booking); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "UpdateBooking", "action": "saving booking"},
		})
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err:      commitErr,
			Metadata: map[string]string{"function": "UpdateBooking", "action": "committing transaction"},
		})
	}

	return booking, nil
}

func (s *bookingService) ConfirmBooking(ctx context.Context, input ConfirmBookingInput) (*models.Booking, error) {
	booking, err := s.repo.GetByIDWithPopulate(ctx, repository.GetBookingQuery{
		ID:       input.BookingID,
		Populate: &[]string{"Tenant", "Unit", "Property"},
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("BookingNotFound", &pkg.RentLoopErrorParams{Err: err})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "GetBookingByIDWithPopulate"},
		})
	}
	if booking.Status != "PENDING" {
		return nil, pkg.BadRequestError("only PENDING bookings can be confirmed", &pkg.RentLoopErrorParams{
			Err: errors.New("booking is not in PENDING status"),
			Metadata: map[string]string{
				"function": "ConfirmBooking",
				"action":   "validating booking status",
			},
		})
	}

	hasOverlap, err := s.repo.HasOverlappingBlock(ctx, booking.UnitID, booking.CheckInDate, booking.CheckOutDate)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ConfirmBooking",
				"action":   "checking for overlapping blocks",
			},
		})
	}

	if hasOverlap {
		return nil, pkg.ConflictError(
			"dates are no longer available: overlapping block exists",
			&pkg.RentLoopErrorParams{
				Err: errors.New("overlapping block exists"),
				Metadata: map[string]string{
					"function": "ConfirmBooking",
					"action":   "checking for overlapping blocks",
				},
			},
		)
	}

	checkInCode, codeErr := lib.GenerateCheckInCode()
	if codeErr != nil {
		return nil, pkg.InternalServerError(codeErr.Error(), &pkg.RentLoopErrorParams{
			Err: codeErr,
			Metadata: map[string]string{
				"function": "ConfirmBooking",
				"action":   "generating check-in code",
			},
		})
	}

	// Atomically update status + create date block to prevent double-booking races.
	tx := s.appCtx.DB.Begin()
	if tx.Error != nil {
		return nil, pkg.InternalServerError(tx.Error.Error(), &pkg.RentLoopErrorParams{
			Err: tx.Error,
			Metadata: map[string]string{
				"function": "ConfirmBooking",
				"action":   "starting transaction",
			},
		})
	}
	transCtx := lib.WithTransaction(ctx, tx)

	now := time.Now()
	booking.Status = "CONFIRMED"
	booking.CheckInCode = checkInCode
	booking.ConfirmedAt = &now
	booking.ConfirmedByID = &input.ClientUserID
	if err := s.repo.Update(transCtx, booking); err != nil {
		tx.Rollback()
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ConfirmBooking",
				"action":   "updating booking status",
			},
		})
	}

	bookingID := booking.ID.String()
	if _, err := s.unitDateBlockService.CreateSystemBlock(transCtx, CreateSystemBlockInput{
		UnitID:    booking.UnitID,
		StartDate: booking.CheckInDate,
		EndDate:   booking.CheckOutDate,
		BlockType: "BOOKING",
		BookingID: &bookingID,
		Reason:    fmt.Sprintf("System block for booking #%s", booking.Code),
	}); err != nil {
		tx.Rollback()
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ConfirmBooking",
				"action":   "creating system block",
			},
		})
	}

	if err := tx.Commit().Error; err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ConfirmBooking",
				"action":   "committing transaction",
			},
		})
	}

	go s.sendBookingConfirmedNotification(*booking)

	return booking, nil
}

func (s *bookingService) CheckInBooking(ctx context.Context, id string, clientUserID string) (*models.Booking, error) {
	booking, err := s.repo.GetByIDWithPopulate(ctx, repository.GetBookingQuery{
		ID: id,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("BookingNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "GetBookingByIDWithPopulate"},
		})
	}

	if booking.Status != "CONFIRMED" {
		return nil, pkg.BadRequestError("only CONFIRMED bookings can be checked in", &pkg.RentLoopErrorParams{
			Err: errors.New("booking is not in CONFIRMED status"),
			Metadata: map[string]string{
				"function": "CheckInBooking",
				"action":   "validating booking status",
			},
		})
	}

	booking.Status = "CHECKED_IN"
	now := time.Now()
	booking.CheckedInAt = &now
	booking.CheckedInByID = &clientUserID

	if err := s.repo.Update(ctx, booking); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CheckInBooking",
				"action":   "updating booking status",
			},
		})
	}
	return booking, nil
}

func (s *bookingService) CompleteBooking(ctx context.Context, id string, clientUserID string) (*models.Booking, error) {
	booking, err := s.repo.GetByIDWithPopulate(ctx, repository.GetBookingQuery{
		ID: id,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("BookingNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "GetBookingByIDWithPopulate"},
		})
	}

	if booking.Status != "CHECKED_IN" {
		return nil, pkg.BadRequestError("only CHECKED_IN bookings can be completed", &pkg.RentLoopErrorParams{
			Err: errors.New("booking is not in CHECKED_IN status"),
			Metadata: map[string]string{
				"function": "CompleteBooking",
				"action":   "validating booking status",
			},
		})
	}

	booking.Status = "COMPLETED"
	now := time.Now()
	booking.CheckedOutAt = &now
	booking.CheckedOutByID = &clientUserID

	if err := s.repo.Update(ctx, booking); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CompleteBooking",
				"action":   "updating booking status",
			},
		})
	}

	return booking, nil
}

func (s *bookingService) CancelBooking(ctx context.Context, input CancelBookingInput) (*models.Booking, error) {
	booking, err := s.repo.GetByIDWithPopulate(ctx, repository.GetBookingQuery{
		ID:       input.BookingID,
		Populate: &[]string{"Tenant"},
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("BookingNotFound", &pkg.RentLoopErrorParams{Err: err})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "GetBookingByIDWithPopulate"},
		})
	}

	if booking.Status == "COMPLETED" || booking.Status == "CHECKED_IN" {
		return nil, pkg.BadRequestError("only PENDING or CONFIRMED bookings can be cancelled", &pkg.RentLoopErrorParams{
			Err: errors.New("booking is in invalid status for cancellation"),
			Metadata: map[string]string{
				"function": "CancelBooking",
				"action":   "validating booking status",
			},
		})
	}

	booking.Status = "CANCELLED"
	booking.CancellationReason = input.CancellationReason

	now := time.Now()
	booking.CanceledAt = &now
	booking.CanceledByID = &input.ClientUserID

	if err := s.repo.Update(ctx, booking); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CancelBooking",
				"action":   "updating booking status",
			},
		})
	}

	go s.removeBookingDateBlock(context.Background(), booking.ID.String())
	go s.sendBookingCancelledNotification(*booking, input.CancellationReason)

	return booking, nil
}

func (s *bookingService) GetBooking(ctx context.Context, query repository.GetBookingQuery) (*models.Booking, error) {
	booking, err := s.repo.GetByIDWithPopulate(ctx, repository.GetBookingQuery{
		ID:       query.ID,
		Populate: query.Populate,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("BookingNotFound", &pkg.RentLoopErrorParams{Err: err})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "GetBookingByIDWithPopulate"},
		})
	}

	return booking, nil
}

func (s *bookingService) ListBookings(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filter repository.ListBookingsFilter,
) ([]models.Booking, error) {
	bookings, err := s.repo.List(ctx, filterQuery, filter)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ListBookings"},
		})
	}

	return *bookings, nil
}

func (s *bookingService) CountBookings(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filter repository.ListBookingsFilter,
) (int64, error) {
	count, err := s.repo.Count(ctx, filterQuery, filter)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "CountBookings"},
		})
	}

	return count, nil
}

func (s *bookingService) GetBookingByTrackingCode(ctx context.Context, trackingCode string) (*models.Booking, error) {
	booking, err := s.repo.GetByTrackingCode(ctx, trackingCode, []string{"Unit", "Property", "Tenant"})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("BookingNotFound", &pkg.RentLoopErrorParams{Err: err})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "GetBookingByTrackingCode"},
		})
	}

	return booking, nil
}

func (s *bookingService) removeBookingDateBlock(ctx context.Context, bookingID string) {
	if err := s.unitDateBlockRepo.DeleteByBookingID(ctx, bookingID); err != nil {
		log.WithError(err).
			WithField("booking_id", bookingID).
			Error("failed to remove booking date block on cancellation")
	}
}

func (s *bookingService) sendBookingCreatedNotification(booking models.Booking) {
	emailData := emailtemplates.BookingCreatedData{
		GuestName:    booking.Tenant.FirstName,
		UnitName:     booking.Unit.Name,
		CheckInDate:  booking.CheckInDate.Format("January 2, 2006 3:04pm"),
		CheckOutDate: booking.CheckOutDate.Format("January 2, 2006 3:04pm"),
		Rate:         lib.FormatAmount(lib.PesewasToCedis(booking.Rate)),
		Currency:     booking.Currency,
		TrackingCode: booking.Code,
	}

	htmlBody, textBody, renderErr := s.appCtx.EmailEngine.Render("booking/created", emailData)
	if renderErr != nil {
		log.WithError(renderErr).Error("failed to render booking created email template")
	}

	if booking.Tenant.Email != nil {
		go pkg.SendEmail(
			s.appCtx.Config,
			pkg.SendEmailInput{
				Recipient: *booking.Tenant.Email,
				Subject:   lib.BOOKING_CREATED_SUBJECT,
				HtmlBody:  htmlBody,
				TextBody:  textBody,
			},
		)
	}

	smsBody := strings.NewReplacer(
		"{{tenant_name}}", booking.Tenant.FirstName,
		"{{unit_name}}", booking.Unit.Name,
		"{{check_in_date}}", booking.CheckInDate.Format("January 2, 2006 3:04pm"),
		"{{check_out_date}}", booking.CheckOutDate.Format("January 2, 2006 3:04pm"),
		"{{booking_code}}", booking.Code,
	).Replace(lib.BOOKING_CREATED_SMS_BODY)

	go s.appCtx.Clients.GatekeeperAPI.SendSMS(
		context.Background(),
		gatekeeper.SendSMSInput{
			Recipient: booking.Tenant.Phone,
			Message:   smsBody,
		},
	)
}

func (s *bookingService) sendBookingConfirmedNotification(booking models.Booking) {
	emailData := emailtemplates.BookingConfirmedData{
		GuestName:    booking.Tenant.FirstName,
		UnitName:     booking.Unit.Name,
		CheckInDate:  booking.CheckInDate.Format("January 2, 2006 3:04pm"),
		CheckOutDate: booking.CheckOutDate.Format("January 2, 2006 3:04pm"),
		CheckInCode:  booking.CheckInCode,
		TrackingCode: booking.Code,
	}

	htmlBody, textBody, renderErr := s.appCtx.EmailEngine.Render("booking/confirmed", emailData)
	if renderErr != nil {
		log.WithError(renderErr).Error("failed to render booking confirmed email template")
	}

	if booking.Tenant.Email != nil {
		go pkg.SendEmail(
			s.appCtx.Config,
			pkg.SendEmailInput{
				Recipient: *booking.Tenant.Email,
				Subject:   lib.BOOKING_CONFIRMED_SUBJECT,
				HtmlBody:  htmlBody,
				TextBody:  textBody,
			},
		)
	}

	smsBody := strings.NewReplacer(
		"{{tenant_name}}", booking.Tenant.FirstName,
		"{{unit_name}}", booking.Unit.Name,
		"{{booking_code}}", booking.Code,
	).Replace(lib.BOOKING_CONFIRMED_SMS_BODY)

	go s.appCtx.Clients.GatekeeperAPI.SendSMS(
		context.Background(),
		gatekeeper.SendSMSInput{
			Recipient: booking.Tenant.Phone,
			Message:   smsBody,
		},
	)
}

func (s *bookingService) sendBookingCancelledNotification(booking models.Booking, reason string) {
	emailData := emailtemplates.BookingCancelledData{
		GuestName:          booking.Tenant.FirstName,
		UnitName:           booking.Unit.Name,
		CancellationReason: reason,
		TrackingCode:       booking.Code,
	}

	htmlBody, textBody, renderErr := s.appCtx.EmailEngine.Render("booking/cancelled", emailData)
	if renderErr != nil {
		log.WithError(renderErr).Error("failed to render booking cancelled email template")
	}

	if booking.Tenant.Email != nil {
		go pkg.SendEmail(
			s.appCtx.Config,
			pkg.SendEmailInput{
				Recipient: *booking.Tenant.Email,
				Subject:   lib.BOOKING_CANCELLED_SUBJECT,
				HtmlBody:  htmlBody,
				TextBody:  textBody,
			},
		)
	}

	smsBody := strings.NewReplacer(
		"{{tenant_name}}", booking.Tenant.FirstName,
		"{{unit_name}}", booking.Unit.Name,
		"{{check_in_date}}", booking.CheckInDate.Format("January 2, 2006 3:04pm"),
		"{{check_out_date}}", booking.CheckOutDate.Format("January 2, 2006 3:04pm"),
		"{{cancellation_reason}}", reason,
	).Replace(lib.BOOKING_CANCELLED_SMS_BODY)

	go s.appCtx.Clients.GatekeeperAPI.SendSMS(
		context.Background(),
		gatekeeper.SendSMSInput{
			Recipient: booking.Tenant.Phone,
			Message:   smsBody,
		},
	)
}
