package services

import (
	"context"
	"errors"
	"strings"

	"github.com/Bendomey/goutilities/pkg/hashpassword"
	"github.com/Bendomey/goutilities/pkg/signjwt"
	"github.com/Bendomey/goutilities/pkg/validatehash"
	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/lib/emailtemplates"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/dgrijalva/jwt-go"
	"gorm.io/gorm"
)

type UserService interface {
	InsertUser(ctx context.Context, user *models.User) (bool, error)
	GetUserByEmail(ctx context.Context, email string) (*models.User, error)
	LoginUser(ctx context.Context, input LoginUserInput) (*LoginUserResponse, error)
	GetMe(ctx context.Context, userID string) (*models.User, error)
	UpdateMe(ctx context.Context, input UpdateUserMeInput) (*models.User, error)
	UpdatePassword(ctx context.Context, input UpdateUserPasswordInput) (*models.User, error)
	SendForgotPasswordResetLink(ctx context.Context, email string) (*models.User, error)
	ResetPassword(ctx context.Context, input ResetUserPasswordInput) (*models.User, error)
}

type userService struct {
	appCtx pkg.AppContext
	repo   repository.UserRepository
}

func NewUserService(appCtx pkg.AppContext, repo repository.UserRepository) UserService {
	return &userService{appCtx, repo}
}

func (s *userService) InsertUser(ctx context.Context, user *models.User) (bool, error) {
	wasCreated, err := s.repo.Upsert(ctx, user)
	if err != nil {
		return false, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "InsertUser",
				"action":   "upserting user",
			},
		})
	}
	return wasCreated, nil
}

func (s *userService) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("UserNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetUserByEmail",
				"action":   "fetching user by email",
			},
		})
	}
	return user, nil
}

type LoginUserInput struct {
	Email    string
	Password string
}

type LoginUserResponse struct {
	User  models.User
	Token string
}

func (s *userService) LoginUser(ctx context.Context, input LoginUserInput) (*LoginUserResponse, error) {
	user, err := s.repo.GetByEmail(ctx, input.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("UserNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "LoginUser", "action": "fetching user by email"},
		})
	}

	isSame := validatehash.ValidateCipher(input.Password, user.Password)
	if !isSame {
		return nil, pkg.BadRequestError("PasswordIncorrect", nil)
	}

	// Preload client users + clients for the login response
	userWithClients, err := s.repo.GetByIDWithClientUsers(ctx, user.ID.String())
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "LoginUser", "action": "fetching user with clients"},
		})
	}

	token, err := signjwt.SignJWT(jwt.MapClaims{
		"id": user.ID,
	}, s.appCtx.Config.TokenSecrets.ClientUserSecret)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "LoginUser", "action": "signing token"},
		})
	}

	return &LoginUserResponse{User: *userWithClients, Token: token}, nil
}

func (s *userService) GetMe(ctx context.Context, userID string) (*models.User, error) {
	user, err := s.repo.GetByIDWithClientUsers(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("UserNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "GetMe", "action": "fetching user with clients"},
		})
	}
	return user, nil
}

type UpdateUserMeInput struct {
	UserID      string
	Name        lib.Optional[string]
	PhoneNumber lib.Optional[string]
	Email       lib.Optional[string]
}

func (s *userService) UpdateMe(ctx context.Context, input UpdateUserMeInput) (*models.User, error) {
	user, err := s.repo.GetByID(ctx, input.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("UserNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "UpdateMe", "action": "fetching user by ID"},
		})
	}

	if input.Name.IsSet && input.Name.Value != nil {
		user.Name = *input.Name.Value
	}
	if input.PhoneNumber.IsSet && input.PhoneNumber.Value != nil {
		user.PhoneNumber = *input.PhoneNumber.Value
	}
	if input.Email.IsSet && input.Email.Value != nil {
		newEmail := *input.Email.Value
		existing, emailErr := s.repo.GetByEmail(ctx, newEmail)
		if emailErr != nil && !errors.Is(emailErr, gorm.ErrRecordNotFound) {
			return nil, pkg.InternalServerError(emailErr.Error(), &pkg.RentLoopErrorParams{
				Err:      emailErr,
				Metadata: map[string]string{"function": "UpdateMe", "action": "checking email uniqueness"},
			})
		}
		if existing != nil && existing.ID != user.ID {
			return nil, errors.New("email already in use")
		}
		user.Email = newEmail
	}

	if err := s.repo.Update(ctx, user); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "UpdateMe", "action": "updating user"},
		})
	}
	return user, nil
}

