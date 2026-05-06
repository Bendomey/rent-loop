package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/lib/emailtemplates"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	log "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type BookingService interface {
	CreateBooking(ctx context.Context, input CreateBookingInput) (*models.Booking, error)
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
}

type BookingServiceDeps struct {
	AppCtx               pkg.AppContext
	Repo                 repository.BookingRepository
	UnitDateBlockService UnitDateBlockService
	UnitDateBlockRepo    repository.UnitDateBlockRepository
	TenantService        TenantService
	InvoiceService       InvoiceService
}

func NewBookingService(deps BookingServiceDeps) BookingService {
	return &bookingService{
		appCtx:               deps.AppCtx,
		repo:                 deps.Repo,
		unitDateBlockService: deps.UnitDateBlockService,
		unitDateBlockRepo:    deps.UnitDateBlockRepo,
		tenantService:        deps.TenantService,
		invoiceService:       deps.InvoiceService,
	}
}

type CreateBookingInput struct {
	UnitID                string
	PropertyID            string
	CheckInDate           time.Time
	CheckOutDate          time.Time
	Rate                  int64
	Currency              string
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

func (s *bookingService) CreateBooking(ctx context.Context, input CreateBookingInput) (*models.Booking, error) {
	if !input.CheckOutDate.After(input.CheckInDate) {
		return nil, errors.New("check_out_date must be after check_in_date")
	}

	tenant, err := s.tenantService.FindOrCreateLightTenant(ctx, FindOrCreateLightTenantInput{
		FirstName: input.GuestFirstName,
		LastName:  input.GuestLastName,
		Phone:     input.GuestPhone,
		Email:     input.GuestEmail,
		IDType:    input.GuestIDType,
		IDNumber:  input.GuestIDNumber,
		Gender:    input.GuestGender,
	})
	if err != nil {
		return nil, err
	}

	booking := &models.Booking{
		UnitID:                input.UnitID,
		PropertyID:            input.PropertyID,
		TenantID:              tenant.ID.String(),
		CheckInDate:           input.CheckInDate,
		CheckOutDate:          input.CheckOutDate,
		Rate:                  input.Rate,
		Currency:              input.Currency,
		Status:                "PENDING",
		BookingSource:         input.BookingSource,
		CreatedByClientUserID: input.CreatedByClientUserID,
		Notes:                 input.Notes,
	}

	if err := s.repo.Create(ctx, booking); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateBooking",
				"action":   "creating booking record",
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

	booking.Status = "CONFIRMED"
	booking.CheckInCode = checkInCode
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
