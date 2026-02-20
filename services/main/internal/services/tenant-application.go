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
	GetInvoiceForTenantApplication(
		context context.Context,
		tenantApplicationID string,
		invoiceID string,
	) (*models.Invoice, error)
	GenerateInvoice(context context.Context, input GenerateInvoiceInput) (*models.Invoice, error)
	ApproveTenantApplication(context context.Context, input ApproveTenantApplicationInput) error
}

type tenantApplicationService struct {
	appCtx               pkg.AppContext
	repo                 repository.TenantApplicationRepository
	unitService          UnitService
	clientUserService    ClientUserService
	tenantService        TenantService
	leaseService         LeaseService
	tenantAccountService TenantAccountService
	invoiceService       InvoiceService
}

type TenantApplicationServiceDeps struct {
	AppCtx               pkg.AppContext
	Repo                 repository.TenantApplicationRepository
	UnitService          UnitService
	ClientUserService    ClientUserService
	TenantService        TenantService
	LeaseService         LeaseService
	TenantAccountService TenantAccountService
	InvoiceService       InvoiceService
}

func NewTenantApplicationService(deps TenantApplicationServiceDeps) TenantApplicationService {
	return &tenantApplicationService{
		appCtx:               deps.AppCtx,
		repo:                 deps.Repo,
		unitService:          deps.UnitService,
		clientUserService:    deps.ClientUserService,
		tenantService:        deps.TenantService,
		leaseService:         deps.LeaseService,
		tenantAccountService: deps.TenantAccountService,
		invoiceService:       deps.InvoiceService,
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
	IDType                         string
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
	if unit.Status != "Unit.Status.Available" {
		return nil, pkg.BadRequestError("UnitNotAvailable", nil)
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
		IDType:                         input.IDType,
		IDNumber:                       input.IDNumber,
		CurrentAddress:                 input.CurrentAddress,
		EmergencyContactName:           input.EmergencyContactName,
		EmergencyContactPhone:          input.EmergencyContactPhone,
		RelationshipToEmergencyContact: input.RelationshipToEmergencyContact,
		Occupation:                     input.Occupation,
		Employer:                       input.Employer,
		OccupationAddress:              input.OccupationAddress,
		ProfilePhotoUrl:                input.ProfilePhotoUrl,
		CreatedById:                    input.CreatedById,
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
		"{{application_code}}", tenantApplication.Code,
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
	TenantApplicationID            string
	DesiredUnitId                  *string
	RentFee                        *int64
	RentFeeCurrency                *string
	FirstName                      *string
	LastName                       *string
	Phone                          *string
	Gender                         *string
	DateOfBirth                    *time.Time
	Nationality                    *string
	MaritalStatus                  *string
	IDNumber                       *string
	CurrentAddress                 *string
	EmergencyContactName           *string
	EmergencyContactPhone          *string
	RelationshipToEmergencyContact *string
	Occupation                     *string
	Employer                       *string
	OccupationAddress              *string
	IDType                         *string
	InitialDepositPaymentMethod    *string
	InitialDepositReferenceNumber  *string
	InitialDepositPaidAt           *time.Time
	InitialDepositPaymentId        *string
	SecurityDepositFeeCurrency     *string
	SecurityDepositPaymentMethod   *string
	SecurityDepositReferenceNumber *string
	SecurityDepositPaidAt          *time.Time
	SecurityDepositPaymentId       *string

	// Nullable fields that can be explicitly set to null
	DesiredMoveInDate            lib.Optional[time.Time]
	StayDurationFrequency        lib.Optional[string]
	StayDuration                 lib.Optional[int64]
	PaymentFrequency             lib.Optional[string]
	InitialDepositFee            lib.Optional[int64]
	SecurityDepositFee           lib.Optional[int64]
	OtherNames                   lib.Optional[string]
	Email                        lib.Optional[string]
	ProfilePhotoUrl              lib.Optional[string]
	IDFrontUrl                   lib.Optional[string]
	IDBackUrl                    lib.Optional[string]
	PreviousLandlordName         lib.Optional[string]
	PreviousLandlordPhone        lib.Optional[string]
	PreviousTenancyPeriod        lib.Optional[string]
	ProofOfIncomeUrl             lib.Optional[string]
	LeaseAgreementDocumentMode   lib.Optional[string]
	LeaseAgreementDocumentUrl    lib.Optional[string]
	LeaseAgreementDocumentID     lib.Optional[string]
	LeaseAgreementDocumentStatus lib.Optional[string]
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

	// Required fields - only update if a non-nil value was sent
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

	if input.IDType != nil {
		tenantApplication.IDType = *input.IDType
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

	// Nullable fields - update if field was explicitly sent (allows setting to null)
	if input.DesiredMoveInDate.IsSet {
		tenantApplication.DesiredMoveInDate = input.DesiredMoveInDate.Ptr()
	}

	if input.StayDurationFrequency.IsSet {
		tenantApplication.StayDurationFrequency = input.StayDurationFrequency.Ptr()
	}

	if input.StayDuration.IsSet {
		tenantApplication.StayDuration = input.StayDuration.Ptr()
	}

	if input.PaymentFrequency.IsSet {
		tenantApplication.PaymentFrequency = input.PaymentFrequency.Ptr()
	}

	if input.InitialDepositFee.IsSet {
		tenantApplication.InitialDepositFee = input.InitialDepositFee.Ptr()
	}

	if input.SecurityDepositFee.IsSet {
		tenantApplication.SecurityDepositFee = input.SecurityDepositFee.Ptr()
	}

	if input.OtherNames.IsSet {
		tenantApplication.OtherNames = input.OtherNames.Ptr()
	}

	if input.Email.IsSet {
		tenantApplication.Email = input.Email.Ptr()
	}

	if input.ProfilePhotoUrl.IsSet {
		tenantApplication.ProfilePhotoUrl = input.ProfilePhotoUrl.Ptr()
	}

	if input.IDFrontUrl.IsSet {
		tenantApplication.IDFrontUrl = input.IDFrontUrl.Ptr()
	}

	if input.IDBackUrl.IsSet {
		tenantApplication.IDBackUrl = input.IDBackUrl.Ptr()
	}

	if input.PreviousLandlordName.IsSet {
		tenantApplication.PreviousLandlordName = input.PreviousLandlordName.Ptr()
	}

	if input.PreviousLandlordPhone.IsSet {
		tenantApplication.PreviousLandlordPhone = input.PreviousLandlordPhone.Ptr()
	}

	if input.PreviousTenancyPeriod.IsSet {
		tenantApplication.PreviousTenancyPeriod = input.PreviousTenancyPeriod.Ptr()
	}

	if input.ProofOfIncomeUrl.IsSet {
		tenantApplication.ProofOfIncomeUrl = input.ProofOfIncomeUrl.Ptr()
	}

	if input.LeaseAgreementDocumentMode.IsSet {
		tenantApplication.LeaseAgreementDocumentMode = input.LeaseAgreementDocumentMode.Ptr()
	}

	if input.LeaseAgreementDocumentUrl.IsSet {
		tenantApplication.LeaseAgreementDocumentUrl = input.LeaseAgreementDocumentUrl.Ptr()
	}

	if input.LeaseAgreementDocumentID.IsSet {
		tenantApplication.LeaseAgreementDocumentID = input.LeaseAgreementDocumentID.Ptr()
	}

	if input.LeaseAgreementDocumentStatus.IsSet {
		tenantApplication.LeaseAgreementDocumentStatus = input.LeaseAgreementDocumentStatus.Ptr()
	}

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
		"{{application_code}}", tenantApplication.Code,
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

type ApproveTenantApplicationInput struct {
	ClientUserID        string
	TenantApplicationID string
}

func (s *tenantApplicationService) ApproveTenantApplication(
	ctx context.Context,
	input ApproveTenantApplicationInput,
) error {
	// fetch tenant application
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

	if tenantApplication.Status == "TenantApplication.Status.Cancelled" {
		return pkg.BadRequestError("TenantApplicationAlreadyCancelled", nil)
	}

	if tenantApplication.Status == "TenantApplication.Status.Completed" {
		return pkg.BadRequestError("TenantApplicationAlreadyCompleted", nil)
	}

	unit, getUnitErr := s.unitService.GetUnitByID(ctx, tenantApplication.DesiredUnitId)
	if getUnitErr != nil {
		return getUnitErr
	}

	// update tenant application status
	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	tenantApplication.Status = "TenantApplication.Status.Completed"
	tenantApplication.CompletedById = &input.ClientUserID
	now := time.Now()
	tenantApplication.CompletedAt = &now
	updateTenantApplicationErr := s.repo.Update(transCtx, *tenantApplication)
	if updateTenantApplicationErr != nil {
		transaction.Rollback()
		return pkg.InternalServerError(updateTenantApplicationErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateTenantApplicationErr,
			Metadata: map[string]string{
				"function": "ApproveTenantApplication",
				"action":   "updating tenant application status",
			},
		})
	}

	// create tenant
	tenantInput := CreateTenantInput{
		FirstName:                      tenantApplication.FirstName,
		OtherNames:                     tenantApplication.OtherNames,
		LastName:                       tenantApplication.LastName,
		Email:                          tenantApplication.Email,
		Phone:                          tenantApplication.Phone,
		Gender:                         tenantApplication.Gender,
		DateOfBirth:                    tenantApplication.DateOfBirth,
		Nationality:                    tenantApplication.Nationality,
		MaritalStatus:                  tenantApplication.MaritalStatus,
		ProfilePhotoUrl:                tenantApplication.ProfilePhotoUrl,
		IDType:                         tenantApplication.IDType,
		IDNumber:                       tenantApplication.IDNumber,
		IDFrontUrl:                     tenantApplication.IDFrontUrl,
		IDBackUrl:                      tenantApplication.IDBackUrl,
		EmergencyContactName:           tenantApplication.EmergencyContactName,
		EmergencyContactPhone:          tenantApplication.EmergencyContactPhone,
		RelationshipToEmergencyContact: tenantApplication.RelationshipToEmergencyContact,
		Occupation:                     tenantApplication.Occupation,
		Employer:                       tenantApplication.Employer,
		OccupationAddress:              tenantApplication.OccupationAddress,
		ProofOfIncomeUrl:               tenantApplication.ProofOfIncomeUrl,
		CreatedById:                    input.ClientUserID,
	}

	tenant, createTenantErr := s.tenantService.GetOrCreateTenant(transCtx, tenantInput)
	if createTenantErr != nil {
		transaction.Rollback()
		return createTenantErr
	}

	// create lease
	meta := map[string]any{
		"initial_deposit_fee":          tenantApplication.InitialDepositFee,
		"initial_deposit_fee_currency": tenantApplication.InitialDepositFeeCurrency,

		"security_deposit_fee":          tenantApplication.SecurityDepositFee,
		"security_deposit_fee_currency": tenantApplication.SecurityDepositFeeCurrency,
	}
	leaseInput := CreateLeaseInput{
		Status:                     "Lease.Status.Pending",
		UnitId:                     tenantApplication.DesiredUnitId,
		TenantId:                   tenant.ID.String(),
		TenantApplicationId:        tenantApplication.ID.String(),
		RentFee:                    tenantApplication.RentFee,
		RentFeeCurrency:            tenantApplication.RentFeeCurrency,
		PaymentFrequency:           tenantApplication.PaymentFrequency,
		Meta:                       meta,
		MoveInDate:                 *tenantApplication.DesiredMoveInDate,
		StayDurationFrequency:      *tenantApplication.StayDurationFrequency,
		StayDuration:               *tenantApplication.StayDuration,
		LeaseAgreementDocumentMode: tenantApplication.LeaseAgreementDocumentMode,
		LeaseAgreementDocumentUrl:  *tenantApplication.LeaseAgreementDocumentUrl,
	}
	_, createLeaseErr := s.leaseService.CreateLease(transCtx, leaseInput)
	if createLeaseErr != nil {
		transaction.Rollback()
		return createLeaseErr
	}

	// create tenant account
	tenantAccountInput := CreateTenantAccountInput{
		TenantId:    tenant.ID.String(),
		PhoneNumber: tenantApplication.Phone,
	}
	tenantAccount, createTenantAccountErr := s.tenantAccountService.GetOrCreateTenantAccount(
		transCtx,
		tenantAccountInput,
	)
	if createTenantAccountErr != nil {
		transaction.Rollback()
		return createTenantAccountErr
	}

	unit.Status = "Unit.Status.Occupied"
	updateUnitErr := s.unitService.UpdateUnitStatus(transCtx, UpdateUnitStatusInput{
		PropertyID: unit.PropertyID,
		UnitID:     unit.ID.String(),
		Status:     unit.Status,
	})
	if updateUnitErr != nil {
		transaction.Rollback()
		return updateUnitErr
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		transaction.Rollback()
		return pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"function": "ApproveTenantApplication",
				"action":   "committing transaction",
			},
		})
	}

	// send email
	message := strings.NewReplacer(
		"{{applicant_name}}", tenantApplication.FirstName,
		"{{unit_name}}", unit.Name,
		"{{application_code}}", tenantApplication.Code,
		"{{phone_number}}", tenantAccount.PhoneNumber,
	).Replace(lib.TENANT_APPLICATION_APPROVED_BODY)

	if tenantApplication.Email != nil {
		go pkg.SendEmail(
			s.appCtx,
			pkg.SendEmailInput{
				Recipient: *tenantApplication.Email,
				Subject:   lib.TENANT_APPLICATION_APPROVED_SUBJECT,
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

func (s *tenantApplicationService) GetInvoiceForTenantApplication(
	ctx context.Context,
	tenantApplicationID string,
	invoiceID string,
) (*models.Invoice, error) {
	invoice, err := s.invoiceService.GetByQuery(ctx, repository.GetInvoiceQuery{
		Query: map[string]any{
			"id":                            invoiceID,
			"context_type":                  "TENANT_APPLICATION",
			"context_tenant_application_id": tenantApplicationID,
		},
		Populate: nil,
	})
	if err != nil {
		return nil, err
	}

	return invoice, nil
}

type GenerateInvoiceInput struct {
	TenantApplicationID string
	DueDate             *time.Time
}

func (s *tenantApplicationService) GenerateInvoice(
	ctx context.Context,
	input GenerateInvoiceInput,
) (*models.Invoice, error) {
	// Fetch tenant application with unit and property details
	populate := []string{"DesiredUnit", "DesiredUnit.Property"}
	tenantApplication, getTenantApplicationErr := s.repo.GetOneWithQuery(ctx, repository.GetTenantApplicationQuery{
		TenantApplicationID: input.TenantApplicationID,
		Populate:            &populate,
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
				"function": "GenerateInvoice",
				"action":   "fetching tenant application",
			},
		})
	}

	// Validate that at least one of security deposit or initial deposit is set
	hasSecurityDeposit := tenantApplication.SecurityDepositFee != nil && *tenantApplication.SecurityDepositFee > 0
	hasInitialDeposit := tenantApplication.InitialDepositFee != nil && *tenantApplication.InitialDepositFee > 0

	if !hasSecurityDeposit && !hasInitialDeposit {
		return nil, pkg.BadRequestError("NoDepositFeesConfigured", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{
				"function": "GenerateInvoice",
				"message":  "At least one of security deposit or initial deposit must be configured",
			},
		})
	}

	// Build line items
	var lineItems []LineItemInput
	var totalAmount int64 = 0
	tenantApplicationID := tenantApplication.ID.String()

	// Add initial deposit line item if configured
	if hasInitialDeposit {
		initialDepositAmount := *tenantApplication.InitialDepositFee
		lineItems = append(lineItems, LineItemInput{
			Label:       "Initial Deposit",
			Category:    "INITIAL_DEPOSIT",
			Quantity:    1,
			UnitAmount:  initialDepositAmount,
			TotalAmount: initialDepositAmount,
			Currency:    tenantApplication.InitialDepositFeeCurrency,
			Metadata: &map[string]any{
				"tenant_application_id": tenantApplicationID,
				"unit_id":               tenantApplication.DesiredUnitId,
				"unit_name":             tenantApplication.DesiredUnit.Name,
			},
		})

		totalAmount += initialDepositAmount
	}

	// Add security deposit line item if configured
	if hasSecurityDeposit {
		securityDepositAmount := *tenantApplication.SecurityDepositFee
		lineItems = append(lineItems, LineItemInput{
			Label:       "Security Deposit",
			Category:    "SECURITY_DEPOSIT",
			Quantity:    1,
			UnitAmount:  securityDepositAmount,
			TotalAmount: securityDepositAmount,
			Currency:    tenantApplication.SecurityDepositFeeCurrency,
			Metadata: &map[string]any{
				"tenant_application_id": tenantApplicationID,
				"unit_id":               tenantApplication.DesiredUnitId,
				"unit_name":             tenantApplication.DesiredUnit.Name,
			},
		})
		totalAmount += securityDepositAmount
	}

	// Create the invoice
	invoice, createErr := s.invoiceService.CreateInvoice(ctx, CreateInvoiceInput{
		PayerType:                  "TENANT_APPLICATION",
		PayeeType:                  "PROPERTY_OWNER",
		PayeeClientID:              &tenantApplication.DesiredUnit.Property.ClientID,
		ContextType:                "TENANT_APPLICATION",
		ContextTenantApplicationID: &tenantApplicationID,
		TotalAmount:                totalAmount,
		Taxes:                      0,
		SubTotal:                   totalAmount,
		Currency:                   tenantApplication.RentFeeCurrency,
		Status:                     "ISSUED",
		DueDate:                    input.DueDate,
		LineItems:                  lineItems,
	})

	if createErr != nil {
		return nil, pkg.InternalServerError("Failed to create invoice", &pkg.RentLoopErrorParams{
			Err: createErr,
			Metadata: map[string]string{
				"function":            "GenerateInvoice",
				"tenantApplicationId": input.TenantApplicationID,
			},
		})
	}

	return invoice, nil
}
