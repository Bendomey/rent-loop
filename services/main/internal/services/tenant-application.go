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

type TenantApplicationService interface {
	CreateTenantApplication(
		context context.Context,
		input CreateTenantApplicationInput,
	) (*models.TenantApplication, error)
	InviteTenant(context context.Context, input InviteTenantInput) error
	ListTenantApplications(
		context context.Context,
		query repository.ListTenantApplicationsQuery,
	) ([]models.TenantApplication, error)
	CountTenantApplications(context context.Context, query repository.ListTenantApplicationsQuery) (int64, error)
	GetOneTenantApplication(
		context context.Context,
		query repository.GetTenantApplicationQuery,
	) (*models.TenantApplication, error)
	UpdateTenantApplication(
		context context.Context,
		input UpdateTenantApplicationInput,
	) (*models.TenantApplication, error)
	DeleteTenantApplication(context context.Context, tenantApplicationID string) error
	CancelTenantApplication(context context.Context, input CancelTenantApplicationInput) error
}

type tenantApplicationService struct {
	appCtx            pkg.AppContext
	repo              repository.TenantApplicationRepository
	unitService       UnitService
	clientUserService ClientUserService
}

type TenantApplicationServiceDeps struct {
	AppCtx            pkg.AppContext
	Repo              repository.TenantApplicationRepository
	UnitService       UnitService
	ClientUserService ClientUserService
}

func NewTenantApplicationService(deps TenantApplicationServiceDeps) TenantApplicationService {
	return &tenantApplicationService{
		appCtx:            deps.AppCtx,
		repo:              deps.Repo,
		unitService:       deps.UnitService,
		clientUserService: deps.ClientUserService,
	}
}

type CreateTenantApplicationInput struct {
	DesiredUnitId                  string
	FirstName                      string
	OtherNames                     *string
	LastName                       string
	Email                          *string
	Phone                          string
	Gender                         string
	DateOfBirth                    time.Time
	Nationality                    string
	MaritalStatus                  string
	IDNumber                       string
	CurrentAddress                 string
	EmergencyContactName           string
	EmergencyContactPhone          string
	RelationshipToEmergencyContact string
	Occupation                     string
	Employer                       string
	OccupationAddress              string
	ProfilePhotoUrl                *string
	CreatedById                    string
}

func (s *tenantApplicationService) CreateTenantApplication(
	ctx context.Context,
	input CreateTenantApplicationInput,
) (*models.TenantApplication, error) {
	unit, getUnitErr := s.unitService.GetUnitByID(ctx, input.DesiredUnitId)
	if getUnitErr != nil {
		return nil, pkg.InternalServerError(getUnitErr.Error(), &pkg.RentLoopErrorParams{
			Err: getUnitErr,
			Metadata: map[string]string{
				"function": "CreateTenantApplication",
				"action":   "fetching unit",
			},
		})
	}

	tenantApplication := models.TenantApplication{
		DesiredUnitId:                  input.DesiredUnitId,
		RentFee:                        unit.RentFee,
		RentFeeCurrency:                unit.RentFeeCurrency,
		FirstName:                      input.FirstName,
		OtherNames:                     input.OtherNames,
		LastName:                       input.LastName,
		Email:                          input.Email,
		Phone:                          input.Phone,
		Gender:                         input.Gender,
		DateOfBirth:                    input.DateOfBirth,
		Nationality:                    input.Nationality,
		MaritalStatus:                  input.MaritalStatus,
		IDNumber:                       input.IDNumber,
		CurrentAddress:                 input.CurrentAddress,
		EmergencyContactName:           input.EmergencyContactName,
		EmergencyContactPhone:          input.EmergencyContactPhone,
		RelationshipToEmergencyContact: input.RelationshipToEmergencyContact,
		Occupation:                     input.Occupation,
		Employer:                       input.Employer,
		OccupationAddress:              input.OccupationAddress,
		ProfilePhotoUrl:                input.ProfilePhotoUrl,
		CreatedById:                    &input.CreatedById,
		Status:                         "TenantApplication.Status.InProgress",
	}

	createTenantApplicationErr := s.repo.Create(ctx, &tenantApplication)
	if createTenantApplicationErr != nil {
		return nil, pkg.InternalServerError(createTenantApplicationErr.Error(), &pkg.RentLoopErrorParams{
			Err: createTenantApplicationErr,
			Metadata: map[string]string{
				"function": "CreateTenantApplication",
				"action":   "create tenant application",
			},
		})
	}

	message := strings.NewReplacer(
		"{{applicant_name}}", tenantApplication.FirstName,
		"{{unit_name}}", unit.Name,
		"{{application_code}}", *tenantApplication.Code,
		"{{submission_date}}", tenantApplication.CreatedAt.Format("2006-01-02 at 03:04 PM"),
	).Replace(lib.TENANT_APPLICATION_SUBMITTED_BODY)

	if input.Email != nil {
		go pkg.SendEmail(
			s.appCtx,
			pkg.SendEmailInput{
				Recipient: *input.Email,
				Subject:   lib.TENANT_APPLICATION_SUBMITTED_SUBJECT,
				TextBody:  message,
			},
		)
	}

	go pkg.SendSMS(
		s.appCtx,
		pkg.SendSMSInput{
			Recipient: input.Phone,
			Message:   message,
		},
	)

	return &tenantApplication, nil
}

