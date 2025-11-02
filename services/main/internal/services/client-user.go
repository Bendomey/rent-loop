package services

import (
	"context"
	"errors"
	"slices"
	"strings"

	"github.com/Bendomey/goutilities/pkg/hashpassword"
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

type ClientUserService interface {
	CreateClientUser(ctx context.Context, input CreateClientUserInput) (*models.ClientUser, error)
	AuthenticateClientUser(ctx context.Context, input AuthenticateClientUserInput) (*AuthenticateClientUserResponse, error)
	GetClientUser(ctx context.Context, clientUserId string) (*models.ClientUser, error)
	SendForgotPasswordResetLink(ctx context.Context, email string) (*models.ClientUser, error)
	ResetPassword(ctx context.Context, input ResetClientUserPasswordInput) (*models.ClientUser, error)
}

type clientUserService struct {
	appCtx     pkg.AppContext
	repo       repository.ClientUserRepository
	clientRepo repository.ClientRepository
}

func NewClientUserService(appCtx pkg.AppContext, repo repository.ClientUserRepository, clientRepo repository.ClientRepository) ClientUserService {
	return &clientUserService{appCtx, repo, clientRepo}
}

type CreateClientUserInput struct {
	ClientID    string
	Name        string
	Email       string
	Phone       string
	Role        string
	CreatedByID string
}

func (s *clientUserService) CreateClientUser(ctx context.Context, input CreateClientUserInput) (*models.ClientUser, error) {
	existingClientUser, clientUserErr := s.repo.GetByEmail(ctx, input.Email)

	if clientUserErr != nil {
		if !errors.Is(clientUserErr, gorm.ErrRecordNotFound) {
			raven.CaptureError(clientUserErr, nil)
			return nil, clientUserErr
		}
	}

	if existingClientUser != nil {
		return nil, errors.New("email already in use")
	}

	adminClientUser, adminClientUserErr := s.repo.GetByID(ctx, input.CreatedByID)

	if adminClientUserErr != nil {
		if !errors.Is(adminClientUserErr, gorm.ErrRecordNotFound) {
			raven.CaptureError(adminClientUserErr, nil)
		}
		return nil, adminClientUserErr
	}

	if adminClientUser != nil && slices.Contains([]string{"ADMIN", "OWNER"}, adminClientUser.Role) == false {
		return nil, errors.New("unauthorized to create client user")
	}

	password, err := gonanoid.Generate("abcdefghijklmnopqrstuvwxyz1234567890", 10)
	if err != nil {
		raven.CaptureError(err, map[string]string{
			"function": "CreateClientUser",
			"action":   "generating random password",
		})
		return nil, err
	}

	clientUser := models.ClientUser{
		ClientID:    input.ClientID,
		Name:        input.Name,
		PhoneNumber: input.Phone,
		Email:       input.Email,
		Password:    password,
		Role:        input.Role,
		CreatedByID: &input.CreatedByID,
	}

	if err := s.repo.Create(ctx, &clientUser); err != nil {
		return nil, err
	}

	client, clientErr := s.clientRepo.GetByID(ctx, input.ClientID)
	if clientErr != nil {
		return nil, err
	}

	r := strings.NewReplacer(
		"{{name}}", input.Name,
		"{{client_name}}", client.Name,
		"{{email}}", input.Email,
		"{{password}}", password,
	)
	message := r.Replace(lib.CLIENT_USER_ADDED_BODY)

	go pkg.SendEmail(
		s.appCtx,
		pkg.SendEmailInput{
			Recipient: input.Email,
			Subject:   lib.CLIENT_USER_ADDED_SUBJECT,
			TextBody:  message,
		},
	)

	go pkg.SendSMS(
		s.appCtx,
		pkg.SendSMSInput{
			Recipient: input.Phone,
			Message:   message,
		},
	)

	return &clientUser, nil
}

type AuthenticateClientUserInput struct {
	Email    string
	Password string
}

type AuthenticateClientUserResponse struct {
	ClientUser models.ClientUser
	Token      string
}

func (s *clientUserService) AuthenticateClientUser(ctx context.Context, input AuthenticateClientUserInput) (*AuthenticateClientUserResponse, error) {
	clientUser, clientUserErr := s.repo.GetByEmail(ctx, input.Email)
	if clientUserErr != nil {
		if !errors.Is(clientUserErr, gorm.ErrRecordNotFound) {
			raven.CaptureError(clientUserErr, nil)
		}
		return nil, clientUserErr
	}

	isSame := validatehash.ValidateCipher(input.Password, clientUser.Password)
	if !isSame {
		return nil, errors.New("PasswordIncorrect")
	}

	token, signTokenErrr := signjwt.SignJWT(jwt.MapClaims{
		"id":        clientUser.ID,
		"client_id": clientUser.ClientID,
	}, s.appCtx.Config.TokenSecrets.ClientUserSecret)

	if signTokenErrr != nil {
		raven.CaptureError(signTokenErrr, map[string]string{
			"function": "AuthenticateClientUser",
			"action":   "signing token",
		})
		return nil, signTokenErrr
	}

	return &AuthenticateClientUserResponse{
		ClientUser: *clientUser,
		Token:      token,
	}, nil
}

func (s *clientUserService) GetClientUser(ctx context.Context, clientUserId string) (*models.ClientUser, error) {
	return s.repo.GetByID(ctx, clientUserId)
}

func (s *clientUserService) SendForgotPasswordResetLink(ctx context.Context, email string) (*models.ClientUser, error) {
	clientUser, clientUserErr := s.repo.GetByEmail(ctx, email)
	if clientUserErr != nil {
		if !errors.Is(clientUserErr, gorm.ErrRecordNotFound) {
			raven.CaptureError(clientUserErr, nil)
		}
		return nil, errors.New("EmailNotFound")
	}

	token, signTokenErrr := signjwt.SignJWT(jwt.MapClaims{
		"id":        clientUser.ID,
		"client_id": clientUser.ClientID,
	}, s.appCtx.Config.TokenSecrets.ClientUserSecret)

	if signTokenErrr != nil {
		raven.CaptureError(signTokenErrr, map[string]string{
			"function": "SendForgotPasswordResetLink",
			"action":   "signing token",
		})
		return nil, signTokenErrr
	}

	r := strings.NewReplacer(
		"{{name}}", clientUser.Name,
		"{{reset_token}}", token,
	)
	message := r.Replace(lib.CLIENT_USER_PASSWORD_RESET_BODY)

	go pkg.SendEmail(
		s.appCtx,
		pkg.SendEmailInput{
			Recipient: clientUser.Email,
			Subject:   lib.CLIENT_USER_PASSWORD_RESET_SUBJECT,
			TextBody:  message,
		},
	)

	return clientUser, nil
}

type ResetClientUserPasswordInput struct {
	ID          string
	NewPassword string
}

func (s *clientUserService) ResetPassword(ctx context.Context, input ResetClientUserPasswordInput) (*models.ClientUser, error) {
	clientUser, clientUserErr := s.repo.GetByID(ctx, input.ID)
	if clientUserErr != nil {
		if !errors.Is(clientUserErr, gorm.ErrRecordNotFound) {
			raven.CaptureError(clientUserErr, nil)
		}
		return nil, clientUserErr
	}

	hashed, err := hashpassword.HashPassword(input.NewPassword)
	if err != nil {
		raven.CaptureError(err, map[string]string{
			"function": "ResetPassword",
			"action":   "hashing new password",
		})
		return nil, err
	}

	clientUser.Password = hashed

	if err := s.repo.Update(ctx, clientUser); err != nil {
		raven.CaptureError(err, nil)
		return nil, err
	}

	return clientUser, nil
}
