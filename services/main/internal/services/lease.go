package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/lib/emailtemplates"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services/financials"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/lib/pq"
	log "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type LeaseService interface {
	CreateLease(context context.Context, input CreateLeaseInput) (*models.Lease, error)
	UpdateLease(context context.Context, input UpdateLeaseInput) (*models.Lease, error)
	GetByIDWithPopulate(context context.Context, query repository.GetLeaseQuery) (*models.Lease, error)
	// GetCurrentForAccount returns the account's Active lease, or its most
	// recent by move-in date. The fallback for attributing money to a term
	// when the charges themselves cannot say which one they belong to.
	GetCurrentForAccount(context context.Context, financialAccountID string) (*models.Lease, error)
	// SetFinancialAccount writes the lease half of the lease <-> account link.
	SetFinancialAccount(context context.Context, leaseID, financialAccountID string) error
	// RenewLease continues a tenancy with a new term. The renewal is created
	// Pending; the daily lifecycle sweeps activate it and complete the parent.
	RenewLease(context context.Context, input RenewLeaseInput) (*models.Lease, error)
	// ListTermsForAccount and HasMoveOutEvidence together satisfy
	// financials.LeaseTermReader, which is how the closure service reads lease
	// state without the financials package importing this one.
	ListTermsForAccount(context context.Context, financialAccountID string) ([]financials.LeaseTerm, error)
	HasMoveOutEvidence(context context.Context, financialAccountID string) (bool, error)
	ListLeases(context context.Context, filters repository.ListLeasesFilter) ([]models.Lease, error)
	CountLeases(context context.Context, filters repository.ListLeasesFilter) (int64, error)
	ActivateLease(context context.Context, input ActivateLeaseInput) error
	CancelLease(context context.Context, input CancelLeaseInput) error
	CountOccupyingByUnitID(context context.Context, unitID string) (int64, error)
	CompleteLease(ctx context.Context, leaseID string) (*models.Lease, error)
	// onlyLeaseID empty means every due lease, which is what the cron passes.
	// A non-empty value restricts the sweep to one lease so a caller can
	// exercise it without transitioning every other lease in the database as
	// a side effect — the same reason IssueDueInvoicesForAccount exists.
	ActivateDueLeases(ctx context.Context, onlyLeaseID string) (activated int, failed int, err error)
	CompleteDueLeases(ctx context.Context, onlyLeaseID string) (completed int, failed int, err error)
	ResolveManagerRecipient(ctx context.Context, lease *models.Lease) (*models.ClientUser, error)
}

type leaseService struct {
	appCtx               pkg.AppContext
	repo                 repository.LeaseRepository
	invoiceService       InvoiceService
	notificationService  NotificationService
	unitDateBlockService UnitDateBlockService
	unitService          UnitService
	clientUserRepo       repository.ClientUserRepository
	userRepo             repository.UserRepository
	financials           *financials.Financials
}

func NewLeaseService(
	appCtx pkg.AppContext,
	repo repository.LeaseRepository,
	invoiceService InvoiceService,
	notificationService NotificationService,
	unitDateBlockService UnitDateBlockService,
	unitService UnitService,
	clientUserRepo repository.ClientUserRepository,
	userRepo repository.UserRepository,
	financialsFacade *financials.Financials,
) LeaseService {
	return &leaseService{
		appCtx:               appCtx,
		repo:                 repo,
		invoiceService:       invoiceService,
		notificationService:  notificationService,
		unitDateBlockService: unitDateBlockService,
		clientUserRepo:       clientUserRepo,
		userRepo:             userRepo,
		unitService:          unitService,
		financials:           financialsFacade,
	}
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
	LeaseAgreementDocumentUrl       *string // nullable — may not be set at creation time
	TerminationAgreementDocumentUrl *string
	ParentLeaseId                   *string
	Type                            string
}

