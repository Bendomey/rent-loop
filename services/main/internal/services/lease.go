package services

import (
	"context"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type LeaseService interface {
	CreateLease(context context.Context, input CreateLeaseInput) (*models.Lease, error)
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