type UpdateUserPasswordInput struct {
	UserID      string
	OldPassword string
	NewPassword string
}

func (s *userService) UpdatePassword(ctx context.Context, input UpdateUserPasswordInput) (*models.User, error) {
	user, err := s.repo.GetByID(ctx, input.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("UserNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "UpdatePassword", "action": "fetching user"},
		})
	}

	if !validatehash.ValidateCipher(input.OldPassword, user.Password) {
		return nil, pkg.BadRequestError("PasswordIncorrect", nil)
	}
	if validatehash.ValidateCipher(input.NewPassword, user.Password) {
		return nil, pkg.BadRequestError("PasswordRepeated", nil)
	}

	hashed, err := hashpassword.HashPassword(input.NewPassword)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "UpdatePassword", "action": "hashing password"},
		})
	}
	user.Password = hashed

	if err := s.repo.Update(ctx, user); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "UpdatePassword", "action": "saving user"},
		})
	}

	smsMessage := strings.NewReplacer("{{name}}", user.Name).Replace(lib.CLIENT_USER_PASSWORD_UPDATED_SMS_BODY)

	htmlBody, textBody, _ := s.appCtx.EmailEngine.Render(
		"client-user/password-updated",
		emailtemplates.ClientUserPasswordUpdatedData{Name: user.Name},
	)
	go pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
		Recipient: user.Email,
		Subject:   lib.CLIENT_USER_PASSWORD_UPDATED_SUBJECT,
		HtmlBody:  htmlBody,
		TextBody:  textBody,
	})
	go s.appCtx.Clients.GatekeeperAPI.SendSMS(context.Background(), gatekeeper.SendSMSInput{
		Recipient: user.PhoneNumber,
		Message:   smsMessage,
	})

	return user, nil
}

func (s *userService) SendForgotPasswordResetLink(ctx context.Context, email string) (*models.User, error) {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("UserNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "SendForgotPasswordResetLink", "action": "fetching user by email"},
		})
	}

	token, err := signjwt.SignJWT(jwt.MapClaims{
		"id": user.ID,
	}, s.appCtx.Config.TokenSecrets.ClientUserSecret)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "SendForgotPasswordResetLink", "action": "signing token"},
		})
	}

	htmlBody, textBody, _ := s.appCtx.EmailEngine.Render(
		"client-user/password-reset",
		emailtemplates.ClientUserPasswordResetData{Name: user.Name, ResetToken: token},
	)
	go pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
		Recipient: user.Email,
		Subject:   lib.CLIENT_USER_PASSWORD_RESET_SUBJECT,
		HtmlBody:  htmlBody,
		TextBody:  textBody,
	})

	return user, nil
}

type ResetUserPasswordInput struct {
	UserID      string
	NewPassword string
}

func (s *userService) ResetPassword(ctx context.Context, input ResetUserPasswordInput) (*models.User, error) {
	user, err := s.repo.GetByID(ctx, input.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("UserNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ResetPassword", "action": "fetching user"},
		})
	}

	hashed, err := hashpassword.HashPassword(input.NewPassword)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ResetPassword", "action": "hashing password"},
		})
	}
	user.Password = hashed

	if err := s.repo.Update(ctx, user); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ResetPassword", "action": "saving user"},
		})
	}
	return user, nil
}
