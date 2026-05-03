package services

import (
	"context"
	"errors"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	log "github.com/sirupsen/logrus"
)

type BookingService interface {
	CreateBooking(ctx context.Context, input CreateBookingInput) (*models.Booking, error)
	GetBooking(ctx context.Context, id string, populate []string) (*models.Booking, error)
	ListBookings(ctx context.Context, filter repository.ListBookingsFilter) ([]models.Booking, error)
	CountBookings(ctx context.Context, filter repository.ListBookingsFilter) (int64, error)
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
	UnitID                 string
	PropertyID             string
	CheckInDate            time.Time
	CheckOutDate           time.Time
	Rate                   int64
	Currency               string
	BookingSource          string // MANAGER | GUEST_LINK
	RequiresUpfrontPayment bool
	CreatedByClientUserID  *string
	Notes                  string
	// Guest info
	GuestFirstName string
	GuestLastName  string
	GuestPhone     string
	GuestEmail     string
	GuestIDNumber  string
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
		IDNumber:  input.GuestIDNumber,
	})
	if err != nil {
		return nil, err
	}

	booking := &models.Booking{
		UnitID:                 input.UnitID,
		PropertyID:             input.PropertyID,
		TenantID:               tenant.ID.String(),
		CheckInDate:            input.CheckInDate,
		CheckOutDate:           input.CheckOutDate,
		Rate:                   input.Rate,
		Currency:               input.Currency,
		Status:                 "PENDING",
		BookingSource:          input.BookingSource,
		RequiresUpfrontPayment: input.RequiresUpfrontPayment,
		CreatedByClientUserID:  input.CreatedByClientUserID,
		Notes:                  input.Notes,
	}

	if err := s.repo.Create(ctx, booking); err != nil {
		return nil, err
	}

	go s.sendBookingCreatedNotification(booking, tenant)

	return booking, nil
}

func (s *bookingService) ConfirmBooking(ctx context.Context, input ConfirmBookingInput) (*models.Booking, error) {
	booking, err := s.repo.GetByID(ctx, input.BookingID, []string{"Tenant", "Unit", "Property"})
	if err != nil {
		return nil, errors.New("booking not found")
	}
	if booking.Status != "PENDING" {
		return nil, errors.New("only PENDING bookings can be confirmed")
	}

	hasOverlap, err := s.repo.HasOverlappingBlock(ctx, booking.UnitID, booking.CheckInDate, booking.CheckOutDate)
	if err != nil {
		return nil, err
	}
	if hasOverlap {
		return nil, errors.New("dates are no longer available: overlapping block exists")
	}

	checkInCode, codeErr := lib.GenerateCheckInCode()
	if codeErr != nil {
		return nil, codeErr
	}

	// Atomically update status + create date block to prevent double-booking races.
	tx := s.appCtx.DB.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}
	transCtx := lib.WithTransaction(ctx, tx)

	booking.Status = "CONFIRMED"
	booking.CheckInCode = checkInCode
	if err := s.repo.Update(transCtx, booking); err != nil {
		tx.Rollback()
		return nil, err
	}

	bookingID := booking.ID.String()
	if _, err := s.unitDateBlockService.CreateSystemBlock(transCtx, CreateSystemBlockInput{
		UnitID:    booking.UnitID,
		StartDate: booking.CheckInDate,
		EndDate:   booking.CheckOutDate,
		BlockType: "BOOKING",
		BookingID: &bookingID,
		Reason:    "Confirmed booking",
	}); err != nil {
		tx.Rollback()
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	go s.sendBookingConfirmedNotification(booking)

	return booking, nil
}

func (s *bookingService) CheckInBooking(ctx context.Context, id string, clientUserID string) (*models.Booking, error) {
	booking, err := s.repo.GetByID(ctx, id, nil)
	if err != nil {
		return nil, errors.New("booking not found")
	}
	if booking.Status != "CONFIRMED" {
		return nil, errors.New("only CONFIRMED bookings can be checked in")
	}
	booking.Status = "CHECKED_IN"
	if err := s.repo.Update(ctx, booking); err != nil {
		return nil, err
	}
	return booking, nil
}

func (s *bookingService) CompleteBooking(ctx context.Context, id string, clientUserID string) (*models.Booking, error) {
	booking, err := s.repo.GetByID(ctx, id, nil)
	if err != nil {
		return nil, errors.New("booking not found")
	}
	if booking.Status != "CHECKED_IN" {
		return nil, errors.New("only CHECKED_IN bookings can be completed")
	}
	booking.Status = "COMPLETED"
	if err := s.repo.Update(ctx, booking); err != nil {
		return nil, err
	}
	return booking, nil
}

func (s *bookingService) CancelBooking(ctx context.Context, input CancelBookingInput) (*models.Booking, error) {
	booking, err := s.repo.GetByID(ctx, input.BookingID, []string{"Tenant"})
	if err != nil {
		return nil, errors.New("booking not found")
	}
	if booking.Status == "COMPLETED" || booking.Status == "CHECKED_IN" {
		return nil, errors.New("only PENDING or CONFIRMED bookings can be cancelled")
	}

	booking.Status = "CANCELLED"
	booking.CancellationReason = input.CancellationReason
	if err := s.repo.Update(ctx, booking); err != nil {
		return nil, err
	}

	go s.removeBookingDateBlock(context.Background(), booking.ID.String())
	go s.sendBookingCancelledNotification(booking)

	return booking, nil
}

func (s *bookingService) GetBooking(ctx context.Context, id string, populate []string) (*models.Booking, error) {
	return s.repo.GetByID(ctx, id, populate)
}

func (s *bookingService) ListBookings(
	ctx context.Context,
	filter repository.ListBookingsFilter,
) ([]models.Booking, error) {
	bookings, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, err
	}
	return *bookings, nil
}

func (s *bookingService) CountBookings(ctx context.Context, filter repository.ListBookingsFilter) (int64, error) {
	return s.repo.Count(ctx, filter)
}

func (s *bookingService) GetBookingByTrackingCode(ctx context.Context, trackingCode string) (*models.Booking, error) {
	return s.repo.GetByTrackingCode(ctx, trackingCode, []string{"Unit", "Property", "Tenant"})
}

func (s *bookingService) removeBookingDateBlock(ctx context.Context, bookingID string) {
	if err := s.unitDateBlockRepo.DeleteByBookingID(ctx, bookingID); err != nil {
		log.WithError(err).
			WithField("booking_id", bookingID).
			Error("failed to remove booking date block on cancellation")
	}
}

func (s *bookingService) sendBookingCreatedNotification(booking *models.Booking, tenant *models.Tenant) {
	trackingURL := s.appCtx.Config.Portals.WebsiteURL + "/bookings/track/" + booking.Code
	_ = trackingURL // TODO: wire into pkg.SendSMS/SendEmail
}

func (s *bookingService) sendBookingConfirmedNotification(booking *models.Booking) {
	// TODO: wire into pkg.SendSMS/SendEmail
}

func (s *bookingService) sendBookingCancelledNotification(booking *models.Booking) {
	// TODO: wire into pkg.SendSMS/SendEmail
}