type InviteTenantInput struct {
	Email   *string
	Phone   *string
	UnitId  string
	AdminId string
}

func (s *tenantApplicationService) InviteTenant(ctx context.Context, input InviteTenantInput) error {
	if input.Email == nil && input.Phone == nil {
		return pkg.BadRequestError("PhoneOrEmailRequired", nil)
	}

	admin, getAdminErr := s.clientUserService.GetClientUserByQuery(ctx, map[string]any{"id": input.AdminId})
	if getAdminErr != nil {
		return getAdminErr
	}

	_, getUnitErr := s.unitService.GetUnitByID(ctx, input.UnitId)

	if getUnitErr != nil {
		return getUnitErr
	}

	r := strings.NewReplacer(
		"{{property_manager_portal_url}}", s.appCtx.Config.Portals.PropertyManagerPortalURL,
		"{{unit_id}}", input.UnitId,
		"{{admin_id}}", input.AdminId,
		"{{admin_email}}", admin.Email,
	)

	message := r.Replace(lib.TENANT_INVITED_BODY)

	if input.Email != nil {
		go pkg.SendEmail(
			s.appCtx,
			pkg.SendEmailInput{
				Recipient: *input.Email,
				Subject:   lib.TENANT_INVITED_SUBJECT,
				TextBody:  message,
			},
		)
	}

	if input.Phone != nil {
		go pkg.SendSMS(
			s.appCtx,
			pkg.SendSMSInput{
				Recipient: *input.Phone,
				Message:   message,
			},
		)
	}

	return nil
}

func (s *tenantApplicationService) ListTenantApplications(
	ctx context.Context,
	query repository.ListTenantApplicationsQuery,
) ([]models.TenantApplication, error) {
	tenantApplications, err := s.repo.List(ctx, query)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListTenantApplications",
				"action":   "listing tenant applications",
			},
		})
	}

	return *tenantApplications, nil
}

func (s *tenantApplicationService) CountTenantApplications(
	ctx context.Context,
	query repository.ListTenantApplicationsQuery,
) (int64, error) {
	tenantApplicationsCount, err := s.repo.Count(ctx, query)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountTenantApplications",
				"action":   "counting tenant applications",
			},
		})
	}

	return tenantApplicationsCount, nil
}

func (s *tenantApplicationService) GetOneTenantApplication(
	ctx context.Context,
	query repository.GetTenantApplicationQuery,
) (*models.TenantApplication, error) {
	tenantApplication, err := s.repo.GetOneWithQuery(ctx, query)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
			})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetOneTenantApplication",
				"action":   "fetching tenant application",
			},
		})
	}

	return tenantApplication, nil
}

