package services

import (
	"context"
	"errors"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

type TenantService interface {
	CreateTenant(context context.Context, input CreateTenantInput) (*models.Tenant, error)
	GetOrCreateTenant(context context.Context, input CreateTenantInput) (*models.Tenant, error)
	GetTenantByPhone(context context.Context, phone string) (*models.Tenant, error)
	GetTenantByID(context context.Context, query repository.GetTenantQuery) (*models.Tenant, error)
	ListTenantsByProperty(
		context context.Context,
		filter repository.ListTenantsByPropertyFilter,
	) (*[]models.Tenant, error)
	CountTenantsByProperty(context context.Context, filter repository.ListTenantsByPropertyFilter) (int64, error)
	GetTenantByIDForProperty(
		context context.Context,
		query repository.GetTenantByPropertyQuery,
	) (*models.Tenant, error)
	FindOrCreateLightTenant(ctx context.Context, input FindOrCreateLightTenantInput) (*models.Tenant, error)
	UpdateTenant(context context.Context, tenantID string, input UpdateTenantInput) (*models.Tenant, error)
}

type tenantService struct {
	appCtx pkg.AppContext
	repo   repository.TenantRepository
}

func NewTenantService(appCtx pkg.AppContext, repo repository.TenantRepository) TenantService {
	return &tenantService{appCtx: appCtx, repo: repo}
}

type CreateTenantInput struct {
	FirstName                      string
	OtherNames                     *string
	LastName                       string
	Email                          *string
	Phone                          string
	Gender                         string
	DateOfBirth                    *time.Time
	Nationality                    *string
	MaritalStatus                  *string
	ProfilePhotoUrl                *string
	IDType                         *string
	IDNumber                       *string
	IDFrontUrl                     *string
	IDBackUrl                      *string
	EmergencyContactName           *string
	EmergencyContactPhone          *string
	RelationshipToEmergencyContact *string
	Occupation                     *string
	Employer                       *string
	OccupationAddress              *string
	ProofOfIncomeUrl               *string
	CreatedById                    *string
}

func (s *tenantService) CreateTenant(ctx context.Context, input CreateTenantInput) (*models.Tenant, error) {
	tenant := models.Tenant{
		FirstName:                      input.FirstName,
		OtherNames:                     input.OtherNames,
		LastName:                       input.LastName,
		Email:                          input.Email,
		Phone:                          input.Phone,
		Gender:                         input.Gender,
		DateOfBirth:                    input.DateOfBirth,
		Nationality:                    input.Nationality,
		MaritalStatus:                  input.MaritalStatus,
		ProfilePhotoUrl:                input.ProfilePhotoUrl,
		IDType:                         input.IDType,
		IDNumber:                       input.IDNumber,
		IDFrontUrl:                     input.IDFrontUrl,
		IDBackUrl:                      input.IDBackUrl,
		EmergencyContactName:           input.EmergencyContactName,
		EmergencyContactPhone:          input.EmergencyContactPhone,
		RelationshipToEmergencyContact: input.RelationshipToEmergencyContact,
		Occupation:                     input.Occupation,
		Employer:                       input.Employer,
		OccupationAddress:              input.OccupationAddress,
		ProofOfIncomeUrl:               input.ProofOfIncomeUrl,
		CreatedById:                    input.CreatedById,
	}

	err := s.repo.Create(ctx, &tenant)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, pkg.ConflictError("TenantPhoneNumberAlreadyInUse", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateTenant",
				"action":   "creating tenant",
			},
		})

	}

	return &tenant, nil
}

func (s *tenantService) GetTenantByPhone(ctx context.Context, phone string) (*models.Tenant, error) {
	getTenant, err := s.repo.FindOne(ctx, map[string]any{"phone": phone})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("Tenant not found", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetTenantByPhone",
				"action":   "fetching tenant",
			},
		})
	}
	return getTenant, nil
}

