package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
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
	BulkOnboardLeases(ctx context.Context, input BulkOnboardLeasesInput) error
	SetPaymentService(ps PaymentService)
}

type tenantApplicationService struct {
	appCtx                pkg.AppContext
	repo                  repository.TenantApplicationRepository
	unitService           UnitService
	clientUserService     ClientUserService
	tenantService         TenantService
	leaseService          LeaseService
	tenantAccountService  TenantAccountService
	invoiceService        InvoiceService
	paymentAccountService PaymentAccountService
	paymentService        PaymentService
}

type TenantApplicationServiceDeps struct {
	AppCtx                pkg.AppContext
	Repo                  repository.TenantApplicationRepository
	UnitService           UnitService
	ClientUserService     ClientUserService
	TenantService         TenantService
	LeaseService          LeaseService
	TenantAccountService  TenantAccountService
	InvoiceService        InvoiceService
	PaymentAccountService PaymentAccountService
}

func NewTenantApplicationService(deps TenantApplicationServiceDeps) TenantApplicationService {
	return &tenantApplicationService{
		appCtx:                deps.AppCtx,
		repo:                  deps.Repo,
		unitService:           deps.UnitService,
		clientUserService:     deps.ClientUserService,
		tenantService:         deps.TenantService,
		leaseService:          deps.LeaseService,
		tenantAccountService:  deps.TenantAccountService,
		invoiceService:        deps.InvoiceService,
		paymentAccountService: deps.PaymentAccountService,
	}
}