type UpdateTenantApplicationInput struct {
	TenantApplicationID                             string
	DesiredUnitId                                   *string
	RentFee                                         *int64
	RentFeeCurrency                                 *string
	FirstName                                       *string
	LastName                                        *string
	Phone                                           *string
	Gender                                          *string
	DateOfBirth                                     *time.Time
	Nationality                                     *string
	MaritalStatus                                   *string
	IDNumber                                        *string
	CurrentAddress                                  *string
	EmergencyContactName                            *string
	EmergencyContactPhone                           *string
	RelationshipToEmergencyContact                  *string
	Occupation                                      *string
	Employer                                        *string
	OccupationAddress                               *string
	DesiredMoveInDate                               *time.Time
	StayDurationFrequency                           *string
	StayDuration                                    *int64
	PaymentFrequency                                *string
	InitialDepositFee                               *int64
	InitialDepositPaymentMethod                     *string
	InitialDepositReferenceNumber                   *string
	InitialDepositPaidAt                            *time.Time
	InitialDepositPaymentId                         *string
	SecurityDepositFee                              *int64
	SecurityDepositFeeCurrency                      *string
	SecurityDepositPaymentMethod                    *string
	SecurityDepositReferenceNumber                  *string
	SecurityDepositPaidAt                           *time.Time
	SecurityDepositPaymentId                        *string
	OtherNames                                      *string
	Email                                           *string
	ProfilePhotoUrl                                 *string
	IDFrontUrl                                      *string
	IDBackUrl                                       *string
	PreviousLandlordName                            *string
	PreviousLandlordPhone                           *string
	PreviousTenancyPeriod                           *string
	ProofOfIncomeUrl                                *string
	LeaseAggreementDocumentMode                     *string
	LeaseAgreementDocumentUrl                       *string
	LeaseAgreementDocumentPropertyManagerSignedById *string
	LeaseAgreementDocumentPropertyManagerSignedAt   *time.Time
	LeaseAgreementDocumentTenantSignedAt            *time.Time
}

