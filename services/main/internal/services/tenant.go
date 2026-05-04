package services

import (
	"context"
	"errors"
	"time"

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
	ListTenantsByProperty(context context.Context, filter repository.ListTenantsFilter) (*[]models.Tenant, error)
	CountTenantsByProperty(context context.Context, filter repository.ListTenantsFilter) (int64, error)
	FindOrCreateLightTenant(ctx context.Context, input FindOrCreateLightTenantInput) (*models.Tenant, error)
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
	CreatedById                    string
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
	filter repository.ListTenantsFilter,
) (*[]models.Tenant, error) {
	tenants, err := s.repo.List(ctx, filter)
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

func (s *tenantService) CountTenantsByProperty(
	ctx context.Context,
	filter repository.ListTenantsFilter,
) (int64, error) {
	count, err := s.repo.Count(ctx, filter)
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
	FirstName string
	LastName  string
	Phone     string
	Email     *string
	IDType    *string
	IDNumber  *string
	Gender    string
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
		FirstName: input.FirstName,
		LastName:  input.LastName,
		Phone:     input.Phone,
		Email:     input.Email,
		IDType:    input.IDType,
		IDNumber:  input.IDNumber,
		Gender:    input.Gender,
	}
	if createErr := s.repo.Create(ctx, tenant); createErr != nil {
		return nil, createErr
	}
	return tenant, nil
}
