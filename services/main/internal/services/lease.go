package services

import (
	"context"
	"encoding/json"
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
	"gorm.io/gorm"
)

type LeaseService interface {
	CreateLease(context context.Context, input CreateLeaseInput) (*models.Lease, error)
	UpdateLease(context context.Context, input UpdateLeaseInput) (*models.Lease, error)
	GetByIDWithPopulate(context context.Context, query repository.GetLeaseQuery) (*models.Lease, error)
	ListLeases(context context.Context, filters repository.ListLeasesFilter) ([]models.Lease, error)
	CountLeases(context context.Context, filters repository.ListLeasesFilter) (int64, error)
	ActivateLease(context context.Context, input ActivateLeaseInput) error
	CancelLease(context context.Context, input CancelLeaseInput) error
	CountOccupyingByUnitID(context context.Context, unitID string) (int64, error)
	GenerateLeaseRentInvoice(ctx context.Context, leaseID string) error
}

type leaseService struct {
	appCtx              pkg.AppContext
	repo                repository.LeaseRepository
	invoiceService      InvoiceService
	notificationService NotificationService
}

func NewLeaseService(
	appCtx pkg.AppContext,
	repo repository.LeaseRepository,
	invoiceService InvoiceService,
	notificationService NotificationService,
) LeaseService {
	return &leaseService{
		appCtx:              appCtx,
		repo:                repo,
		invoiceService:      invoiceService,
		notificationService: notificationService,
	}
}

func calculateNextBillingDate(from time.Time, frequency string) *time.Time {
	var next time.Time
	switch frequency {
	case "Hourly", "HOURLY":
		next = from.Add(time.Hour)
	case "Daily", "DAILY":
		next = from.AddDate(0, 0, 1)
	case "Weekly", "WEEKLY":
		next = from.AddDate(0, 0, 7)
	case "Monthly", "MONTHLY":
		next = from.AddDate(0, 1, 0)
	case "Quarterly", "QUARTERLY":
		next = from.AddDate(0, 3, 0)
	case "BiAnnually", "BIANNUALLY":
		next = from.AddDate(0, 6, 0)
	case "Annually", "ANNUALLY":
		next = from.AddDate(1, 0, 0)
	case "OneTime", "ONE_TIME", "ONETIME":
		return nil
	default:
		return nil
	}
	return &next
}

type CreateLeaseInput struct {
	Status                          string
	UnitId                          string
	TenantId                        string
	TenantApplicationId             string
	RentFee                         int64
	RentFeeCurrency                 string
	PaymentFrequency                *string
	Meta                            map[string]any
	MoveInDate                      time.Time
	StayDurationFrequency           string
	StayDuration                    int64
	KeyHandoverDate                 *time.Time
	UtilityTransfersDate            *time.Time
	PropertyInspectionDate          *time.Time
	LeaseAgreementDocumentUrl       string
	TerminationAgreementDocumentUrl *string
	ParentLeaseId                   *string
}

func (s *leaseService) CreateLease(ctx context.Context, input CreateLeaseInput) (*models.Lease, error) {
	metaJson, marshallErr := lib.InterfaceToJSON(input.Meta)
	if marshallErr != nil {
		return nil, pkg.InternalServerError(marshallErr.Error(), &pkg.RentLoopErrorParams{
			Err: marshallErr,
			Metadata: map[string]string{
				"function": "CreateLease",
				"action":   "marshalling meta",
			},
		})
	}

	lease := models.Lease{
		Status:                          input.Status,
		UnitId:                          input.UnitId,
		TenantId:                        input.TenantId,
		TenantApplicationId:             input.TenantApplicationId,
		RentFee:                         input.RentFee,
		RentFeeCurrency:                 input.RentFeeCurrency,
		PaymentFrequency:                input.PaymentFrequency,
		Meta:                            *metaJson,
		MoveInDate:                      input.MoveInDate,
		StayDurationFrequency:           input.StayDurationFrequency,
		StayDuration:                    input.StayDuration,
		KeyHandoverDate:                 input.KeyHandoverDate,
		UtilityTransfersDate:            input.UtilityTransfersDate,
		PropertyInspectionDate:          input.PropertyInspectionDate,
		LeaseAgreementDocumentUrl:       input.LeaseAgreementDocumentUrl,
		TerminationAgreementDocumentUrl: input.TerminationAgreementDocumentUrl,
	}

	err := s.repo.Create(ctx, &lease)
	if err != nil {
		return nil, pkg.BadRequestError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateLease",
				"action":   "creating lease",
			},
		})
	}

	return &lease, nil
}

