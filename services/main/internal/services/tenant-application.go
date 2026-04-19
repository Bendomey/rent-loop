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
	BulkCreateTenantApplications(
		ctx context.Context,
		input BulkCreateTenantApplicationsInput,
	) ([]*models.TenantApplication, error)
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

	source := "SELF"
	tenantApplication := models.TenantApplication{
		DesiredUnitId:                  &input.DesiredUnitId,
		RentFee:                        &unit.RentFee,
		RentFeeCurrency:                &unit.RentFeeCurrency,
		StayDurationFrequency:          &unit.PaymentFrequency,
		PaymentFrequency:               &unit.PaymentFrequency,
		Source:                         &source,
		FirstName:                      &input.FirstName,
		OtherNames:                     input.OtherNames,
		LastName:                       &input.LastName,
		Email:                          input.Email,
		Phone:                          input.Phone,
		Gender:                         &input.Gender,
		DateOfBirth:                    &input.DateOfBirth,
		Nationality:                    &input.Nationality,
		MaritalStatus:                  &input.MaritalStatus,
		IDType:                         &input.IDType,
		IDNumber:                       &input.IDNumber,
		IDFrontUrl:                     input.IDFrontUrl,
		IDBackUrl:                      input.IDBackUrl,
		CurrentAddress:                 &input.CurrentAddress,
		EmergencyContactName:           &input.EmergencyContactName,
		EmergencyContactPhone:          &input.EmergencyContactPhone,
		RelationshipToEmergencyContact: &input.RelationshipToEmergencyContact,
		Occupation:                     &input.Occupation,
		Employer:                       &input.Employer,
		EmployerType:                   &input.EmployerType,
		ProofOfIncomeUrl:               input.ProofOfIncomeUrl,
		OccupationAddress:              &input.OccupationAddress,
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
		"{{applicant_name}}", input.FirstName,
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

type BulkCreateTenantApplicationEntry struct {
	Phone          string
	FirstName      *string
	LastName       *string
	Email          *string
	Gender         *string
	DateOfBirth    *time.Time
	Nationality    *string
	MaritalStatus  *string
	IDType         *string
	IDNumber       *string
	CurrentAddress *string
	DesiredUnitId  *string
	Occupation     *string
	Employer       *string
}

type BulkCreateTenantApplicationsInput struct {
	Entries     []BulkCreateTenantApplicationEntry
	PropertyID  string
	CreatedById string
}

func (s *tenantApplicationService) BulkCreateTenantApplications(
	ctx context.Context,
	input BulkCreateTenantApplicationsInput,
) ([]*models.TenantApplication, error) {
	source := "CSV_BULK"

	type notificationPayload struct {
		phone string
		email *string
		code  string
	}
	var notifications []notificationPayload
	var created []*models.TenantApplication

	transaction := s.appCtx.DB.Begin()
	if transaction.Error != nil {
		return nil, pkg.InternalServerError(transaction.Error.Error(), &pkg.RentLoopErrorParams{
			Err: transaction.Error,
			Metadata: map[string]string{
				"function": "BulkCreateTenantApplications",
				"action":   "beginning transaction",
			},
		})
	}
	transCtx := lib.WithTransaction(ctx, transaction)

	for _, entry := range input.Entries {
		if entry.DesiredUnitId != nil {
			unit, err := s.unitService.GetUnitByID(transCtx, *entry.DesiredUnitId)
			if err != nil {
				transaction.Rollback()
				return nil, err
			}
			if unit.PropertyID != input.PropertyID {
				transaction.Rollback()
				return nil, pkg.BadRequestError("UnitsNotUnderProperty", nil)
			}
			if unit.Status != "Unit.Status.Available" && unit.Status != "Unit.Status.PartiallyOccupied" {
				transaction.Rollback()
				return nil, pkg.BadRequestError("UnitNoLongerAvailable", nil)
			}
		}

		app := models.TenantApplication{
			Source:         &source,
			Phone:          entry.Phone,
			FirstName:      entry.FirstName,
			LastName:       entry.LastName,
			Email:          entry.Email,
			Gender:         entry.Gender,
			DateOfBirth:    entry.DateOfBirth,
			Nationality:    entry.Nationality,
			MaritalStatus:  entry.MaritalStatus,
			IDType:         entry.IDType,
			IDNumber:       entry.IDNumber,
			CurrentAddress: entry.CurrentAddress,
			DesiredUnitId:  entry.DesiredUnitId,
			Occupation:     entry.Occupation,
			Employer:       entry.Employer,
			CreatedById:    input.CreatedById,
			Status:         "TenantApplication.Status.InProgress",
		}

		if err := s.repo.Create(transCtx, &app); err != nil {
			transaction.Rollback()
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "BulkCreateTenantApplications",
					"action":   "creating tenant application",
				},
			})
		}

		notifications = append(notifications, notificationPayload{
			phone: entry.Phone,
			email: entry.Email,
			code:  app.Code,
		})
		appCopy := app
		created = append(created, &appCopy)
	}

	if err := transaction.Commit().Error; err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "BulkCreateTenantApplications",
				"action":   "committing transaction",
			},
		})
	}

	for _, n := range notifications {
		code := n.code
		email := n.email
		phone := n.phone

		r := strings.NewReplacer(
			"{{application_code}}", code,
		)
		smsMsg := lib.ApplyGlobalVariableTemplate(s.appCtx.Config, r.Replace(lib.TENANT_CSV_CREATED_SMS_BODY))
		emailBody := lib.ApplyGlobalVariableTemplate(s.appCtx.Config, r.Replace(lib.TENANT_CSV_CREATED_BODY))

		go s.appCtx.Clients.GatekeeperAPI.SendSMS(
			context.Background(),
			gatekeeper.SendSMSInput{
				Recipient: phone,
				Message:   smsMsg,
			},
		)

		if email != nil {
			go pkg.SendEmail(
				s.appCtx.Config,
				pkg.SendEmailInput{
					Recipient: *email,
					Subject:   lib.TENANT_CSV_CREATED_SUBJECT,
					TextBody:  emailBody,
				},
			)
		}
	}

	return created, nil
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
		tenantApplication.DesiredUnitId = input.DesiredUnitId
	}

	if input.RentFee != nil {
		tenantApplication.RentFee = input.RentFee
	}

	if input.RentFeeCurrency != nil {
		tenantApplication.RentFeeCurrency = input.RentFeeCurrency
	}

	if input.FirstName != nil {
		tenantApplication.FirstName = input.FirstName
	}

	if input.LastName != nil {
		tenantApplication.LastName = input.LastName
	}

	if input.Phone != nil {
		tenantApplication.Phone = *input.Phone
	}

	if input.Gender != nil {
		tenantApplication.Gender = input.Gender
	}

	if input.DateOfBirth != nil {
		tenantApplication.DateOfBirth = input.DateOfBirth
	}

	if input.Nationality != nil {
		tenantApplication.Nationality = input.Nationality
	}

	if input.MaritalStatus != nil {
		tenantApplication.MaritalStatus = input.MaritalStatus
	}

	if input.IDType != nil {
		tenantApplication.IDType = input.IDType
	}

	if input.IDNumber != nil {
		tenantApplication.IDNumber = input.IDNumber
	}

	if input.CurrentAddress != nil {
		tenantApplication.CurrentAddress = input.CurrentAddress
	}

	if input.EmergencyContactName != nil {
		tenantApplication.EmergencyContactName = input.EmergencyContactName
	}

	if input.EmergencyContactPhone != nil {
		tenantApplication.EmergencyContactPhone = input.EmergencyContactPhone
	}

	if input.RelationshipToEmergencyContact != nil {
		tenantApplication.RelationshipToEmergencyContact = input.RelationshipToEmergencyContact
	}

	if input.Occupation != nil {
		tenantApplication.Occupation = input.Occupation
	}

	if input.Employer != nil {
		tenantApplication.Employer = input.Employer
	}

	if input.OccupationAddress != nil {
		tenantApplication.OccupationAddress = input.OccupationAddress
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

	cancelledApplicantName := ""
	if tenantApplication.FirstName != nil {
		cancelledApplicantName = *tenantApplication.FirstName
	}
	r := strings.NewReplacer(
		"{{applicant_name}}", cancelledApplicantName,
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
	if tenantApplication.DesiredUnitId == nil {
		return pkg.BadRequestError("ApplicationMissingUnit", nil)
	}
	if tenantApplication.FirstName == nil || *tenantApplication.FirstName == "" {
		return pkg.BadRequestError("ApplicationMissingPersonalInfo", nil)
	}
	if tenantApplication.LastName == nil || *tenantApplication.LastName == "" {
		return pkg.BadRequestError("ApplicationMissingPersonalInfo", nil)
	}
	if tenantApplication.Gender == nil || *tenantApplication.Gender == "" {
		return pkg.BadRequestError("ApplicationMissingPersonalInfo", nil)
	}
	if tenantApplication.DateOfBirth == nil {
		return pkg.BadRequestError("ApplicationMissingPersonalInfo", nil)
	}
	if tenantApplication.Nationality == nil || *tenantApplication.Nationality == "" {
		return pkg.BadRequestError("ApplicationMissingPersonalInfo", nil)
	}
	if tenantApplication.MaritalStatus == nil || *tenantApplication.MaritalStatus == "" {
		return pkg.BadRequestError("ApplicationMissingPersonalInfo", nil)
	}
	if tenantApplication.IDNumber == nil || *tenantApplication.IDNumber == "" {
		return pkg.BadRequestError("ApplicationMissingPersonalInfo", nil)
	}
	if tenantApplication.CurrentAddress == nil || *tenantApplication.CurrentAddress == "" {
		return pkg.BadRequestError("ApplicationMissingPersonalInfo", nil)
	}
	if tenantApplication.EmergencyContactName == nil || *tenantApplication.EmergencyContactName == "" {
		return pkg.BadRequestError("ApplicationMissingPersonalInfo", nil)
	}
	if tenantApplication.EmergencyContactPhone == nil || *tenantApplication.EmergencyContactPhone == "" {
		return pkg.BadRequestError("ApplicationMissingPersonalInfo", nil)
	}
	if tenantApplication.RentFee == nil {
		return pkg.BadRequestError("ApplicationMissingRentDetails", nil)
	}
	if tenantApplication.RentFeeCurrency == nil || *tenantApplication.RentFeeCurrency == "" {
		return pkg.BadRequestError("ApplicationMissingRentDetails", nil)
	}
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

	unit, getUnitErr := s.unitService.GetUnitByID(ctx, *tenantApplication.DesiredUnitId)
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

	// create tenant — all pointer fields are guarded above so derefs are safe
	occupationVal := ""
	if tenantApplication.Occupation != nil {
		occupationVal = *tenantApplication.Occupation
	}
	employerVal := ""
	if tenantApplication.Employer != nil {
		employerVal = *tenantApplication.Employer
	}
	occupationAddressVal := ""
	if tenantApplication.OccupationAddress != nil {
		occupationAddressVal = *tenantApplication.OccupationAddress
	}
	relationshipVal := ""
	if tenantApplication.RelationshipToEmergencyContact != nil {
		relationshipVal = *tenantApplication.RelationshipToEmergencyContact
	}
	tenantInput := CreateTenantInput{
		FirstName:                      *tenantApplication.FirstName,
		OtherNames:                     tenantApplication.OtherNames,
		LastName:                       *tenantApplication.LastName,
		Email:                          tenantApplication.Email,
		Phone:                          tenantApplication.Phone,
		Gender:                         *tenantApplication.Gender,
		DateOfBirth:                    *tenantApplication.DateOfBirth,
		Nationality:                    *tenantApplication.Nationality,
		MaritalStatus:                  *tenantApplication.MaritalStatus,
		ProfilePhotoUrl:                tenantApplication.ProfilePhotoUrl,
		IDType:                         lib.SafeString(tenantApplication.IDType),
		IDNumber:                       *tenantApplication.IDNumber,
		IDFrontUrl:                     tenantApplication.IDFrontUrl,
		IDBackUrl:                      tenantApplication.IDBackUrl,
		EmergencyContactName:           *tenantApplication.EmergencyContactName,
		EmergencyContactPhone:          *tenantApplication.EmergencyContactPhone,
		RelationshipToEmergencyContact: relationshipVal,
		Occupation:                     occupationVal,
		Employer:                       employerVal,
		OccupationAddress:              occupationAddressVal,
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
		UnitId:                    *tenantApplication.DesiredUnitId,
		TenantId:                  tenant.ID.String(),
		TenantApplicationId:       tenantApplication.ID.String(),
		RentFee:                   *tenantApplication.RentFee,
		RentFeeCurrency:           *tenantApplication.RentFeeCurrency,
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
	approvedApplicantName := ""
	if tenantApplication.FirstName != nil {
		approvedApplicantName = *tenantApplication.FirstName
	}
	r := strings.NewReplacer(
		"{{applicant_name}}", approvedApplicantName,
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

	// Require a unit to be assigned before generating an invoice
	if tenantApplication.DesiredUnitId == nil {
		return nil, pkg.BadRequestError("ApplicationMissingUnit", nil)
	}
	if tenantApplication.RentFeeCurrency == nil {
		return nil, pkg.BadRequestError("ApplicationMissingRentDetails", nil)
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
		Currency:                   *tenantApplication.RentFeeCurrency,
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