func tenantGapUpdates(tenant *models.Tenant, input CreateTenantInput) map[string]any {
	updates := map[string]any{}
	if tenant.OtherNames == nil && input.OtherNames != nil {
		updates["other_names"] = input.OtherNames
	}
	if tenant.Email == nil && input.Email != nil {
		updates["email"] = input.Email
	}
	if tenant.DateOfBirth == nil && input.DateOfBirth != nil {
		updates["date_of_birth"] = input.DateOfBirth
	}
	if tenant.Nationality == nil && input.Nationality != nil {
		updates["nationality"] = input.Nationality
	}
	if tenant.MaritalStatus == nil && input.MaritalStatus != nil {
		updates["marital_status"] = input.MaritalStatus
	}
	if tenant.ProfilePhotoUrl == nil && input.ProfilePhotoUrl != nil {
		updates["profile_photo_url"] = input.ProfilePhotoUrl
	}
	if tenant.IDType == nil && input.IDType != nil {
		updates["id_type"] = input.IDType
	}
	if tenant.IDNumber == nil && input.IDNumber != nil {
		updates["id_number"] = input.IDNumber
	}
	if tenant.IDFrontUrl == nil && input.IDFrontUrl != nil {
		updates["id_front_url"] = input.IDFrontUrl
	}
	if tenant.IDBackUrl == nil && input.IDBackUrl != nil {
		updates["id_back_url"] = input.IDBackUrl
	}
	if tenant.EmergencyContactName == nil && input.EmergencyContactName != nil {
		updates["emergency_contact_name"] = input.EmergencyContactName
	}
	if tenant.EmergencyContactPhone == nil && input.EmergencyContactPhone != nil {
		updates["emergency_contact_phone"] = input.EmergencyContactPhone
	}
	if tenant.RelationshipToEmergencyContact == nil && input.RelationshipToEmergencyContact != nil {
		updates["relationship_to_emergency_contact"] = input.RelationshipToEmergencyContact
	}
	if tenant.Occupation == nil && input.Occupation != nil {
		updates["occupation"] = input.Occupation
	}
	if tenant.Employer == nil && input.Employer != nil {
		updates["employer"] = input.Employer
	}
	if tenant.OccupationAddress == nil && input.OccupationAddress != nil {
		updates["occupation_address"] = input.OccupationAddress
	}
	if tenant.ProofOfIncomeUrl == nil && input.ProofOfIncomeUrl != nil {
		updates["proof_of_income_url"] = input.ProofOfIncomeUrl
	}
	return updates
}

func (s *tenantService) GetOrCreateTenant(ctx context.Context, input CreateTenantInput) (*models.Tenant, error) {
	getTenant, getTenantErr := s.repo.FindOne(ctx, map[string]any{"phone": input.Phone})
	if getTenantErr != nil {
		if errors.Is(getTenantErr, gorm.ErrRecordNotFound) {
			createTenant, createTenantErr := s.CreateTenant(ctx, input)
			if createTenantErr != nil {
				return nil, createTenantErr
			}
			return createTenant, nil
		}
		return nil, pkg.InternalServerError(getTenantErr.Error(), &pkg.RentLoopErrorParams{
			Err: getTenantErr,
			Metadata: map[string]string{
				"function": "GetOrCreateTenant",
				"action":   "fetching tenant",
			},
		})
	}

	if updates := tenantGapUpdates(getTenant, input); len(updates) > 0 {
		if err := s.repo.Update(ctx, getTenant, updates); err != nil {
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "GetOrCreateTenant",
					"action":   "updating tenant",
				},
			})
		}
	}

	return getTenant, nil
}

func (s *tenantService) GetTenantByID(ctx context.Context, query repository.GetTenantQuery) (*models.Tenant, error) {
	tenant, err := s.repo.GetOneWithPopulate(ctx, query)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("Tenant not found", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetTenantByID",
				"action":   "fetching tenant",
			},
		})
	}
	return tenant, nil
}

func (s *tenantService) ListTenantsByProperty(
	ctx context.Context,
	filter repository.ListTenantsByPropertyFilter,
) (*[]models.Tenant, error) {
	tenants, err := s.repo.ListTenantsByProperty(ctx, filter)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListTenantsByProperty",
				"action":   "listing tenants",
			},
		})
	}
	return tenants, nil
}

func (s *tenantService) GetTenantByIDForProperty(
	ctx context.Context,
	query repository.GetTenantByPropertyQuery,
) (*models.Tenant, error) {
	tenant, err := s.repo.GetOneByProperty(ctx, query)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("Tenant not found", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetTenantByIDForProperty",
				"action":   "fetching tenant",
			},
		})
	}
	return tenant, nil
}

func (s *tenantService) CountTenantsByProperty(
	ctx context.Context,
	filter repository.ListTenantsByPropertyFilter,
) (int64, error) {
	count, err := s.repo.CountTenantsByProperty(ctx, filter)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountTenantsByProperty",
				"action":   "counting tenants",
			},
		})
	}
	return count, nil
}

type FindOrCreateLightTenantInput struct {
	FirstName   string
	LastName    string
	Phone       string
	Email       *string
	IDType      *string
	IDNumber    *string
	Gender      string
	CreatedById *string
}

func (s *tenantService) FindOrCreateLightTenant(
	ctx context.Context,
	input FindOrCreateLightTenantInput,
) (*models.Tenant, error) {
	// Try to find existing tenant by phone
	existing, err := s.repo.FindOne(ctx, map[string]any{"phone": input.Phone})
	if err == nil {
		return existing, nil
	}
	// Only proceed to create if the record genuinely doesn't exist
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Create new light tenant (only booking-relevant fields)
	tenant := &models.Tenant{
		FirstName:   input.FirstName,
		LastName:    input.LastName,
		Phone:       input.Phone,
		Email:       input.Email,
		IDType:      input.IDType,
		IDNumber:    input.IDNumber,
		Gender:      input.Gender,
		CreatedById: input.CreatedById,
	}
	if createErr := s.repo.Create(ctx, tenant); createErr != nil {
		return nil, createErr
	}
	return tenant, nil
}