// leaseFromCreateInput maps the service input onto the model.
//
// Extracted so the mapping is testable without a database — it existed inline,
// and that is how ParentLeaseId came to be declared in the input and never
// assigned, silently dropping every renewal's lineage.
func leaseFromCreateInput(input CreateLeaseInput) models.Lease {
	leaseType := input.Type
	if leaseType == "" {
		leaseType = models.LeaseTypeOriginal
	}

	return models.Lease{
		Status:                          input.Status,
		Type:                            leaseType,
		UnitId:                          input.UnitId,
		TenantId:                        input.TenantId,
		TenantApplicationId:             input.TenantApplicationId,
		RentFee:                         input.RentFee,
		RentFeeCurrency:                 input.RentFeeCurrency,
		PaymentFrequency:                input.PaymentFrequency,
		MoveInDate:                      input.MoveInDate,
		StayDurationFrequency:           input.StayDurationFrequency,
		StayDuration:                    input.StayDuration,
		KeyHandoverDate:                 input.KeyHandoverDate,
		UtilityTransfersDate:            input.UtilityTransfersDate,
		PropertyInspectionDate:          input.PropertyInspectionDate,
		LeaseAgreementDocumentUrl:       input.LeaseAgreementDocumentUrl,
		TerminationAgreementDocumentUrl: input.TerminationAgreementDocumentUrl,
		ParentLeaseId:                   input.ParentLeaseId,
	}
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

	moveOutDate := leaseEndDate(input.MoveInDate, input.StayDuration, input.StayDurationFrequency)

	// Meta and MoveOutDate are computed here rather than mapped, so they are
	// assigned onto the mapped struct.
	lease := leaseFromCreateInput(input)
	lease.Meta = *metaJson
	lease.MoveOutDate = &moveOutDate

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

	if input.MoveInDate != nil || input.StayDurationFrequency != nil || input.StayDuration != nil {
		if input.MoveInDate != nil {
			lease.MoveInDate = *input.MoveInDate
		}

		if input.StayDurationFrequency != nil {
			lease.StayDurationFrequency = *input.StayDurationFrequency
		}

		if input.StayDuration != nil {
			lease.StayDuration = *input.StayDuration
		}

		moveOutDate := leaseEndDate(lease.MoveInDate, lease.StayDuration, lease.StayDurationFrequency)
		lease.MoveOutDate = &moveOutDate
		// Previously-sent thresholds were computed against the old MoveOutDate
		// and no longer apply now that it has moved.
		lease.RemindersSent = pq.StringArray{}
	}

	if input.LeaseAgreementDocumentUrl != nil {
		lease.LeaseAgreementDocumentUrl = input.LeaseAgreementDocumentUrl
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

	// Rent terms changed on a pending lease — regenerate the schedule so the
	// ledger matches what was just agreed.
	//
	// RederiveRent rejects with ChargesAlreadyBilled if any rent charge has
	// been invoiced or settled. That is deliberate: once a tenant has seen a
	// figure, the schedule stops being rewritable behind their back and the
	// landlord must adjust with explicit charges instead.
	if input.MoveInDate != nil || input.RentFee != nil || input.StayDuration != nil ||
		input.StayDurationFrequency != nil {
		if account, accErr := s.accountForLease(ctx, lease); accErr == nil && account != nil &&
			lease.PaymentFrequency != nil {
			rederiveErr := s.financials.Charges.RederiveRent(ctx, financials.RederiveRentInput{
				FinancialAccountID:    account.ID.String(),
				RentFee:               lease.RentFee,
				Currency:              lease.RentFeeCurrency,
				PaymentFrequency:      *lease.PaymentFrequency,
				MoveInDate:            lease.MoveInDate,
				StayDuration:          lease.StayDuration,
				StayDurationFrequency: lease.StayDurationFrequency,
			})
			if rederiveErr != nil {
				return nil, rederiveErr
			}
		}
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

// recomputeAccountEligibility re-evaluates whether the lease's account looks
// finished, after any status transition.
//
// Activation matters as much as termination: activating a renewal on an
// account that had gone CLOSURE_ELIGIBLE must pull it back to ACTIVE.
//
// Failures are logged, never returned. Eligibility is advisory — it decides
// what a PM is shown, not what is true — so it must not fail the status change
// the user actually asked for. The daily sweep corrects any drift.
func (s *leaseService) recomputeAccountEligibility(ctx context.Context, lease *models.Lease) {
	if lease == nil || lease.FinancialAccountID == nil || s.financials.Closure == nil {
		return
	}

	if err := s.financials.Closure.RecomputeEligibility(ctx, *lease.FinancialAccountID); err != nil {
		log.WithError(err).Error("[LeaseService] recomputing closure eligibility")
	}
}

// SetFinancialAccount points a lease at the financial relationship it belongs
// to. Many leases share one account, so this FK lives on the lease.
//
// Delegates a targeted UPDATE rather than reading the lease back first:
// approval calls this inside its transaction, right after creating the lease,
// and the repository's getter reads outside the transaction.
func (s *leaseService) SetFinancialAccount(ctx context.Context, leaseID, financialAccountID string) error {
	if err := s.repo.SetFinancialAccount(ctx, leaseID, financialAccountID); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "SetFinancialAccount", "action": "linking account"},
		})
	}

	return nil
}

