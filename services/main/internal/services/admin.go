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
	"github.com/getsentry/raven-go"
	gonanoid "github.com/matoous/go-nanoid"
	"gorm.io/gorm"
)

type AdminService interface {
	AuthenticateAdmin(ctx context.Context, input LoginAdminInput) (*AuthenticateAdminResponse, error)
	GetAdmin(ctx context.Context, adminId string) (*models.Admin, error)
	CreateAdmin(ctx context.Context, input CreateAdminInput) (*models.Admin, error)
	ListAdmins(ctx context.Context, filterQuery lib.FilterQuery, filters repository.ListAdminsFilter) ([]models.Admin, error)
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

func (s *adminService) AuthenticateAdmin(ctx context.Context, input LoginAdminInput) (*AuthenticateAdminResponse, error) {
	admin, err := s.repo.GetByEmail(ctx, input.Email)
	if err != nil {
		return nil, err
	}

	//since email in db, lets validate hash and then send back
	isSame := validatehash.ValidateCipher(input.Password, admin.Password)
	if !isSame {
		return nil, errors.New("PasswordIncorrect")
	}

	token, signTokenErrr := signjwt.SignJWT(jwt.MapClaims{
		"id": admin.ID,
	}, s.appCtx.Config.TokenSecrets.AdminSecret)

	if signTokenErrr != nil {
		return nil, signTokenErrr
	}

	return &AuthenticateAdminResponse{
		Admin: *admin,
		Token: token,
	}, nil
}

func (s *adminService) GetAdmin(ctx context.Context, adminId string) (*models.Admin, error) {
	return s.repo.GetByID(ctx, adminId)
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
		if !errors.Is(adminByEmailErr, gorm.ErrRecordNotFound) {
			raven.CaptureError(adminByEmailErr, nil)
			return nil, adminByEmailErr
		}
	}

	if adminByEmail != nil {
		return nil, errors.New("email already in use")
	}

	// generate password
	password, err := gonanoid.Generate("abcdefghijklmnopqrstuvwxyz1234567890", 10)
	if err != nil {
		raven.CaptureError(err, map[string]string{
			"function": "CreateAdmin",
			"action":   "generating random password",
		})
		return nil, err
	}

	admin := models.Admin{
		Name:        input.Name,
		Email:       input.Email,
		Password:    password,
		CreatedByID: &input.CreatedByID,
	}

	if err := s.repo.Create(ctx, &admin); err != nil {
		return nil, err
	}

	return &admin, nil
}

func (s *adminService) ListAdmins(ctx context.Context, filterQuery lib.FilterQuery, filters repository.ListAdminsFilter) ([]models.Admin, error) {
	admins, err := s.repo.List(ctx, filterQuery, filters)
	if err != nil {
		return nil, err
	}

	return *admins, nil
}

func (s *adminService) CountAdmins(ctx context.Context, filterQuery lib.FilterQuery, filters repository.ListAdminsFilter) (int64, error) {
	return s.repo.Count(ctx, filterQuery, filters)
}