func (s *leaseService) CountOccupyingByUnitID(ctx context.Context, unitID string) (int64, error) {
	count, err := s.repo.CountActiveByUnitID(ctx, unitID)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountOccupyingByUnitID",
				"action":   "counting occupying leases for unit",
			},
		})
	}

	return count, nil
}

type UpdateLeaseInput struct {
	LeaseID string

	// Required fields (use pointer with nil check)
	Status                    *string
	RentFee                   *int64
	RentFeeCurrency           *string
	Meta                      *map[string]any
	MoveInDate                *time.Time
	StayDurationFrequency     *string
	StayDuration              *int64
	LeaseAgreementDocumentUrl *string

	// Nullable fields (use Optional to allow explicit null)
	PaymentFrequency                                      lib.Optional[string]
	KeyHandoverDate                                       lib.Optional[time.Time]
	UtilityTransfersDate                                  lib.Optional[time.Time]
	PropertyInspectionDate                                lib.Optional[time.Time]
	TerminationAgreementDocumentUrl                       lib.Optional[string]
	TerminationAgreementDocumentPropertyManagerSignedAt   lib.Optional[time.Time]
	TerminationAgreementDocumentPropertyManagerSignedByID lib.Optional[string]
	TerminationAgreementDocumentTenantSignedAt            lib.Optional[time.Time]
	ParentLeaseId                                         lib.Optional[string]
}

func (s *leaseService) UpdateLease(ctx context.Context, input UpdateLeaseInput) (*models.Lease, error) {
	lease, getLeaseErr := s.repo.GetOneWithPopulate(ctx, repository.GetLeaseQuery{
		ID: input.LeaseID,
	})
	if getLeaseErr != nil {
		if errors.Is(getLeaseErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseNotFound", &pkg.RentLoopErrorParams{
				Err: getLeaseErr,
			})
		}
		return nil, pkg.InternalServerError(getLeaseErr.Error(), &pkg.RentLoopErrorParams{
			Err: getLeaseErr,
			Metadata: map[string]string{
				"function": "UpdateLease",
				"action":   "getting lease",
			},
		})
	}

	if lease.Status != "Lease.Status.Pending" {
		return nil, pkg.BadRequestError("LeaseIsNotPending", nil)
	}

	if input.Status != nil {
		lease.Status = *input.Status
	}

	if input.RentFee != nil {
		lease.RentFee = *input.RentFee
	}

	if input.RentFeeCurrency != nil {
		lease.RentFeeCurrency = *input.RentFeeCurrency
	}

	if input.MoveInDate != nil {
		lease.MoveInDate = *input.MoveInDate
	}

	if input.StayDurationFrequency != nil {
		lease.StayDurationFrequency = *input.StayDurationFrequency
	}

	if input.StayDuration != nil {
		lease.StayDuration = *input.StayDuration
	}

	if input.LeaseAgreementDocumentUrl != nil {
		lease.LeaseAgreementDocumentUrl = *input.LeaseAgreementDocumentUrl
	}

	if input.Meta != nil {
		meta, marshallErr := lib.InterfaceToJSON(*input.Meta)
		if marshallErr != nil {
			return nil, pkg.InternalServerError(marshallErr.Error(), &pkg.RentLoopErrorParams{
				Err: marshallErr,
				Metadata: map[string]string{
					"function": "UpdateLease",
					"action":   "marshalling meta",
				},
			})
		}

		lease.Meta = *meta
	}

	// Nullable fields - update if field was explicitly sent (allows setting to null)
	if input.PaymentFrequency.IsSet {
		lease.PaymentFrequency = input.PaymentFrequency.Ptr()
	}

	if input.KeyHandoverDate.IsSet {
		lease.KeyHandoverDate = input.KeyHandoverDate.Ptr()
	}

	if input.UtilityTransfersDate.IsSet {
		lease.UtilityTransfersDate = input.UtilityTransfersDate.Ptr()
	}

	if input.PropertyInspectionDate.IsSet {
		lease.PropertyInspectionDate = input.PropertyInspectionDate.Ptr()
	}

	if input.TerminationAgreementDocumentUrl.IsSet {
		lease.TerminationAgreementDocumentUrl = input.TerminationAgreementDocumentUrl.Ptr()
	}

	if input.ParentLeaseId.IsSet {
		lease.ParentLeaseId = input.ParentLeaseId.Ptr()
	}

	err := s.repo.Update(ctx, lease)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "UpdateLease",
				"action":   "updating lease",
			},
		})
	}

	return lease, nil
}