func (s *leaseService) GetCurrentForAccount(
	ctx context.Context,
	financialAccountID string,
) (*models.Lease, error) {
	return s.repo.GetCurrentForAccount(ctx, financialAccountID)
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

	s.attachFinancials(ctx, lease)

	return lease, nil
}

// attachFinancials hangs the account's balance off the lease.
//
// The account is created against the application and linked to the lease at
// approval, so lease_id is the only handle a lease has on it — the preloaded
// TenantApplication cannot carry it, because its own Financials field is a
// computed view rather than a relation and GORM leaves it nil.
//
// ListTermsForAccount satisfies financials.LeaseTermReader. It hands the
// closure service the account's terms as plain values, so the closure rules
// stay testable without a database.
func (s *leaseService) ListTermsForAccount(
	ctx context.Context,
	financialAccountID string,
) ([]financials.LeaseTerm, error) {
	leases, err := s.repo.List(ctx, repository.ListLeasesFilter{
		FinancialAccountID: &financialAccountID,
	})
	if err != nil {
		return nil, err
	}

	terms := make([]financials.LeaseTerm, 0, len(*leases))
	for _, lease := range *leases {
		terms = append(terms, financials.LeaseTerm{
			ID:     lease.ID.String(),
			Status: lease.Status,
		})
	}

	return terms, nil
}

// HasMoveOutEvidence satisfies financials.LeaseTermReader.
func (s *leaseService) HasMoveOutEvidence(ctx context.Context, financialAccountID string) (bool, error) {
	return s.repo.HasMoveOutEvidenceForAccount(ctx, financialAccountID)
}

// accountForLease resolves the financial relationship a lease belongs to.
//
// The lookup now runs lease -> account. It used to run account -> lease, on a
// unique financial_accounts.lease_id, which stopped being possible once one
// account began spanning every term of a tenancy.
//
// A nil account is not an error: a lease whose charges were never prepared
// simply has no relationship yet.
func (s *leaseService) accountForLease(
	ctx context.Context,
	lease *models.Lease,
) (*models.FinancialAccount, error) {
	if lease == nil || lease.FinancialAccountID == nil {
		return nil, nil
	}

	return s.financials.Accounts.GetByID(ctx, *lease.FinancialAccountID)
}