func (s *tenantApplicationService) UpdateTenantApplication(
	ctx context.Context,
	input UpdateTenantApplicationInput,
) (*models.TenantApplication, error) {
	tenantApplication, getTenantApplicationErr := s.repo.GetOneWithQuery(ctx, repository.GetTenantApplicationQuery{
		TenantApplicationID: input.TenantApplicationID,
	})
	if getTenantApplicationErr != nil {
		if errors.Is(getTenantApplicationErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("TenantApplicationNotFound", &pkg.RentLoopErrorParams{
				Err: getTenantApplicationErr,
			})
		}

		return nil, pkg.InternalServerError(getTenantApplicationErr.Error(), &pkg.RentLoopErrorParams{
			Err: getTenantApplicationErr,
			Metadata: map[string]string{
				"function": "UpdateTenantApplication",
				"action":   "fetching tenant application",
			},
		})
	}

	if input.DesiredUnitId != nil {
		tenantApplication.DesiredUnitId = *input.DesiredUnitId
	}

	if input.RentFee != nil {
		tenantApplication.RentFee = *input.RentFee
	}

	if input.RentFeeCurrency != nil {
		tenantApplication.RentFeeCurrency = *input.RentFeeCurrency
	}

	if input.FirstName != nil {
		tenantApplication.FirstName = *input.FirstName
	}

	if input.LastName != nil {
		tenantApplication.LastName = *input.LastName
	}

	if input.Phone != nil {
		tenantApplication.Phone = *input.Phone
	}

	if input.Gender != nil {
		tenantApplication.Gender = *input.Gender
	}

	if input.DateOfBirth != nil {
		tenantApplication.DateOfBirth = *input.DateOfBirth
	}

	if input.Nationality != nil {
		tenantApplication.Nationality = *input.Nationality
	}

	if input.MaritalStatus != nil {
		tenantApplication.MaritalStatus = *input.MaritalStatus
	}

	if input.IDNumber != nil {
		tenantApplication.IDNumber = *input.IDNumber
	}

	if input.CurrentAddress != nil {
		tenantApplication.CurrentAddress = *input.CurrentAddress
	}

	if input.EmergencyContactName != nil {
		tenantApplication.EmergencyContactName = *input.EmergencyContactName
	}

	if input.EmergencyContactPhone != nil {
		tenantApplication.EmergencyContactPhone = *input.EmergencyContactPhone
	}

	if input.RelationshipToEmergencyContact != nil {
		tenantApplication.RelationshipToEmergencyContact = *input.RelationshipToEmergencyContact
	}

	if input.Occupation != nil {
		tenantApplication.Occupation = *input.Occupation
	}

	if input.Employer != nil {
		tenantApplication.Employer = *input.Employer
	}

	if input.OccupationAddress != nil {
		tenantApplication.OccupationAddress = *input.OccupationAddress
	}

	tenantApplication.DesiredMoveInDate = input.DesiredMoveInDate
	tenantApplication.StayDurationFrequency = input.StayDurationFrequency
	tenantApplication.StayDuration = input.StayDuration

	tenantApplication.PaymentFrequency = input.PaymentFrequency

	tenantApplication.InitialDepositFee = input.InitialDepositFee
	tenantApplication.InitialDepositPaymentMethod = input.InitialDepositPaymentMethod
	tenantApplication.InitialDepositReferenceNumber = input.InitialDepositReferenceNumber
	tenantApplication.InitialDepositPaidAt = input.InitialDepositPaidAt
	tenantApplication.InitialDepositPaymentId = input.InitialDepositPaymentId

	tenantApplication.SecurityDepositFee = input.SecurityDepositFee
	tenantApplication.SecurityDepositFeeCurrency = input.SecurityDepositFeeCurrency

	tenantApplication.SecurityDepositPaymentMethod = input.SecurityDepositPaymentMethod
	tenantApplication.SecurityDepositReferenceNumber = input.SecurityDepositReferenceNumber
	tenantApplication.SecurityDepositPaidAt = input.SecurityDepositPaidAt
	tenantApplication.SecurityDepositPaymentId = input.SecurityDepositPaymentId

	tenantApplication.OtherNames = input.OtherNames
	tenantApplication.Email = input.Email
	tenantApplication.ProfilePhotoUrl = input.ProfilePhotoUrl
	tenantApplication.IDFrontUrl = input.IDFrontUrl
	tenantApplication.IDBackUrl = input.IDBackUrl

	tenantApplication.PreviousLandlordName = input.PreviousLandlordName
	tenantApplication.PreviousLandlordPhone = input.PreviousLandlordPhone
	tenantApplication.PreviousTenancyPeriod = input.PreviousTenancyPeriod

	tenantApplication.ProofOfIncomeUrl = input.ProofOfIncomeUrl

	tenantApplication.LeaseAggreementDocumentMode = input.LeaseAggreementDocumentMode
	tenantApplication.LeaseAgreementDocumentUrl = input.LeaseAgreementDocumentUrl

	tenantApplication.LeaseAgreementDocumentPropertyManagerSignedById = input.LeaseAgreementDocumentPropertyManagerSignedById
	tenantApplication.LeaseAgreementDocumentPropertyManagerSignedAt = input.LeaseAgreementDocumentPropertyManagerSignedAt
	tenantApplication.LeaseAgreementDocumentTenantSignedAt = input.LeaseAgreementDocumentTenantSignedAt

	updateTenantApplicationErr := s.repo.Update(ctx, *tenantApplication)
	if updateTenantApplicationErr != nil {
		return nil, pkg.InternalServerError(updateTenantApplicationErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateTenantApplicationErr,
			Metadata: map[string]string{
				"function": "UpdateTenantApplication",
				"action":   "updating tenant application",
			},
		})
	}

	return tenantApplication, nil
}

