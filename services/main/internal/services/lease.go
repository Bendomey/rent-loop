package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
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
	ActivateLease(context context.Context, leaseID string) error
}

type leaseService struct {
	appCtx pkg.AppContext
	repo   repository.LeaseRepository
}

func NewLeaseService(appCtx pkg.AppContext, repo repository.LeaseRepository) LeaseService {
	return &leaseService{appCtx: appCtx, repo: repo}
}

type CreateLeaseInput struct {
	Status                                                string
	UnitId                                                string
	TenantId                                              string
	TenantApplicationId                                   string
	RentFee                                               int64
	RentFeeCurrency                                       string
	PaymentFrequency                                      *string
	Meta                                                  map[string]any
	MoveInDate                                            time.Time
	StayDurationFrequency                                 string
	StayDuration                                          int64
	KeyHandoverDate                                       *time.Time
	UtilityTransfersDate                                  *time.Time
	PropertyInspectionDate                                *time.Time
	LeaseAggreementDocumentMode                           *string
	LeaseAgreementDocumentUrl                             string
	LeaseAgreementDocumentPropertyManagerSignedById       *string
	LeaseAgreementDocumentPropertyManagerSignedAt         *time.Time
	LeaseAgreementDocumentTenantSignedAt                  *time.Time
	TerminationAgreementDocumentUrl                       *string
	TerminationAgreementDocumentPropertyManagerSignedAt   *time.Time
	TerminationAgreementDocumentPropertyManagerSignedByID *string
	TerminationAgreementDocumentTenantSignedAt            *time.Time
	ParentLeaseId                                         *string
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
		Status:                      input.Status,
		UnitId:                      input.UnitId,
		TenantId:                    input.TenantId,
		TenantApplicationId:         input.TenantApplicationId,
		RentFee:                     input.RentFee,
		RentFeeCurrency:             input.RentFeeCurrency,
		PaymentFrequency:            input.PaymentFrequency,
		Meta:                        *metaJson,
		MoveInDate:                  input.MoveInDate,
		StayDurationFrequency:       input.StayDurationFrequency,
		StayDuration:                input.StayDuration,
		KeyHandoverDate:             input.KeyHandoverDate,
		UtilityTransfersDate:        input.UtilityTransfersDate,
		PropertyInspectionDate:      input.PropertyInspectionDate,
		LeaseAggreementDocumentMode: input.LeaseAggreementDocumentMode,
		LeaseAgreementDocumentUrl:   input.LeaseAgreementDocumentUrl,
		LeaseAgreementDocumentPropertyManagerSignedById:     input.LeaseAgreementDocumentPropertyManagerSignedById,
		LeaseAgreementDocumentPropertyManagerSignedAt:       input.LeaseAgreementDocumentPropertyManagerSignedAt,
		LeaseAgreementDocumentTenantSignedAt:                input.LeaseAgreementDocumentTenantSignedAt,
		TerminationAgreementDocumentUrl:                     input.TerminationAgreementDocumentUrl,
		TerminationAgreementDocumentPropertyManagerSignedAt: input.TerminationAgreementDocumentPropertyManagerSignedAt,
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

type UpdateLeaseInput struct {
	LeaseID                                               string
	Status                                                *string
	RentFee                                               *int64
	RentFeeCurrency                                       *string
	PaymentFrequency                                      *string
	Meta                                                  *map[string]any
	MoveInDate                                            *time.Time
	StayDurationFrequency                                 *string
	StayDuration                                          *int64
	KeyHandoverDate                                       *time.Time
	UtilityTransfersDate                                  *time.Time
	PropertyInspectionDate                                *time.Time
	LeaseAggreementDocumentMode                           *string
	LeaseAgreementDocumentUrl                             *string
	LeaseAgreementDocumentPropertyManagerSignedById       *string
	LeaseAgreementDocumentPropertyManagerSignedAt         *time.Time
	LeaseAgreementDocumentTenantSignedAt                  *time.Time
	TerminationAgreementDocumentUrl                       *string
	TerminationAgreementDocumentPropertyManagerSignedAt   *time.Time
	TerminationAgreementDocumentPropertyManagerSignedByID *string
	TerminationAgreementDocumentTenantSignedAt            *time.Time
	ParentLeaseId                                         *string
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

	lease.PaymentFrequency = input.PaymentFrequency

	lease.KeyHandoverDate = input.KeyHandoverDate

	lease.UtilityTransfersDate = input.UtilityTransfersDate

	lease.PropertyInspectionDate = input.PropertyInspectionDate

	lease.LeaseAggreementDocumentMode = input.LeaseAggreementDocumentMode

	lease.LeaseAgreementDocumentPropertyManagerSignedById = input.LeaseAgreementDocumentPropertyManagerSignedById

	lease.LeaseAgreementDocumentPropertyManagerSignedAt = input.LeaseAgreementDocumentPropertyManagerSignedAt

	lease.LeaseAgreementDocumentTenantSignedAt = input.LeaseAgreementDocumentTenantSignedAt

	lease.TerminationAgreementDocumentUrl = input.TerminationAgreementDocumentUrl

	lease.TerminationAgreementDocumentPropertyManagerSignedAt = input.TerminationAgreementDocumentPropertyManagerSignedAt

	lease.TerminationAgreementDocumentPropertyManagerSignedByID = input.TerminationAgreementDocumentPropertyManagerSignedByID

	lease.TerminationAgreementDocumentTenantSignedAt = input.TerminationAgreementDocumentTenantSignedAt

	lease.ParentLeaseId = input.ParentLeaseId

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

func (s *leaseService) ActivateLease(ctx context.Context, leaseID string) error {
	lease, getLeaseErr := s.repo.GetOneWithPopulate(
		ctx,
		repository.GetLeaseQuery{ID: leaseID, Populate: &[]string{"Unit", "Tenant"}},
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

	message := strings.NewReplacer(
		"{{tenant_name}}", lease.Tenant.FirstName,
		"{{unit_name}}", lease.Unit.Name,
		"{{move_in_date}}", startDate,
	).Replace(lib.LEASE_ACTIVATED_BODY)

	if lease.Tenant.Email != nil {
		go pkg.SendEmail(
			s.appCtx,
			pkg.SendEmailInput{
				Recipient: *lease.Tenant.Email,
				Subject:   lib.LEASE_ACTIVATED_SUBJECT,
				TextBody:  message,
			},
		)
	}

	go pkg.SendSMS(
		s.appCtx,
		pkg.SendSMSInput{
			Recipient: lease.Tenant.Phone,
			Message:   message,
		},
	)

	return nil
}