// Failures are non-fatal: a lease whose charges were never prepared simply has
// no financials, which the UI renders as "no account".
func (s *leaseService) attachFinancials(ctx context.Context, lease *models.Lease) {
	if lease == nil {
		return
	}

	account, accErr := s.accountForLease(ctx, lease)
	if accErr != nil || account == nil {
		return
	}

	accountID := account.ID.String()
	summary, summaryErr := s.financials.Accounts.Summary(ctx, accountID)
	if summaryErr != nil {
		return
	}

	_, invoiceCount, _ := s.invoiceService.ListInvoices(ctx, repository.ListInvoicesFilter{
		FinancialAccountID: &accountID,
	})

	lease.Financials = &models.AccountFinancials{
		Account:           account,
		TotalCharged:      summary.TotalCharged,
		TotalSettled:      summary.TotalSettled,
		OutstandingAmount: summary.OutstandingAmount,
		AvailableCredit:   summary.AvailableCredit,
		ChargeCount:       int64(len(summary.Charges)),
		InvoiceCount:      invoiceCount,
		RentTermsLocked:   financials.RentTermsLocked(summary.Charges),
	}
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
	LeaseID string
	// ClientUserId is nil when the activation cron acts rather than a person.
	// Lease.ActivatedById is already nullable and the one consumer of the
	// association — resolveCachedManagerRecipient in internal/queue — already
	// falls back to ResolveManagerRecipient when it is absent, so a
	// system-activated lease needs no other special handling.
	ClientUserId *string
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
	lease.ActivatedById = input.ClientUserId

	// Activation does no financial work. The initial deposit is a billing
	// cadence on the FinancialAccount, set when charges were prepared, and what
	// is due is decided by charge-instance state rather than a per-lease cursor.

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

	// Create UnitDateBlock for the lease duration (for availability calendar)
	go func() {
		leaseID := lease.ID.String()
		moveOutDate := lease.MoveOutDate
		if moveOutDate == nil {
			computed := leaseEndDate(lease.MoveInDate, lease.StayDuration, lease.StayDurationFrequency)
			moveOutDate = &computed
		}
		_, _ = s.unitDateBlockService.CreateSystemBlock(context.Background(), CreateSystemBlockInput{
			UnitID:    lease.UnitId,
			StartDate: lease.MoveInDate,
			EndDate:   *moveOutDate,
			BlockType: "LEASE",
			LeaseID:   &leaseID,
			Reason:    "Active lease",
		})
	}()

	startDate := lease.MoveInDate.Format("January 2, 2006")

	smsMessage := strings.NewReplacer(
		"{{tenant_name}}", lease.Tenant.FirstName,
		"{{unit_name}}", lease.Unit.Name,
		"{{move_in_date}}", startDate,
	).Replace(lib.LEASE_ACTIVATED_SMS_BODY)

	if lease.Tenant.Email != nil {
		if htmlBody, textBody, renderErr := s.appCtx.EmailEngine.Render("lease/activated", emailtemplates.LeaseActivatedData{
			TenantName: lease.Tenant.FirstName,
			UnitName:   lease.Unit.Name,
			MoveInDate: startDate,
		}); renderErr != nil {
			log.WithError(renderErr).Error("failed to render lease/activated email template")
		} else {
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
	}

	go s.appCtx.Clients.GatekeeperAPI.SendSMS(
		context.Background(),
		gatekeeper.SendSMSInput{
			Recipient: lease.Tenant.Phone,
			Message:   smsMessage,
		},
	)

	s.recomputeAccountEligibility(ctx, lease)

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
		if htmlBody, textBody, renderErr := s.appCtx.EmailEngine.Render("lease/cancelled", emailtemplates.LeaseCancelledData{
			TenantName:         lease.Tenant.FirstName,
			UnitName:           lease.Unit.Name,
			CancellationReason: input.CancellationReason,
		}); renderErr != nil {
			log.WithError(renderErr).Error("failed to render lease/cancelled email template")
		} else {
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
	}

	go s.appCtx.Clients.GatekeeperAPI.SendSMS(
		context.Background(),
		gatekeeper.SendSMSInput{
			Recipient: lease.Tenant.Phone,
			Message:   smsMessage,
		},
	)

	s.recomputeAccountEligibility(ctx, lease)

	return nil
}

// ActivateDueLeases moves every Pending lease whose move-in date has arrived to
// Active. One lease failing must not abort the sweep, so failures are counted
// and logged rather than returned; the error return is reserved for failing to
// read the candidate set at all.
func (s *leaseService) ActivateDueLeases(ctx context.Context, onlyLeaseID string) (int, int, error) {
	leases, err := s.repo.ListDueForActivation(ctx)
	if err != nil {
		return 0, 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ActivateDueLeases",
				"action":   "listing leases due for activation",
			},
		})
	}

	var activated, failed int
	for i := range *leases {
		leaseID := (*leases)[i].ID.String()

		if onlyLeaseID != "" && leaseID != onlyLeaseID {
			continue
		}

		// ClientUserId stays nil: no person is acting.
		if activateErr := s.ActivateLease(ctx, ActivateLeaseInput{LeaseID: leaseID}); activateErr != nil {
			log.WithError(activateErr).WithField("lease_id", leaseID).
				Error("failed to activate lease")
			failed++
			continue
		}

		activated++
	}

	return activated, failed, nil
}

// CompleteDueLeases completes every lease whose move-out date has fully passed.
// Same failure policy as ActivateDueLeases.
func (s *leaseService) CompleteDueLeases(ctx context.Context, onlyLeaseID string) (int, int, error) {
	leases, err := s.repo.ListDueForCompletion(ctx)
	if err != nil {
		return 0, 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CompleteDueLeases",
				"action":   "listing leases due for completion",
			},
		})
	}

	var completed, failed int
	for i := range *leases {
		leaseID := (*leases)[i].ID.String()

		if onlyLeaseID != "" && leaseID != onlyLeaseID {
			continue
		}

		if _, completeErr := s.CompleteLease(ctx, leaseID); completeErr != nil {
			log.WithError(completeErr).WithField("lease_id", leaseID).
				Error("failed to complete lease")
			failed++
			continue
		}

		completed++
	}

	return completed, failed, nil
}

