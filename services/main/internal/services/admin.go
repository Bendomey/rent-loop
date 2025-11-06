package services

import (
	"context"
	"errors"

	"github.com/Bendomey/goutilities/pkg/signjwt"
	"github.com/Bendomey/goutilities/pkg/validatehash"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/dgrijalva/jwt-go"
	gonanoid "github.com/matoous/go-nanoid"
	"gorm.io/gorm"
)

type AdminService interface {
	AuthenticateAdmin(ctx context.Context, input LoginAdminInput) (*AuthenticateAdminResponse, error)
	GetAdmin(ctx context.Context, adminId string) (*models.Admin, error)
	CreateAdmin(ctx context.Context, input CreateAdminInput) (*models.Admin, error)
	ListAdmins(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListAdminsFilter,
	) ([]models.Admin, error)
	CountAdmins(ctx context.Context, filterQuery lib.FilterQuery, filters repository.ListAdminsFilter) (int64, error)
}

type adminService struct {
	appCtx pkg.AppContext
	repo   repository.AdminRepository
}

func NewAdminService(appCtx pkg.AppContext, repo repository.AdminRepository) AdminService {
	return &adminService{appCtx, repo}
}

type LoginAdminInput struct {
	Email    string
	Password string
}

type AuthenticateAdminResponse struct {
	Admin models.Admin
	Token string
}

func (s *adminService) AuthenticateAdmin(
	ctx context.Context,
	input LoginAdminInput,
) (*AuthenticateAdminResponse, error) {
	admin, err := s.repo.GetByEmail(ctx, input.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("EmailNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "AuthenticateAdmin",
				"action":   "fetching admin by email",
			},
		})
	}

	// since email in db, lets validate hash and then send back
	isSame := validatehash.ValidateCipher(input.Password, admin.Password)
	if !isSame {
		return nil, pkg.BadRequestError("PasswordIncorrect", &pkg.RentLoopErrorParams{
			Err: err,
		})
	}

	token, signTokenErrr := signjwt.SignJWT(jwt.MapClaims{
		"id": admin.ID,
	}, s.appCtx.Config.TokenSecrets.AdminSecret)

	if signTokenErrr != nil {
		return nil, pkg.InternalServerError(signTokenErrr.Error(), &pkg.RentLoopErrorParams{
			Err: signTokenErrr,
			Metadata: map[string]string{
				"function": "AuthenticateAdmin",
				"action":   "signing token",
			},
		})
	}

	return &AuthenticateAdminResponse{
		Admin: *admin,
		Token: token,
	}, nil
}

func (s *adminService) GetAdmin(ctx context.Context, adminId string) (*models.Admin, error) {
	admin, err := s.repo.GetByID(ctx, adminId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("AdminNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetAdmin",
				"action":   "fetching admin by ID",
			},
		})
	}

	return admin, nil
}

type CreateAdminInput struct {
	Name        string
	Email       string
	CreatedByID string
}

func (s *adminService) CreateAdmin(ctx context.Context, input CreateAdminInput) (*models.Admin, error) {
	// does email exists?
	adminByEmail, adminByEmailErr := s.repo.GetByEmail(ctx, input.Email)

	if adminByEmailErr != nil {
		if errors.Is(adminByEmailErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("EmailNotFound", &pkg.RentLoopErrorParams{
				Err: adminByEmailErr,
			})
		}

		return nil, pkg.InternalServerError(adminByEmailErr.Error(), &pkg.RentLoopErrorParams{
			Err: adminByEmailErr,
			Metadata: map[string]string{
				"function": "AuthenticateAdmin",
				"action":   "fetching admin by email",
			},
		})
	}

	if adminByEmail != nil {
		return nil, errors.New("email already in use")
	}

	// generate password
	password, err := gonanoid.Generate("abcdefghijklmnopqrstuvwxyz1234567890", 10)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateAdmin",
				"action":   "generating random password",
			},
		})
	}

	admin := models.Admin{
		Name:        input.Name,
		Email:       input.Email,
		Password:    password,
		CreatedByID: &input.CreatedByID,
	}

	if err := s.repo.Create(ctx, &admin); err != nil {
		return nil, pkg.BadRequestError(err.Error(), &pkg.RentLoopErrorParams{
			Err: adminByEmailErr,
		})
	}

	return &admin, nil
}

func (s *adminService) ListAdmins(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListAdminsFilter,
) ([]models.Admin, error) {
	admins, err := s.repo.List(ctx, filterQuery, filters)
	if err != nil {
		return nil, pkg.BadRequestError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
		})
	}

	return *admins, nil
}

func (s *adminService) CountAdmins(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListAdminsFilter,
) (int64, error) {
	count, err := s.repo.Count(ctx, filterQuery, filters)
	if err != nil {
		return 0, pkg.BadRequestError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
		})
	}

	return count, nil
}
