package services

import (
	"context"
	"errors"
	"strings"

	"github.com/Bendomey/goutilities/pkg/hashpassword"
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

type ClientUserService interface {
	CreateClientUser(ctx context.Context, input CreateClientUserInput) (*models.ClientUser, error)
	AuthenticateClientUser(
		ctx context.Context,
		input AuthenticateClientUserInput,
	) (*AuthenticateClientUserResponse, error)
	GetClientUser(ctx context.Context, clientUserId string) (*models.ClientUser, error)
	SendForgotPasswordResetLink(ctx context.Context, email string) (*models.ClientUser, error)
	ResetPassword(
		ctx context.Context,
		input ResetClientUserPasswordInput,
	) (*models.ClientUser, error)
	GetClientUserByQuery(context context.Context, query map[string]any) (*models.ClientUser, error)
	ListClientUsers(
		ctx context.Context,
		filterQuery repository.ListClientUsersFilter,
	) ([]models.ClientUser, error)
	CountClientUsers(
		ctx context.Context,
		filterQuery repository.ListClientUsersFilter,
	) (int64, error)
}

type clientUserService struct {
	appCtx     pkg.AppContext
	repo       repository.ClientUserRepository
	clientRepo repository.ClientRepository
}

func NewClientUserService(
	appCtx pkg.AppContext,
	repo repository.ClientUserRepository,
	clientRepo repository.ClientRepository,
) ClientUserService {
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

func (s *clientUserService) CreateClientUser(
	ctx context.Context,
	input CreateClientUserInput,
) (*models.ClientUser, error) {
	existingClientUser, clientUserErr := s.repo.GetByEmail(ctx, input.Email)

	if clientUserErr != nil && !errors.Is(clientUserErr, gorm.ErrRecordNotFound) {
		return nil, pkg.InternalServerError(clientUserErr.Error(), &pkg.RentLoopErrorParams{
			Err: clientUserErr,
			Metadata: map[string]string{
				"function": "CreateClientUser",
				"action":   "checking existing client user by email",
			},
		})
	}

	if existingClientUser != nil {
		return nil, errors.New("email already in use")
	}

	password, err := gonanoid.Generate("abcdefghijklmnopqrstuvwxyz1234567890", 10)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateClientUser",
				"action":   "generating random password",
			},
		})
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
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateClientUser",
				"action":   "creating new client user",
			},
		})
	}

	client, clientErr := s.clientRepo.GetByID(ctx, input.ClientID)
	if clientErr != nil {
		return nil, pkg.InternalServerError(clientErr.Error(), &pkg.RentLoopErrorParams{
			Err: clientErr,
			Metadata: map[string]string{
				"function": "CreateClientUser",
				"action":   "fetching client for email notification",
			},
		})
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

func (s *clientUserService) AuthenticateClientUser(
	ctx context.Context,
	input AuthenticateClientUserInput,
) (*AuthenticateClientUserResponse, error) {
	clientUser, clientUserErr := s.repo.GetByEmail(ctx, input.Email)
	if clientUserErr != nil {
		if errors.Is(clientUserErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("ClientUserNotFound", &pkg.RentLoopErrorParams{
				Err: clientUserErr,
			})
		}

		return nil, pkg.InternalServerError(clientUserErr.Error(), &pkg.RentLoopErrorParams{
			Err: clientUserErr,
			Metadata: map[string]string{
				"function": "AuthenticateClientUser",
				"action":   "fetching client user by email",
			},
		})
	}

	isSame := validatehash.ValidateCipher(input.Password, clientUser.Password)
	if !isSame {
		return nil, pkg.BadRequestError("PasswordIncorrect", nil)
	}

	token, signTokenErrr := signjwt.SignJWT(jwt.MapClaims{
		"id":        clientUser.ID,
		"client_id": clientUser.ClientID,
	}, s.appCtx.Config.TokenSecrets.ClientUserSecret)

	if signTokenErrr != nil {
		return nil, pkg.InternalServerError(signTokenErrr.Error(), &pkg.RentLoopErrorParams{
			Err: signTokenErrr,
			Metadata: map[string]string{
				"function": "AuthenticateClientUser",
				"action":   "signing token",
			},
		})
	}

	return &AuthenticateClientUserResponse{
		ClientUser: *clientUser,
		Token:      token,
	}, nil
}

func (s *clientUserService) GetClientUser(
	ctx context.Context,
	clientUserId string,
) (*models.ClientUser, error) {
	clientUser, err := s.repo.GetByID(ctx, clientUserId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("ClientUserNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetClientUser",
				"action":   "fetching client user by ID",
			},
		})
	}

	return clientUser, nil
}