// isCompletableStatus reports whether a lease in this status may transition to
// Completed.
//
// Pending is admitted deliberately, and ListDueForCompletion selects it for the
// same reason: some managers never explicitly activate a lease before move-out.
// Auto-activation now covers the common case, but a lease created after its own
// move-out date can still never have been Active, and it must not be stranded —
// while Pending it holds its unit's occupancy, so it would block the unit
// forever. Completed rather than Cancelled because the ledger is real: these
// leases carry charges and invoices, and Cancelled would assert the tenancy
// never happened while arrears sit against it.
func isCompletableStatus(status string) bool {
	return status == "Lease.Status.Active" || status == "Lease.Status.Pending"
}

func (s *leaseService) CompleteLease(ctx context.Context, leaseID string) (*models.Lease, error) {
	lease, getLeaseErr := s.repo.GetOneWithPopulate(ctx, repository.GetLeaseQuery{
		ID:       leaseID,
		Populate: &[]string{"Unit.Property", "Tenant.TenantAccount", "ActivatedBy.User"},
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
				"function": "CompleteLease",
				"action":   "getting lease",
			},
		})
	}

	if !isCompletableStatus(lease.Status) {
		return nil, pkg.BadRequestError("LeaseIsNotCompletable", nil)
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	now := time.Now()
	lease.Status = "Lease.Status.Completed"
	lease.CompletedAt = &now

	if updateErr := s.repo.Update(transCtx, lease); updateErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateErr,
			Metadata: map[string]string{
				"function": "CompleteLease",
				"action":   "updating lease status",
			},
		})
	}

	// Release the unit inside the same transaction — if this fails, the whole
	// completion rolls back so the lease stays Active and is retried by the
	// next cron run, instead of being stuck Completed with a stale unit status.
	if releaseErr := releaseUnitIfNoActiveLease(transCtx, s.repo, s.unitService, &lease.Unit); releaseErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(releaseErr.Error(), &pkg.RentLoopErrorParams{
			Err: releaseErr,
			Metadata: map[string]string{
				"function": "CompleteLease",
				"action":   "releasing unit",
			},
		})
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"function": "CompleteLease",
				"action":   "committing transaction",
			},
		})
	}

	unitName := lease.Unit.Name

	smsMessage := strings.NewReplacer(
		"{{tenant_name}}", lease.Tenant.FirstName,
		"{{unit_name}}", unitName,
	).Replace(lib.LEASE_COMPLETED_SMS_BODY)

	if lease.Tenant.Email != nil {
		if htmlBody, textBody, renderErr := s.appCtx.EmailEngine.Render(
			"lease/completed",
			emailtemplates.LeaseCompletedData{TenantName: lease.Tenant.FirstName, UnitName: unitName},
		); renderErr != nil {
			log.WithError(renderErr).Error("failed to render lease/completed email template")
		} else {
			go pkg.SendEmail(
				s.appCtx.Config,
				pkg.SendEmailInput{
					Recipient: *lease.Tenant.Email,
					Subject:   lib.LEASE_COMPLETED_SUBJECT,
					HtmlBody:  htmlBody,
					TextBody:  textBody,
				},
			)
		}
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
		leaseID := lease.ID.String()
		go func() {
			_ = s.notificationService.SendToTenantAccount(
				context.Background(),
				tenantAccountID,
				lib.LEASE_COMPLETED_SUBJECT,
				smsMessage,
				map[string]string{"type": "LEASE_COMPLETED", "lease_id": leaseID},
			)
		}()
	}

	manager, managerErr := s.ResolveManagerRecipient(ctx, lease)
	if managerErr != nil {
		log.WithError(managerErr).WithField("lease_id", lease.ID.String()).
			Warn("failed to resolve manager recipient for lease completion")
		return lease, nil
	}

	if manager.User.Email != "" {
		if htmlBody, textBody, renderErr := s.appCtx.EmailEngine.Render(
			"lease/completed-manager",
			emailtemplates.LeaseCompletedManagerData{
				ManagerName: manager.User.Name,
				TenantName:  lease.Tenant.FirstName,
				UnitName:    unitName,
			},
		); renderErr != nil {
			log.WithError(renderErr).Error("failed to render lease/completed-manager email template")
		} else {
			go pkg.SendEmail(
				s.appCtx.Config,
				pkg.SendEmailInput{
					Recipient: manager.User.Email,
					Subject:   lib.PM_LEASE_COMPLETED_SUBJECT,
					HtmlBody:  htmlBody,
					TextBody:  textBody,
				},
			)
		}
	}

	s.recomputeAccountEligibility(ctx, lease)

	return lease, nil
}