func (s *leaseService) GetByIDWithPopulate(ctx context.Context, query repository.GetLeaseQuery) (*models.Lease, error) {
	lease, err := s.repo.GetOneWithPopulate(ctx, query)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetByIDWithPopulate",
				"action":   "fetching lease",
			},
		})
	}

	return lease, nil
}

func (s *leaseService) ListLeases(ctx context.Context, filters repository.ListLeasesFilter) ([]models.Lease, error) {
	leases, err := s.repo.List(ctx, filters)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "List",
				"action":   "listing leases",
			},
		})
	}

	return *leases, nil
}

func (s *leaseService) CountLeases(ctx context.Context, filters repository.ListLeasesFilter) (int64, error) {
	count, err := s.repo.Count(ctx, filters)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountLeases",
				"action":   "counting leases",
			},
		})
	}

	return count, nil
}

type ActivateLeaseInput struct {
	LeaseID      string
	ClientUserId string
}

func (s *leaseService) ActivateLease(ctx context.Context, input ActivateLeaseInput) error {
	lease, getLeaseErr := s.repo.GetOneWithPopulate(
		ctx,
		repository.GetLeaseQuery{ID: input.LeaseID, Populate: &[]string{"Unit", "Tenant"}},
	)
	if getLeaseErr != nil {
		if errors.Is(getLeaseErr, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("LeaseNotFound", &pkg.RentLoopErrorParams{
				Err: getLeaseErr,
			})
		}
		return pkg.InternalServerError(getLeaseErr.Error(), &pkg.RentLoopErrorParams{
			Err: getLeaseErr,
			Metadata: map[string]string{
				"function": "ActivateLease",
				"action":   "getting lease",
			},
		})
	}

	if lease.Status == "Lease.Status.Active" {
		return pkg.BadRequestError("LeaseIsAlreadyActive", nil)
	}

	if lease.Status != "Lease.Status.Pending" {
		return pkg.BadRequestError("LeaseIsNotPending", nil)
	}

	lease.Status = "Lease.Status.Active"
	now := time.Now()
	lease.ActivatedAt = &now
	lease.ActivatedById = &input.ClientUserId

	// Set NextBillingDate based on initial deposit coverage
	if lease.PaymentFrequency != nil && *lease.PaymentFrequency != "OneTime" {

		var meta struct {
			InitialDepositFee int64 `json:"initial_deposit_fee"`
		}

		marshalErr := json.Unmarshal(lease.Meta, &meta)
		if marshalErr != nil {
			return pkg.InternalServerError(marshalErr.Error(), &pkg.RentLoopErrorParams{
				Err: marshalErr,
				Metadata: map[string]string{
					"function": "ActivateLease",
					"action":   "parsing lease meta",
				},
			})
		}

		base := lease.MoveInDate

		cyclesCovered := 0
		if lease.RentFee > 0 && meta.InitialDepositFee > 0 {
			cyclesCovered = int(meta.InitialDepositFee / lease.RentFee)
		}

		for i := 0; i < cyclesCovered; i++ {
			next := calculateNextBillingDate(base, *lease.PaymentFrequency)

			if next == nil {
				break
			}
			base = *next
		}

		lease.NextBillingDate = &base
	}

	err := s.repo.Update(ctx, lease)
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ActivateLease",
				"action":   "updating lease",
			},
		})
	}

	startDate := lease.MoveInDate.Format("January 2, 2006")

	smsMessage := strings.NewReplacer(
		"{{tenant_name}}", lease.Tenant.FirstName,
		"{{unit_name}}", lease.Unit.Name,
		"{{move_in_date}}", startDate,
	).Replace(lib.LEASE_ACTIVATED_SMS_BODY)

	if lease.Tenant.Email != nil {
		htmlBody, textBody, _ := s.appCtx.EmailEngine.Render("lease/activated", emailtemplates.LeaseActivatedData{
			TenantName: lease.Tenant.FirstName,
			UnitName:   lease.Unit.Name,
			MoveInDate: startDate,
		})
		go pkg.SendEmail(
			s.appCtx.Config,
			pkg.SendEmailInput{
				Recipient: *lease.Tenant.Email,
				Subject:   lib.LEASE_ACTIVATED_SUBJECT,
				HtmlBody:  htmlBody,
				TextBody:  textBody,
			},
		)
	}

	go s.appCtx.Clients.GatekeeperAPI.SendSMS(
		context.Background(),
		gatekeeper.SendSMSInput{
			Recipient: lease.Tenant.Phone,
			Message:   smsMessage,
		},
	)

	return nil
}