type UpdateTenantInput struct {
	FirstName *string
	LastName  *string
	Gender    *string

	OtherNames                     lib.Optional[string]
	Email                          lib.Optional[string]
	DateOfBirth                    lib.Optional[time.Time]
	Nationality                    lib.Optional[string]
	MaritalStatus                  lib.Optional[string]
	ProfilePhotoUrl                lib.Optional[string]
	IDType                         lib.Optional[string]
	IDNumber                       lib.Optional[string]
	IDFrontUrl                     lib.Optional[string]
	IDBackUrl                      lib.Optional[string]
	EmergencyContactName           lib.Optional[string]
	EmergencyContactPhone          lib.Optional[string]
	RelationshipToEmergencyContact lib.Optional[string]
	Occupation                     lib.Optional[string]
	Employer                       lib.Optional[string]
	OccupationAddress              lib.Optional[string]
	ProofOfIncomeUrl               lib.Optional[string]
}

func (s *tenantService) UpdateTenant(
	ctx context.Context,
	tenantID string,
	input UpdateTenantInput,
) (*models.Tenant, error) {
	tenant, err := s.repo.FindOne(ctx, map[string]any{"id": tenantID})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("Tenant not found", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "UpdateTenant",
				"action":   "fetching tenant",
			},
		})
	}

	updates := map[string]any{}

	if input.FirstName != nil {
		updates["first_name"] = *input.FirstName
		tenant.FirstName = *input.FirstName
	}
	if input.LastName != nil {
		updates["last_name"] = *input.LastName
		tenant.LastName = *input.LastName
	}
	if input.Gender != nil {
		updates["gender"] = *input.Gender
		tenant.Gender = *input.Gender
	}
	if input.OtherNames.IsSet {
		updates["other_names"] = input.OtherNames.Ptr()
		tenant.OtherNames = input.OtherNames.Ptr()
	}
	if input.Email.IsSet {
		updates["email"] = input.Email.Ptr()
		tenant.Email = input.Email.Ptr()
	}
	if input.DateOfBirth.IsSet {
		updates["date_of_birth"] = input.DateOfBirth.Ptr()
		tenant.DateOfBirth = input.DateOfBirth.Ptr()
	}
	if input.Nationality.IsSet {
		updates["nationality"] = input.Nationality.Ptr()
		tenant.Nationality = input.Nationality.Ptr()
	}
	if input.MaritalStatus.IsSet {
		updates["marital_status"] = input.MaritalStatus.Ptr()
		tenant.MaritalStatus = input.MaritalStatus.Ptr()
	}
	if input.ProfilePhotoUrl.IsSet {
		updates["profile_photo_url"] = input.ProfilePhotoUrl.Ptr()
		tenant.ProfilePhotoUrl = input.ProfilePhotoUrl.Ptr()
	}
	if input.IDType.IsSet {
		updates["id_type"] = input.IDType.Ptr()
		tenant.IDType = input.IDType.Ptr()
	}
	if input.IDNumber.IsSet {
		updates["id_number"] = input.IDNumber.Ptr()
		tenant.IDNumber = input.IDNumber.Ptr()
	}
	if input.IDFrontUrl.IsSet {
		updates["id_front_url"] = input.IDFrontUrl.Ptr()
		tenant.IDFrontUrl = input.IDFrontUrl.Ptr()
	}
	if input.IDBackUrl.IsSet {
		updates["id_back_url"] = input.IDBackUrl.Ptr()
		tenant.IDBackUrl = input.IDBackUrl.Ptr()
	}
	if input.EmergencyContactName.IsSet {
		updates["emergency_contact_name"] = input.EmergencyContactName.Ptr()
		tenant.EmergencyContactName = input.EmergencyContactName.Ptr()
	}
	if input.EmergencyContactPhone.IsSet {
		updates["emergency_contact_phone"] = input.EmergencyContactPhone.Ptr()
		tenant.EmergencyContactPhone = input.EmergencyContactPhone.Ptr()
	}
	if input.RelationshipToEmergencyContact.IsSet {
		updates["relationship_to_emergency_contact"] = input.RelationshipToEmergencyContact.Ptr()
		tenant.RelationshipToEmergencyContact = input.RelationshipToEmergencyContact.Ptr()
	}
	if input.Occupation.IsSet {
		updates["occupation"] = input.Occupation.Ptr()
		tenant.Occupation = input.Occupation.Ptr()
	}
	if input.Employer.IsSet {
		updates["employer"] = input.Employer.Ptr()
		tenant.Employer = input.Employer.Ptr()
	}
	if input.OccupationAddress.IsSet {
		updates["occupation_address"] = input.OccupationAddress.Ptr()
		tenant.OccupationAddress = input.OccupationAddress.Ptr()
	}
	if input.ProofOfIncomeUrl.IsSet {
		updates["proof_of_income_url"] = input.ProofOfIncomeUrl.Ptr()
		tenant.ProofOfIncomeUrl = input.ProofOfIncomeUrl.Ptr()
	}

	if len(updates) == 0 {
		return tenant, nil
	}

	if err := s.repo.Update(ctx, tenant, updates); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "UpdateTenant",
				"action":   "updating tenant",
			},
		})
	}

	return tenant, nil
}
