package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/getsentry/raven-go"
	gonanoid "github.com/matoous/go-nanoid"
	"gorm.io/gorm"
)

type ClientUserService interface {
	CreateClientUser(ctx context.Context, input CreateClientUserInput) (*models.ClientUser, error)
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
	ClientID string
	Name     string
	Email    string
	Phone    string
	Role     string
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
	}

	if err := s.repo.Create(ctx, &clientUser); err != nil {
		return nil, err
	}

	client, clientErr := s.clientRepo.GetByID(ctx, input.ClientID)
	if clientErr != nil {
		return nil, err
	}

	emailError := sendClientUserEmail(clientUserEmailInput{
		clientUserName: clientUser.Name,
		clientName:     client.Name,
		email:          clientUser.Email,
		password:       password,
		resendApiKey:   s.appCtx.Config.ResendAPIKey,
		env:            s.appCtx.Config.Env,
	})

	if emailError != nil {
		return nil, emailError
	}

	return &clientUser, nil
}

type clientUserEmailInput struct {
	clientUserName string
	clientName     string
	email          string
	password       string
	resendApiKey   string
	env            string
}

func sendClientUserEmail(emailData clientUserEmailInput) error {
	htmlTemplate := `
<div>
    <p>Hey <strong>%s</strong>, </p>
    <p>You have been invited to join <strong>%s</strong>. Login with the details below.</p>
    <div>
        <p>Credentials:</p>
        <p><strong>Email:</strong> %s</p>
        <p><strong>Password:</strong> %s</p>
    </div>
    <p>Note:</p>
    <p>Kindly change your password on your first login to properly secure your account.</p>
    <p>The <strong>rentloop<strong> Team</p>
</div>`

	finalHTML := fmt.Sprintf(
		htmlTemplate,
		emailData.clientUserName,
		emailData.clientName,
		emailData.email,
		emailData.password,
	)

	sendEmailErr := pkg.SendEmail(
		pkg.SendEmailInput{
			Recipient: emailData.email,
			Subject:   "Welcome To Rentloop",
			HtmlBody:  finalHTML,
			APIKey:    emailData.resendApiKey,
			Env:       emailData.env,
		},
	)

	if sendEmailErr != nil {
		return sendEmailErr
	}
	return nil
}