func (s *leaseService) GenerateLeaseRentInvoice(ctx context.Context, leaseID string) error {
	lease, getLeaseErr := s.repo.GetOneWithPopulate(
		ctx,
		repository.GetLeaseQuery{ID: leaseID, Populate: &[]string{"Unit.Property", "Tenant.TenantAccount"}},
	)
	if getLeaseErr != nil {
		if errors.Is(getLeaseErr, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("LeaseNotFound", &pkg.RentLoopErrorParams{
				Err: getLeaseErr,
			})
		}
		return pkg.InternalServerError(getLeaseErr.Error(), &pkg.RentLoopErrorParams{
			Err: getLeaseErr,
			Metadata: map[string]string{
				"function": "GenerateLeaseRentInvoice",
				"action":   "getting lease",
			},
		})
	}

	if lease.Status != "Lease.Status.Active" {
		return pkg.BadRequestError("LeaseIsNotActive", nil)
	}

	if lease.PaymentFrequency == nil || *lease.PaymentFrequency == "OneTime" {
		return pkg.BadRequestError("LeaseNotRecurring", nil)
	}

	if lease.NextBillingDate == nil {
		return pkg.BadRequestError("LeaseHasNoNextBillingDate", nil)
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	label := lib.RentInvoiceLabel(*lease.PaymentFrequency, *lease.NextBillingDate)
	grace := lib.RentInvoiceGracePeriod(*lease.PaymentFrequency)
	nextBillingDate := *lease.NextBillingDate
	dueDate := nextBillingDate.Add(grace)

	leaseIDStr := lease.ID.String()
	clientID := lease.Unit.Property.ClientID
	propertyID := lease.Unit.PropertyID
	invoice, invoiceErr := s.invoiceService.CreateInvoice(transCtx, CreateInvoiceInput{
		ClientID:             &clientID,
		PropertyID:           &propertyID,
		PayerType:            "TENANT",
		PayerLeaseID:         &leaseIDStr,
		NotificationTenantID: &lease.TenantId,
		PayeeType:            "PROPERTY_OWNER",
		PayeeClientID:        &clientID,
		ContextType:          "LEASE_RENT",
		ContextLeaseID:       &leaseIDStr,
		TotalAmount:          lease.RentFee,
		SubTotal:             lease.RentFee,
		Currency:             lease.RentFeeCurrency,
		Status:               "ISSUED",
		DueDate:              &dueDate,
		LineItems: []LineItemInput{
			{
				Label:       label,
				Category:    "RENT",
				Quantity:    1,
				UnitAmount:  lease.RentFee,
				TotalAmount: lease.RentFee,
				Currency:    lease.RentFeeCurrency,
			},
		},
	})
	if invoiceErr != nil {
		return invoiceErr
	}

	// Advance NextBillingDate
	lease.NextBillingDate = calculateNextBillingDate(*lease.NextBillingDate, *lease.PaymentFrequency)
	updateErr := s.repo.Update(transCtx, lease)
	if updateErr != nil {
		transaction.Rollback()
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateErr,
			Metadata: map[string]string{
				"function": "GenerateLeaseRentInvoice",
				"action":   "updating lease with next billing date",
			},
		})
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		return pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"function": "GenerateLeaseRentInvoice",
				"action":   "committing transaction",
			},
		})
	}

	// Fire-and-forget notifications
	invoiceCode := invoice.Code
	unitName := lease.Unit.Name
	tenantName := lease.Tenant.FirstName
	currency := lease.RentFeeCurrency
	amount := lib.FormatAmount(lib.PesewasToCedis(int64(lease.RentFee)))

	smsMessage := strings.NewReplacer(
		"{{tenant_name}}", tenantName,
		"{{unit_name}}", unitName,
		"{{invoice_code}}", invoiceCode,
		"{{currency}}", currency,
		"{{amount}}", amount,
	).Replace(lib.RENT_INVOICE_GENERATED_SMS_BODY)

	if lease.Tenant.Email != nil {
		htmlBody, textBody, _ := s.appCtx.EmailEngine.Render(
			"invoice/rent-generated",
			emailtemplates.RentInvoiceGeneratedData{
				TenantName:  tenantName,
				InvoiceCode: invoiceCode,
				UnitName:    unitName,
				Currency:    currency,
				Amount:      amount,
			},
		)
		go pkg.SendEmail(
			s.appCtx.Config,
			pkg.SendEmailInput{
				Recipient: *lease.Tenant.Email,
				Subject:   lib.RENT_INVOICE_GENERATED_SUBJECT,
				HtmlBody:  htmlBody,
				TextBody:  textBody,
			},
		)
	}

	go s.appCtx.Clients.GatekeeperAPI.SendSMS(
		context.Background(),
		gatekeeper.SendSMSInput{
			Recipient: lease.Tenant.Phone,
			Message:   smsMessage,
		},
	)

	if lease.Tenant.TenantAccount != nil {
		tenantAccountID := lease.Tenant.TenantAccount.ID.String()
		invoiceID := invoice.ID.String()
		go func() {
			_ = s.notificationService.SendToTenantAccount(
				context.Background(),
				tenantAccountID,
				"Rent Invoice Ready",
				fmt.Sprintf("Your rent invoice %s for %s is ready for payment.", invoiceCode, unitName),
				map[string]string{
					"type":         "INVOICE",
					"invoice_id":   invoiceID,
					"invoice_code": invoiceCode,
				},
			)
		}()
	}

	return nil
}