func (s *tenantApplicationService) SetPaymentService(ps PaymentService) {
	s.paymentService = ps
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
	IDFrontUrl                     *string
	IDBackUrl                      *string
	CurrentAddress                 string
	EmergencyContactName           string
	EmergencyContactPhone          string
	RelationshipToEmergencyContact string
	Occupation                     string
	Employer                       string
	EmployerType                   string
	ProofOfIncomeUrl               *string
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
	if unit.Status != "Unit.Status.Available" && unit.Status != "Unit.Status.PartiallyOccupied" {
		return nil, pkg.BadRequestError("UnitNotAvailable", nil)
	}

	tenantApplication := models.TenantApplication{
		DesiredUnitId:                  input.DesiredUnitId,
		RentFee:                        unit.RentFee,
		RentFeeCurrency:                unit.RentFeeCurrency,
		StayDurationFrequency:          &unit.PaymentFrequency,
		PaymentFrequency:               &unit.PaymentFrequency,
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
		IDFrontUrl:                     input.IDFrontUrl,
		IDBackUrl:                      input.IDBackUrl,
		CurrentAddress:                 input.CurrentAddress,
		EmergencyContactName:           input.EmergencyContactName,
		EmergencyContactPhone:          input.EmergencyContactPhone,
		RelationshipToEmergencyContact: input.RelationshipToEmergencyContact,
		Occupation:                     input.Occupation,
		Employer:                       input.Employer,
		EmployerType:                   &input.EmployerType,
		ProofOfIncomeUrl:               input.ProofOfIncomeUrl,
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

	r := strings.NewReplacer(
		"{{applicant_name}}", tenantApplication.FirstName,
		"{{unit_name}}", unit.Name,
		"{{application_code}}", tenantApplication.Code,
		"{{submission_date}}", tenantApplication.CreatedAt.Format("2006-01-02 at 03:04 PM"),
	)
	message := r.Replace(lib.TENANT_APPLICATION_SUBMITTED_BODY)
	smsMessage := r.Replace(lib.TENANT_APPLICATION_SUBMITTED_SMS_BODY)

	if input.Email != nil {
		go pkg.SendEmail(
			s.appCtx.Config,
			pkg.SendEmailInput{
				Recipient: *input.Email,
				Subject:   lib.TENANT_APPLICATION_SUBMITTED_SUBJECT,
				TextBody:  message,
			},
		)
	}

	go s.appCtx.Clients.GatekeeperAPI.SendSMS(
		context.Background(),
		gatekeeper.SendSMSInput{
			Recipient: input.Phone,
			Message:   smsMessage,
		},
	)

	return &tenantApplication, nil
}

type InviteTenantInput struct {
	Email    *string
	Phone    *string
	UnitId   string
	AdminId  string
	ClientID string
}

func (s *tenantApplicationService) InviteTenant(ctx context.Context, input InviteTenantInput) error {
	if input.Email == nil && input.Phone == nil {
		return pkg.BadRequestError("PhoneOrEmailRequired", nil)
	}

	admin, getAdminErr := s.clientUserService.GetClientUserWithPopulate(ctx, repository.GetClientUserWithPopulateQuery{
		ID:       input.AdminId,
		ClientID: input.ClientID,
		Populate: &[]string{"User"},
	})
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
		"{{admin_email}}", admin.User.Email,
	)

	message := r.Replace(lib.TENANT_INVITED_BODY)
	smsMessage := r.Replace(lib.TENANT_INVITED_SMS_BODY)

	if input.Email != nil {
		go pkg.SendEmail(
			s.appCtx.Config,
			pkg.SendEmailInput{
				Recipient: *input.Email,
				Subject:   lib.TENANT_INVITED_SUBJECT,
				TextBody:  message,
			},
		)
	}

	if input.Phone != nil {
		go s.appCtx.Clients.GatekeeperAPI.SendSMS(
			context.Background(),
			gatekeeper.SendSMSInput{
				Recipient: *input.Phone,
				Message:   smsMessage,
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

	// Nullable fields that can be explicitly set to null
	EmployerType                 lib.Optional[string]
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
	if input.EmployerType.IsSet {
		tenantApplication.EmployerType = input.EmployerType.Ptr()
	}

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

	r := strings.NewReplacer(
		"{{applicant_name}}", tenantApplication.FirstName,
		"{{application_code}}", tenantApplication.Code,
		"{{reason}}", input.Reason,
	)
	message := r.Replace(lib.TENANT_CANCELLED_BODY)
	smsMessage := r.Replace(lib.TENANT_CANCELLED_SMS_BODY)

	if tenantApplication.Email != nil {
		go pkg.SendEmail(
			s.appCtx.Config,
			pkg.SendEmailInput{
				Recipient: *tenantApplication.Email,
				Subject:   lib.TENANT_CANCELLED_SUBJECT,
				TextBody:  message,
			},
		)
	}

	go s.appCtx.Clients.GatekeeperAPI.SendSMS(
		context.Background(),
		gatekeeper.SendSMSInput{
			Recipient: tenantApplication.Phone,
			Message:   smsMessage,
		},
	)

	return nil
}

type ApproveTenantApplicationInput struct {
	ClientUserID        string
	TenantApplicationID string
}

type BulkOnboardLeaseEntry struct {
	UnitId                         string
	FirstName                      string
	OtherNames                     *string
	LastName                       string
	Email                          *string
	Phone                          string
	Gender                         string
	DateOfBirth                    time.Time
	Nationality                    string
	MaritalStatus                  string
	CurrentAddress                 string
	IDType                         string
	IDNumber                       string
	EmergencyContactName           string
	EmergencyContactPhone          string
	RelationshipToEmergencyContact string
	Occupation                     *string // defaults to "N/A" if nil
	Employer                       *string // defaults to "N/A" if nil
	RentFee                        int64
	RentFeeCurrency                string
	PaymentFrequency               *string
	MoveInDate                     time.Time
	StayDurationFrequency          string
	StayDuration                   int64
	RentPaymentStatus              string
	PeriodsPaid                    *int64
	BillingCycleStartDate          *time.Time
	SecurityDepositFee             int64
	SecurityDepositFeeCurrency     string
	LeaseAgreementDocumentUrl      string
}

type BulkOnboardLeasesInput struct {
	ClientUserID string
	ClientID     string
	PropertyID   string
	Entries      []BulkOnboardLeaseEntry
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
				"function": "ApproveTenantApplication",
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

	// validate fields required for lease creation are all set
	if tenantApplication.DesiredMoveInDate == nil {
		return pkg.BadRequestError("ApplicationMissingMoveInDate", nil)
	}
	if tenantApplication.StayDurationFrequency == nil {
		return pkg.BadRequestError("ApplicationMissingStayDurationFrequency", nil)
	}
	if tenantApplication.StayDuration == nil {
		return pkg.BadRequestError("ApplicationMissingStayDuration", nil)
	}
	if tenantApplication.LeaseAgreementDocumentUrl == nil {
		return pkg.BadRequestError("ApplicationMissingLeaseAgreementDocument", nil)
	}

	unit, getUnitErr := s.unitService.GetUnitByID(ctx, tenantApplication.DesiredUnitId)
	if getUnitErr != nil {
		return getUnitErr
	}

	if unit.Status != "Unit.Status.Available" && unit.Status != "Unit.Status.PartiallyOccupied" {
		return pkg.BadRequestError("UnitNoLongerAvailable", nil)
	}

	_, getInvoiceErr := s.invoiceService.GetByQuery(ctx, repository.GetInvoiceQuery{
		Query: map[string]any{
			"context_type":                  "TENANT_APPLICATION",
			"context_tenant_application_id": input.TenantApplicationID,
			"status":                        "PAID",
		},
	})

	if getInvoiceErr != nil {
		if errors.Is(getInvoiceErr, gorm.ErrRecordNotFound) {
			return pkg.BadRequestError("TenantApplicationInvoiceNotPaid", nil)
		}
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
		Status:                    "Lease.Status.Pending",
		UnitId:                    tenantApplication.DesiredUnitId,
		TenantId:                  tenant.ID.String(),
		TenantApplicationId:       tenantApplication.ID.String(),
		RentFee:                   tenantApplication.RentFee,
		RentFeeCurrency:           tenantApplication.RentFeeCurrency,
		PaymentFrequency:          tenantApplication.PaymentFrequency,
		Meta:                      meta,
		MoveInDate:                *tenantApplication.DesiredMoveInDate,
		StayDurationFrequency:     *tenantApplication.StayDurationFrequency,
		StayDuration:              *tenantApplication.StayDuration,
		LeaseAgreementDocumentUrl: *tenantApplication.LeaseAgreementDocumentUrl,
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

	occupyingLeases, err := s.leaseService.CountOccupyingByUnitID(transCtx, unit.ID.String())
	if err != nil {
		return err
	}

	var newUnitStatus string
	if occupyingLeases >= int64(unit.MaxOccupantsAllowed) {
		newUnitStatus = "Unit.Status.Occupied"
	} else if occupyingLeases > 0 {
		newUnitStatus = "Unit.Status.PartiallyOccupied"
	}

	if newUnitStatus != "" && unit.Status != newUnitStatus {
		updateUnitErr := s.unitService.SetSystemUnitStatus(transCtx, UpdateUnitStatusInput{
			PropertyID: unit.PropertyID,
			UnitID:     unit.ID.String(),
			Status:     newUnitStatus,
		})
		if updateUnitErr != nil {
			transaction.Rollback()
			return updateUnitErr
		}
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
	r := strings.NewReplacer(
		"{{applicant_name}}", tenantApplication.FirstName,
		"{{unit_name}}", unit.Name,
		"{{application_code}}", tenantApplication.Code,
		"{{phone_number}}", tenantAccount.PhoneNumber,
	)
	message := r.Replace(lib.TENANT_APPLICATION_APPROVED_BODY)
	smsMessage := r.Replace(lib.TENANT_APPLICATION_APPROVED_SMS_BODY)

	if tenantApplication.Email != nil {
		go pkg.SendEmail(
			s.appCtx.Config,
			pkg.SendEmailInput{
				Recipient: *tenantApplication.Email,
				Subject:   lib.TENANT_APPLICATION_APPROVED_SUBJECT,
				TextBody:  message,
			},
		)
	}

	go s.appCtx.Clients.GatekeeperAPI.SendSMS(
		context.Background(),
		gatekeeper.SendSMSInput{
			Recipient: tenantApplication.Phone,
			Message:   smsMessage,
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
	taClientID := tenantApplication.DesiredUnit.Property.ClientID
	taPropertyID := tenantApplication.DesiredUnit.PropertyID
	invoice, createErr := s.invoiceService.CreateInvoice(ctx, CreateInvoiceInput{
		ClientID:                   &taClientID,
		PropertyID:                 &taPropertyID,
		PayerType:                  "TENANT_APPLICATION",
		PayeeType:                  "PROPERTY_OWNER",
		PayeeClientID:              &taClientID,
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

func (s *tenantApplicationService) BulkOnboardLeases(ctx context.Context, input BulkOnboardLeasesInput) error {
	if len(input.Entries) == 0 || len(input.Entries) > 10 {
		return pkg.BadRequestError("BatchSizeOutOfRange", nil)
	}

	// Pre-flight: pure input validation (no DB) — fail fast before opening a transaction.
	for _, entry := range input.Entries {
		if entry.RentPaymentStatus == "PARTIAL" {
			if entry.PeriodsPaid == nil {
				return pkg.BadRequestError("PeriodsPaidRequiredForPartial", nil)
			}
			if entry.PaymentFrequency == nil {
				return pkg.BadRequestError("PaymentFrequencyRequiredForPartial", nil)
			}
			if entry.BillingCycleStartDate == nil {
				return pkg.BadRequestError("BillingCycleStartDateRequiredForPartial", nil)
			}
		}
	}

	now := time.Now()

	transaction := s.appCtx.DB.Begin()
	if transaction.Error != nil {
		return pkg.InternalServerError(transaction.Error.Error(), &pkg.RentLoopErrorParams{
			Err: transaction.Error,
			Metadata: map[string]string{
				"function": "BulkOnboardLeases",
				"action":   "beginning transaction",
			},
		})
	}
	transCtx := lib.WithTransaction(ctx, transaction)

	// Look up the client's default OFFLINE payment account once for the whole batch.
	// Required to run the full payment flow for FULL/PARTIAL entries.
	offlineRail := "OFFLINE"
	isDefault := true
	activeStatus := "ACTIVE"
	paymentAccounts, paErr := s.paymentAccountService.ListPaymentAccounts(ctx, repository.ListPaymentAccountsFilter{
		ClientID:  &input.ClientID,
		Rail:      &offlineRail,
		IsDefault: &isDefault,
		Status:    &activeStatus,
	})
	if paErr != nil {
		transaction.Rollback()
		return paErr
	}
	if len(paymentAccounts) == 0 {
		transaction.Rollback()
		return pkg.BadRequestError("NoDefaultOfflinePaymentAccount", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{
				"function":  "BulkOnboardLeases",
				"client_id": input.ClientID,
			},
		})
	}
	defaultPaymentAccountID := paymentAccounts[0].ID.String()

	type notificationPayload struct {
		firstName    string
		unitName     string
		appCode      string
		phone        string
		email        *string
		accountPhone string
	}
	var notifications []notificationPayload

	for _, entry := range input.Entries {
		// Fetch the unit inside the transaction with FOR UPDATE so concurrent
		// onboarding requests cannot race on the same unit.
		unit, err := s.unitService.GetUnitByIDForUpdate(transCtx, entry.UnitId)
		if err != nil {
			transaction.Rollback()
			return err
		}
		if unit.PropertyID != input.PropertyID {
			transaction.Rollback()
			return pkg.BadRequestError("UnitsNotUnderProperty", nil)
		}
		if unit.Status != "Unit.Status.Available" && unit.Status != "Unit.Status.PartiallyOccupied" {
			transaction.Rollback()
			return pkg.BadRequestError("UnitNoLongerAvailable", nil)
		}

		occupation := "N/A"
		if entry.Occupation != nil {
			occupation = *entry.Occupation
		}
		employer := "N/A"
		if entry.Employer != nil {
			employer = *entry.Employer
		}

		// 1. Create TenantApplication (Completed immediately)
		leaseDocMode := "MANUAL"
		tenantApp := models.TenantApplication{
			DesiredUnitId:                  entry.UnitId,
			RentFee:                        entry.RentFee,
			RentFeeCurrency:                entry.RentFeeCurrency,
			PaymentFrequency:               entry.PaymentFrequency,
			DesiredMoveInDate:              &entry.MoveInDate,
			StayDurationFrequency:          &entry.StayDurationFrequency,
			StayDuration:                   &entry.StayDuration,
			LeaseAgreementDocumentMode:     &leaseDocMode,
			LeaseAgreementDocumentUrl:      &entry.LeaseAgreementDocumentUrl,
			FirstName:                      entry.FirstName,
			OtherNames:                     entry.OtherNames,
			LastName:                       entry.LastName,
			Email:                          entry.Email,
			Phone:                          entry.Phone,
			Gender:                         entry.Gender,
			DateOfBirth:                    entry.DateOfBirth,
			Nationality:                    entry.Nationality,
			MaritalStatus:                  entry.MaritalStatus,
			CurrentAddress:                 entry.CurrentAddress,
			IDType:                         entry.IDType,
			IDNumber:                       entry.IDNumber,
			EmergencyContactName:           entry.EmergencyContactName,
			EmergencyContactPhone:          entry.EmergencyContactPhone,
			RelationshipToEmergencyContact: entry.RelationshipToEmergencyContact,
			Occupation:                     occupation,
			Employer:                       employer,
			OccupationAddress:              "N/A",
			SecurityDepositFee:             &entry.SecurityDepositFee,
			SecurityDepositFeeCurrency:     entry.SecurityDepositFeeCurrency,
			CreatedById:                    input.ClientUserID,
			Status:                         "TenantApplication.Status.Completed",
			CompletedAt:                    &now,
			CompletedById:                  &input.ClientUserID,
		}
		if createAppErr := s.repo.Create(transCtx, &tenantApp); createAppErr != nil {
			transaction.Rollback()
			return pkg.InternalServerError(createAppErr.Error(), &pkg.RentLoopErrorParams{
				Err: createAppErr,
				Metadata: map[string]string{
					"function": "BulkOnboardLeases",
					"action":   "creating tenant application",
				},
			})
		}

		// 2. Build the first invoice and compute next_billing_date based on rent_payment_status.
		//
		// FULL / PARTIAL → PAID invoice (historical record of rent collected + security deposit).
		//   Status=PAID skips Fincore journal entry posting.
		// NONE → ISSUED invoice covering all unpaid periods from move_in_date to now,
		//   plus security deposit. Tenant owes this amount.
		var nextBillingDate *time.Time
		{
			appID := tenantApp.ID.String()
			propertyID := input.PropertyID
			clientID := input.ClientID

			var lineItems []LineItemInput
			total := int64(0)
			var rentLineAmount int64
			var invoiceStatus string

			switch entry.RentPaymentStatus {
			case "FULL":
				rentLineAmount = entry.RentFee * entry.StayDuration
				invoiceStatus = "PAID"
				// nextBillingDate stays nil — fully paid, no more invoices

			case "PARTIAL":
				rentLineAmount = entry.RentFee * *entry.PeriodsPaid
				invoiceStatus = "PAID"
				// Advance next billing from cycle start by periods_paid steps
				if entry.BillingCycleStartDate != nil && entry.PaymentFrequency != nil {
					base := *entry.BillingCycleStartDate
					for i := int64(0); i < *entry.PeriodsPaid; i++ {
						next := calculateNextBillingDate(base, *entry.PaymentFrequency)
						if next == nil {
							break
						}
						base = *next
					}
					nextBillingDate = &base
				}

			case "NONE":
				invoiceStatus = "ISSUED"
				// Count elapsed periods from move_in_date to now (inclusive of current period)
				var elapsedPeriods int64
				if entry.PaymentFrequency != nil {
					base := entry.MoveInDate
					for !base.After(now) {
						next := calculateNextBillingDate(base, *entry.PaymentFrequency)
						if next == nil {
							break
						}
						base = *next
						elapsedPeriods++
					}
					if elapsedPeriods > 0 {
						nextBillingDate = &base
					} else {
						// Move-in is in the future; bill from move_in_date
						moveIn := entry.MoveInDate
						nextBillingDate = &moveIn
					}
				}
				rentLineAmount = entry.RentFee * elapsedPeriods
			}

			if rentLineAmount > 0 {
				lineItems = append(lineItems, LineItemInput{
					Label:       "Rent Payment",
					Category:    "RENT",
					Quantity:    1,
					UnitAmount:  rentLineAmount,
					TotalAmount: rentLineAmount,
					Currency:    entry.RentFeeCurrency,
				})
				total += rentLineAmount
			}
			if entry.SecurityDepositFee > 0 {
				lineItems = append(lineItems, LineItemInput{
					Label:       "Security Deposit",
					Category:    "SECURITY_DEPOSIT",
					Quantity:    1,
					UnitAmount:  entry.SecurityDepositFee,
					TotalAmount: entry.SecurityDepositFee,
					Currency:    entry.SecurityDepositFeeCurrency,
				})
				total += entry.SecurityDepositFee
			}

			if len(lineItems) > 0 {
				invoice, invoiceErr := s.invoiceService.CreateInvoice(transCtx, CreateInvoiceInput{
					ClientID:                   &clientID,
					PropertyID:                 &propertyID,
					PayerType:                  "TENANT_APPLICATION",
					PayeeType:                  "PROPERTY_OWNER",
					PayeeClientID:              &clientID,
					ContextType:                "TENANT_APPLICATION",
					ContextTenantApplicationID: &appID,
					TotalAmount:                total,
					Taxes:                      0,
					SubTotal:                   total,
					Currency:                   entry.RentFeeCurrency,
					Status:                     "ISSUED",
					LineItems:                  lineItems,
				})
				if invoiceErr != nil {
					transaction.Rollback()
					return invoiceErr
				}

				// For FULL/PARTIAL entries the rent was already collected offline.
				// Run the full payment flow so there is an audit trail and the
				// settlement journal entry is posted to Fincore.
				if invoiceStatus == "PAID" {
					invoiceID := invoice.ID.String()
					provider := lib.SafeString(paymentAccounts[0].Provider)
					payment, paymentErr := s.paymentService.CreateOfflinePayment(transCtx, CreateOfflinePaymentInput{
						PaymentAccountID: defaultPaymentAccountID,
						InvoiceID:        invoiceID,
						Provider:         provider,
						Amount:           total,
					})
					if paymentErr != nil {
						transaction.Rollback()
						return paymentErr
					}

					_, verifyErr := s.paymentService.VerifyOfflinePayment(transCtx, VerifyOfflinePaymentInput{
						VerifiedByID: input.ClientUserID,
						PaymentID:    payment.ID.String(),
						IsSuccessful: true,
					})
					if verifyErr != nil {
						transaction.Rollback()
						return verifyErr
					}
				}
			}
		}

		// 3. Get or create Tenant
		tenantInput := CreateTenantInput{
			FirstName:                      entry.FirstName,
			OtherNames:                     entry.OtherNames,
			LastName:                       entry.LastName,
			Email:                          entry.Email,
			Phone:                          entry.Phone,
			Gender:                         entry.Gender,
			DateOfBirth:                    entry.DateOfBirth,
			Nationality:                    entry.Nationality,
			MaritalStatus:                  entry.MaritalStatus,
			IDType:                         entry.IDType,
			IDNumber:                       entry.IDNumber,
			EmergencyContactName:           entry.EmergencyContactName,
			EmergencyContactPhone:          entry.EmergencyContactPhone,
			RelationshipToEmergencyContact: entry.RelationshipToEmergencyContact,
			Occupation:                     occupation,
			Employer:                       employer,
			OccupationAddress:              "N/A",
			CreatedById:                    input.ClientUserID,
		}
		tenant, tenantErr := s.tenantService.GetOrCreateTenant(transCtx, tenantInput)
		if tenantErr != nil {
			transaction.Rollback()
			return tenantErr
		}

		// 4. Get or create TenantAccount
		tenantAccount, accountErr := s.tenantAccountService.GetOrCreateTenantAccount(transCtx, CreateTenantAccountInput{
			TenantId:    tenant.ID.String(),
			PhoneNumber: entry.Phone,
		})
		if accountErr != nil {
			transaction.Rollback()
			return accountErr
		}

		// 5. Create Lease (Active)
		appIDStr := tenantApp.ID.String()
		meta := map[string]any{
			"security_deposit_fee":          entry.SecurityDepositFee,
			"security_deposit_fee_currency": entry.SecurityDepositFeeCurrency,
			"rent_payment_status":           entry.RentPaymentStatus,
		}
		if entry.PeriodsPaid != nil {
			meta["periods_paid"] = *entry.PeriodsPaid
		}
		if entry.BillingCycleStartDate != nil {
			meta["billing_cycle_start_date"] = (*entry.BillingCycleStartDate).Format(time.RFC3339)
		}
		_, leaseErr := s.leaseService.CreateLease(transCtx, CreateLeaseInput{
			Status:                    "Lease.Status.Active",
			UnitId:                    entry.UnitId,
			TenantId:                  tenant.ID.String(),
			TenantApplicationId:       appIDStr,
			RentFee:                   entry.RentFee,
			RentFeeCurrency:           entry.RentFeeCurrency,
			PaymentFrequency:          entry.PaymentFrequency,
			Meta:                      meta,
			MoveInDate:                entry.MoveInDate,
			StayDurationFrequency:     entry.StayDurationFrequency,
			StayDuration:              entry.StayDuration,
			LeaseAgreementDocumentUrl: entry.LeaseAgreementDocumentUrl,
		})
		if leaseErr != nil {
			transaction.Rollback()
			return leaseErr
		}

		// Set ActivatedAt/ActivatedById on the lease directly (CreateLease doesn't accept these fields)
		// nextBillingDate was computed in the invoice block above.
		if updateErr := transaction.WithContext(ctx).
			Model(&models.Lease{}).
			Where("tenant_application_id = ?", appIDStr).
			Updates(map[string]any{
				"activated_at":      now,
				"activated_by_id":   input.ClientUserID,
				"next_billing_date": nextBillingDate,
			}).Error; updateErr != nil {
			transaction.Rollback()
			return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
				Err: updateErr,
				Metadata: map[string]string{
					"function": "BulkOnboardLeases",
					"action":   "setting lease activated_at",
				},
			})
		}

		// 6. Update unit status
		occupyingLeases, err := s.leaseService.CountOccupyingByUnitID(transCtx, unit.ID.String())
		if err != nil {
			transaction.Rollback()
			return err
		}
		var newUnitStatus string
		if occupyingLeases >= int64(unit.MaxOccupantsAllowed) {
			newUnitStatus = "Unit.Status.Occupied"
		} else if occupyingLeases > 0 {
			newUnitStatus = "Unit.Status.PartiallyOccupied"
		}
		if newUnitStatus != "" && unit.Status != newUnitStatus {
			if updateErr := s.unitService.SetSystemUnitStatus(transCtx, UpdateUnitStatusInput{
				PropertyID: unit.PropertyID,
				UnitID:     unit.ID.String(),
				Status:     newUnitStatus,
			}); updateErr != nil {
				transaction.Rollback()
				return updateErr
			}
		}

		notifications = append(notifications, notificationPayload{
			firstName:    entry.FirstName,
			unitName:     unit.Name,
			appCode:      tenantApp.Code,
			phone:        entry.Phone,
			email:        entry.Email,
			accountPhone: tenantAccount.PhoneNumber,
		})
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		transaction.Rollback()
		return pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"function": "BulkOnboardLeases",
				"action":   "committing transaction",
			},
		})
	}

	// Fire notifications after commit (non-blocking goroutines)
	for _, n := range notifications {
		r := strings.NewReplacer(
			"{{applicant_name}}", n.firstName,
			"{{unit_name}}", n.unitName,
			"{{application_code}}", n.appCode,
			"{{phone_number}}", n.accountPhone,
		)
		message := r.Replace(lib.TENANT_APPLICATION_APPROVED_BODY)
		smsMessage := r.Replace(lib.TENANT_APPLICATION_APPROVED_SMS_BODY)

		if n.email != nil {
			email := *n.email
			go pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
				Recipient: email,
				Subject:   lib.TENANT_APPLICATION_APPROVED_SUBJECT,
				TextBody:  message,
			})
		}
		go s.appCtx.Clients.GatekeeperAPI.SendSMS(context.Background(), gatekeeper.SendSMSInput{
			Recipient: n.phone,
			Message:   smsMessage,
		})
	}

	return nil
}
