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
	DateOfBirth                    time.Time
	Nationality                    string
	MaritalStatus                  string
	ProfilePhotoUrl                *string
	IDType                         string
	IDNumber                       string
	IDFrontUrl                     *string
	IDBackUrl                      *string
	EmergencyContactName           string
	EmergencyContactPhone          string
	RelationshipToEmergencyContact string
	Occupation                     string
	Employer                       string
	OccupationAddress              string
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