type CancelLeaseInput struct {
	LeaseID            string
	CancellationReason string
	ClientUserId       string
}

func (s *leaseService) CancelLease(ctx context.Context, input CancelLeaseInput) error {
	lease, getLeaseErr := s.repo.GetOneWithPopulate(
		ctx,
		repository.GetLeaseQuery{ID: input.LeaseID, Populate: &[]string{"Unit", "Tenant"}},
	)
	if getLeaseErr != nil {
		if errors.Is(getLeaseErr, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("LeaseNotFound", &pkg.RentLoopErrorParams{
				Err: getLeaseErr,
			})
		}
		return pkg.InternalServerError(getLeaseErr.Error(), &pkg.RentLoopErrorParams{
			Err: getLeaseErr,
			Metadata: map[string]string{
				"function": "CancelLease",
				"action":   "getting lease",
			},
		})
	}

	if lease.Status == "Lease.Status.Cancelled" {
		return pkg.BadRequestError("LeaseIsAlreadyCancelled", nil)
	}

	if lease.Status != "Lease.Status.Pending" {
		return pkg.BadRequestError("LeaseIsNotPending", nil)
	}

	lease.Status = "Lease.Status.Cancelled"
	now := time.Now()
	lease.CancelledAt = &now
	lease.CancelledById = &input.ClientUserId

	err := s.repo.Update(ctx, lease)
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CancelLease",
				"action":   "updating lease",
			},
		})
	}

	smsMessage := strings.NewReplacer(
		"{{tenant_name}}", lease.Tenant.FirstName,
		"{{unit_name}}", lease.Unit.Name,
		"{{cancellation_reason}}", input.CancellationReason,
	).Replace(lib.LEASE_CANCELLED_SMS_BODY)

	if lease.Tenant.Email != nil {
		htmlBody, textBody, _ := s.appCtx.EmailEngine.Render("lease/cancelled", emailtemplates.LeaseCancelledData{
			TenantName:         lease.Tenant.FirstName,
			UnitName:           lease.Unit.Name,
			CancellationReason: input.CancellationReason,
		})
		go pkg.SendEmail(
			s.appCtx.Config,
			pkg.SendEmailInput{
				Recipient: *lease.Tenant.Email,
				Subject:   lib.LEASE_CANCELLED_SUBJECT,
				HtmlBody:  htmlBody,
				TextBody:  textBody,
			},
		)
	}

	go s.appCtx.Clients.GatekeeperAPI.SendSMS(
		context.Background(),
		gatekeeper.SendSMSInput{
			Recipient: lease.Tenant.Phone,
			Message:   smsMessage,
		},
	)

	return nil
}
