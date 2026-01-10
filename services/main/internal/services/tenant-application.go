package services

import (
	"context"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
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