func (s *clientUserService) SendForgotPasswordResetLink(
	ctx context.Context,
	email string,
) (*models.ClientUser, error) {
	clientUser, clientUserErr := s.repo.GetByEmail(ctx, email)
	if clientUserErr != nil {
		if errors.Is(clientUserErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("ClientUserNotFound", &pkg.RentLoopErrorParams{
				Err: clientUserErr,
			})
		}

		return nil, pkg.InternalServerError(clientUserErr.Error(), &pkg.RentLoopErrorParams{
			Err: clientUserErr,
			Metadata: map[string]string{
				"function": "SendForgotPasswordResetLink",
				"action":   "fetching client user by email",
			},
		})
	}

	token, signTokenErrr := signjwt.SignJWT(jwt.MapClaims{
		"id":        clientUser.ID,
		"client_id": clientUser.ClientID,
	}, s.appCtx.Config.TokenSecrets.ClientUserSecret)

	if signTokenErrr != nil {
		return nil, pkg.InternalServerError(signTokenErrr.Error(), &pkg.RentLoopErrorParams{
			Err: signTokenErrr,
			Metadata: map[string]string{
				"function": "SendForgotPasswordResetLink",
				"action":   "signing token",
			},
		})
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

func (s *clientUserService) ResetPassword(
	ctx context.Context,
	input ResetClientUserPasswordInput,
) (*models.ClientUser, error) {
	clientUser, clientUserErr := s.repo.GetByID(ctx, input.ID)
	if clientUserErr != nil {
		if errors.Is(clientUserErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("ClientUserNotFound", &pkg.RentLoopErrorParams{
				Err: clientUserErr,
			})
		}

		return nil, pkg.InternalServerError(clientUserErr.Error(), &pkg.RentLoopErrorParams{
			Err: clientUserErr,
			Metadata: map[string]string{
				"function": "ResetPassword",
				"action":   "fetching client user by id",
			},
		})
	}

	hashed, err := hashpassword.HashPassword(input.NewPassword)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ResetPassword",
				"action":   "hashing new password",
			},
		})
	}

	clientUser.Password = hashed

	if err := s.repo.Update(ctx, clientUser); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ResetPassword",
				"action":   "updating client user",
			},
		})
	}

	return clientUser, nil
}

func (s *clientUserService) GetClientUserByQuery(
	ctx context.Context,
	query map[string]any,
) (*models.ClientUser, error) {
	clientUserOwner, clientUserErr := s.repo.GetByQuery(ctx, query)
	if clientUserErr != nil {
		return nil, pkg.InternalServerError(clientUserErr.Error(), &pkg.RentLoopErrorParams{
			Err: clientUserErr,
			Metadata: map[string]string{
				"function": "GetClientUserByQuery",
				"action":   "getting client user by query",
			},
		})
	}

	return clientUserOwner, nil
}

func (s *clientUserService) ListClientUsers(
	ctx context.Context,
	filterQuery repository.ListClientUsersFilter,
) ([]models.ClientUser, error) {
	clientUsers, listErr := s.repo.List(ctx, filterQuery)
	if listErr != nil {
		if !errors.Is(listErr, gorm.ErrRecordNotFound) {
			raven.CaptureError(listErr, map[string]string{
				"function": "ListClientUsers",
				"action":   "fetching client users",
			})
		}
		return nil, listErr
	}

	return *clientUsers, nil
}

func (s *clientUserService) CountClientUsers(
	ctx context.Context,
	filterQuery repository.ListClientUsersFilter,
) (int64, error) {
	clientUsersCount, countErr := s.repo.Count(ctx, filterQuery)
	if countErr != nil {
		if !errors.Is(countErr, gorm.ErrRecordNotFound) {
			raven.CaptureError(countErr, map[string]string{
				"function": "CountClientUsers",
				"action":   "fetching client users count",
			})
		}
		return 0, countErr
	}
	return clientUsersCount, nil
}