func (s *tenantApplicationService) DeleteTenantApplication(
	ctx context.Context,
	tenantApplicationID string,
) error {
	tenantApplication, getTenantApplicationErr := s.repo.GetOneWithQuery(ctx, repository.GetTenantApplicationQuery{
		TenantApplicationID: tenantApplicationID,
	})
	if getTenantApplicationErr != nil {
		if errors.Is(getTenantApplicationErr, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("TenantApplicationNotFound", &pkg.RentLoopErrorParams{
				Err: getTenantApplicationErr,
			})
		}

		return pkg.InternalServerError(getTenantApplicationErr.Error(), &pkg.RentLoopErrorParams{
			Err: getTenantApplicationErr,
			Metadata: map[string]string{
				"function": "DeleteTenantApplication",
				"action":   "fetching tenant application",
			},
		})
	}

	if tenantApplication.Status != "TenantApplication.Status.Cancelled" {
		return pkg.BadRequestError("TenantApplicationNotCancelled", nil)
	}

	deleteErr := s.repo.Delete(ctx, tenantApplicationID)
	if deleteErr != nil {
		return pkg.InternalServerError(deleteErr.Error(), &pkg.RentLoopErrorParams{
			Err: deleteErr,
			Metadata: map[string]string{
				"function": "DeleteTenantApplication",
				"action":   "deleting tenant application",
			},
		})
	}

	return nil
}

type CancelTenantApplicationInput struct {
	TenantApplicationID string
	CancelledById       string
	Reason              string
}

func (s *tenantApplicationService) CancelTenantApplication(
	ctx context.Context,
	input CancelTenantApplicationInput,
) error {
	tenantApplication, getTenantApplicationErr := s.repo.GetOneWithQuery(ctx, repository.GetTenantApplicationQuery{
		TenantApplicationID: input.TenantApplicationID,
	})
	if getTenantApplicationErr != nil {
		if errors.Is(getTenantApplicationErr, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("TenantApplicationNotFound", &pkg.RentLoopErrorParams{
				Err: getTenantApplicationErr,
			})
		}
		return pkg.InternalServerError(getTenantApplicationErr.Error(), &pkg.RentLoopErrorParams{
			Err: getTenantApplicationErr,
			Metadata: map[string]string{
				"function": "CancelTenantApplication",
				"action":   "fetching tenant application",
			},
		})
	}

	if tenantApplication.Status == "TenantApplication.Status.Completed" {
		return pkg.BadRequestError("TenantApplicationAlreadyCompleted", nil)
	}

	if tenantApplication.Status == "TenantApplication.Status.Cancelled" {
		return pkg.BadRequestError("TenantApplicationAlreadyCancelled", nil)
	}

	tenantApplication.Status = "TenantApplication.Status.Cancelled"
	now := time.Now()
	tenantApplication.CancelledAt = &now
	tenantApplication.CancelledById = &input.CancelledById

	updateTenantApplicationErr := s.repo.Update(ctx, *tenantApplication)
	if updateTenantApplicationErr != nil {
		return pkg.InternalServerError(updateTenantApplicationErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateTenantApplicationErr,
			Metadata: map[string]string{
				"function": "CancelTenantApplication",
				"action":   "updating tenant application",
			},
		})
	}

	message := strings.NewReplacer(
		"{{applicant_name}}", tenantApplication.FirstName,
		"{{application_code}}", *tenantApplication.Code,
		"{{reason}}", input.Reason,
	).Replace(lib.TENANT_CANCELLED_BODY)

	if tenantApplication.Email != nil {
		go pkg.SendEmail(
			s.appCtx,
			pkg.SendEmailInput{
				Recipient: *tenantApplication.Email,
				Subject:   lib.TENANT_CANCELLED_SUBJECT,
				TextBody:  message,
			},
		)
	}

	go pkg.SendSMS(
		s.appCtx,
		pkg.SendSMSInput{
			Recipient: tenantApplication.Phone,
			Message:   message,
		},
	)

	return nil
}