// ResolveManagerRecipient returns the ClientUser who should be notified about
// lease lifecycle events: the manager who activated the lease, or the
// account owner if that's unavailable (e.g. the lease predates this feature,
// or the activating user has no email on file).
func (s *leaseService) ResolveManagerRecipient(ctx context.Context, lease *models.Lease) (*models.ClientUser, error) {
	if lease.ActivatedBy != nil && lease.ActivatedBy.User.Email != "" {
		return lease.ActivatedBy, nil
	}

	owner, err := s.clientUserRepo.GetByQuery(ctx, map[string]any{
		"client_id": lease.Unit.Property.ClientID,
		"role":      "OWNER",
	})
	if err != nil {
		return nil, err
	}

	user, err := s.userRepo.GetByID(ctx, owner.UserID)
	if err != nil {
		return nil, err
	}
	owner.User = *user

	return owner, nil
}

// releaseUnitIfNoActiveLease re-evaluates a unit's occupancy status after one
// of its leases ends. Mirrors the exact counting/threshold logic
// ApproveTenantApplication uses when a lease is added (internal/services/
// tenant-application.go), just run in reverse: re-count remaining
// Pending/Active leases against the unit's MaxOccupantsAllowed and downgrade
// accordingly — Available if none remain, PartiallyOccupied if some remain
// but under capacity (covers multi-tenant units losing one of several
// tenants), or left as-is if still at/over capacity. Shared by CompleteLease
// and LeaseTerminationService.Complete — the two places a lease ending can
// change a unit's occupancy — so this rule lives once.
func releaseUnitIfNoActiveLease(
	ctx context.Context,
	leaseRepo repository.LeaseRepository,
	unitService UnitService,
	unit *models.Unit,
) error {
	remainingCount, err := leaseRepo.CountActiveByUnitID(ctx, unit.ID.String())
	if err != nil {
		return err
	}

	var newStatus string
	switch {
	case remainingCount == 0:
		newStatus = "Unit.Status.Available"
	case remainingCount < int64(unit.MaxOccupantsAllowed):
		newStatus = "Unit.Status.PartiallyOccupied"
	default:
		// Still at or over capacity from the remaining leases — no change.
		return nil
	}

	if unit.Status == newStatus {
		return nil
	}

	return unitService.SetSystemUnitStatus(ctx, UpdateUnitStatusInput{
		UnitID:     unit.ID.String(),
		PropertyID: unit.PropertyID,
		Status:     newStatus,
	})
}

// leaseEndDate calculates the expected end date from a lease's move-in date, duration, and frequency.
// Mirrors the backfill migration logic. Falls back to 2099-01-01 for open-ended leases.
// leaseEndDate computes MoveOutDate from MoveInDate + (duration × frequency).
// frequency is stored using the same HOURLY/DAILY/WEEKLY/MONTHLY/QUARTERLY/
// BIANNUALLY/ANNUALLY vocabulary as PaymentFrequency (StayDurationFrequency
// defaults from unit.PaymentFrequency on tenant application creation), not the
// "Hours/Days/Months" duration-unit words — those are accepted too for
// backward compatibility with any rows written using that vocabulary.
func leaseEndDate(moveIn time.Time, duration int64, frequency string) time.Time {
	if duration == 0 || frequency == "" {
		return time.Date(2099, 1, 1, 0, 0, 0, 0, time.UTC)
	}
	switch strings.ToLower(frequency) {
	case "hourly", "hours", "hour":
		return moveIn.Add(time.Duration(duration) * time.Hour)
	case "daily", "days", "day":
		return moveIn.AddDate(0, 0, int(duration))
	case "weekly", "weeks", "week":
		return moveIn.AddDate(0, 0, int(duration)*7)
	case "monthly", "months", "month":
		return moveIn.AddDate(0, int(duration), 0)
	case "quarterly":
		return moveIn.AddDate(0, int(duration)*3, 0)
	case "biannually":
		return moveIn.AddDate(0, int(duration)*6, 0)
	case "annually", "yearly", "years", "year":
		return moveIn.AddDate(int(duration), 0, 0)
	default:
		return time.Date(2099, 1, 1, 0, 0, 0, 0, time.UTC)
	}
}
