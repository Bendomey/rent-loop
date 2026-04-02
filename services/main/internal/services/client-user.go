package services

import (
	"context"
	"errors"
	"strings"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	gonanoid "github.com/matoous/go-nanoid"
	"gorm.io/gorm"
)

type ClientUserService interface {
	CreateClientUser(ctx context.Context, input CreateClientUserInput) (*models.ClientUser, error)
	GetClientUser(ctx context.Context, query repository.GetClientUserWithPopulateQuery) (*models.ClientUser, error)
	GetClientUserByQuery(context context.Context, query map[string]any) (*models.ClientUser, error)
	ListClientUsers(
		ctx context.Context,
		filterQuery repository.ListClientUsersFilter,
	) ([]models.ClientUser, error)
	CountClientUsers(
		ctx context.Context,
		filterQuery repository.ListClientUsersFilter,
	) (int64, error)
	GetClientUserWithPopulate(
		context context.Context,
		query repository.GetClientUserWithPopulateQuery,
	) (*models.ClientUser, error)
	ActivateClientUser(ctx context.Context, input ClientUserSearchInput) (*models.ClientUser, error)
	DeactivateClientUser(ctx context.Context, input DeactivateClientUserInput) (*models.ClientUser, error)
	InsertClientUser(ctx context.Context, clientUser *models.ClientUser) error
}

type clientUserService struct {
	appCtx     pkg.AppContext
	repo       repository.ClientUserRepository
	clientRepo repository.ClientRepository
	userRepo   repository.UserRepository
}

func NewClientUserService(
	appCtx pkg.AppContext,
	repo repository.ClientUserRepository,
	clientRepo repository.ClientRepository,
	userRepo repository.UserRepository,
) ClientUserService {
	return &clientUserService{appCtx, repo, clientRepo, userRepo}
}

func (s *clientUserService) InsertClientUser(ctx context.Context, clientUser *models.ClientUser) error {
	if err := s.repo.Create(ctx, clientUser); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "InsertClientUser",
				"action":   "inserting client user",
			},
		})
	}
	return nil
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
	// Find or create the User record
	user, userErr := s.userRepo.GetByEmail(ctx, input.Email)
	if userErr != nil && !errors.Is(userErr, gorm.ErrRecordNotFound) {
		return nil, pkg.InternalServerError(userErr.Error(), &pkg.RentLoopErrorParams{
			Err: userErr,
			Metadata: map[string]string{
				"function": "CreateClientUser",
				"action":   "checking existing user by email",
			},
		})
	}

	var plainPassword string

	if user == nil {
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
		plainPassword = password

		newUser := models.User{
			Name:        input.Name,
			Email:       input.Email,
			PhoneNumber: input.Phone,
			Password:    password,
		}
		if err := s.userRepo.Create(ctx, &newUser); err != nil {
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "CreateClientUser",
					"action":   "creating user",
				},
			})
		}
		user = &newUser
	}

	// Check if this user is already a member of this client
	existing, existingErr := s.repo.GetByQuery(ctx, map[string]any{
		"user_id":   user.ID.String(),
		"client_id": input.ClientID,
	})
	if existingErr != nil && !errors.Is(existingErr, gorm.ErrRecordNotFound) {
		return nil, pkg.InternalServerError(existingErr.Error(), &pkg.RentLoopErrorParams{
			Err: existingErr,
			Metadata: map[string]string{
				"function": "CreateClientUser",
				"action":   "checking existing client user membership",
			},
		})
	}
	if existing != nil {
		return nil, pkg.BadRequestError("UserAlreadyMemberOfClient", nil)
	}

	clientUser := models.ClientUser{
		UserID:      user.ID.String(),
		ClientID:    input.ClientID,
		Role:        input.Role,
		CreatedByID: &input.CreatedByID,
	}

	if err := s.InsertClientUser(ctx, &clientUser); err != nil {
		return nil, err
	}

	// Only send "added with credentials" notification for newly-created users
	if plainPassword != "" {
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
			"{{password}}", plainPassword,
		)
		message := r.Replace(lib.CLIENT_USER_ADDED_BODY)
		smsMessage := r.Replace(lib.CLIENT_USER_ADDED_SMS_BODY)

		go pkg.SendEmail(
			s.appCtx.Config,
			pkg.SendEmailInput{
				Recipient: input.Email,
				Subject:   lib.CLIENT_USER_ADDED_SUBJECT,
				TextBody:  message,
			},
		)

		go s.appCtx.Clients.GatekeeperAPI.SendSMS(
			context.Background(),
			gatekeeper.SendSMSInput{
				Recipient: input.Phone,
				Message:   smsMessage,
			},
		)
	}

	return &clientUser, nil
}

func (s *clientUserService) GetClientUser(
	ctx context.Context,
	query repository.GetClientUserWithPopulateQuery,
) (*models.ClientUser, error) {
	clientUser, err := s.repo.GetByIDWithPopulate(ctx, query)
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

	if clientUser.Status == "ClientUser.Status.Inactive" {
		return nil, pkg.ForbiddenError("ClientUserInactive", nil)
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
		return nil, pkg.InternalServerError(listErr.Error(), &pkg.RentLoopErrorParams{
			Err: listErr,
			Metadata: map[string]string{
				"function": "ListClientUsers",
				"action":   "listing client users",
			},
		})
	}

	return *clientUsers, nil
}

func (s *clientUserService) CountClientUsers(
	ctx context.Context,
	filterQuery repository.ListClientUsersFilter,
) (int64, error) {
	clientUsersCount, countErr := s.repo.Count(ctx, filterQuery)
	if countErr != nil {
		return 0, pkg.InternalServerError(countErr.Error(), &pkg.RentLoopErrorParams{
			Err: countErr,
			Metadata: map[string]string{
				"function": "CountClientUsers",
				"action":   "counting client users",
			},
		})
	}

	return clientUsersCount, nil
}

func (s *clientUserService) GetClientUserWithPopulate(
	ctx context.Context,
	query repository.GetClientUserWithPopulateQuery,
) (*models.ClientUser, error) {
	clientUser, err := s.repo.GetByIDWithPopulate(ctx, query)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("ClientUserNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetClientUserWithPopulate",
				"action":   "fetching client user by ID with populate query",
			},
		})
	}

	return clientUser, nil
}

type ClientUserSearchInput struct {
	ClientUserID      string
	StatusUpdatedById *string
}

func (s *clientUserService) ActivateClientUser(
	ctx context.Context,
	input ClientUserSearchInput,
) (*models.ClientUser, error) {
	clientUserToBeActivated, getClientUserErr := s.repo.GetByQuery(
		ctx,
		map[string]any{"id": input.ClientUserID, "status": "ClientUser.Status.Inactive"},
	)
	if getClientUserErr != nil {
		if errors.Is(getClientUserErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("ClientUserNotFound", &pkg.RentLoopErrorParams{
				Err: getClientUserErr,
			})
		}

		return nil, pkg.InternalServerError(getClientUserErr.Error(), &pkg.RentLoopErrorParams{
			Err: getClientUserErr,
			Metadata: map[string]string{
				"function": "ActivateClientUser",
				"action":   "fetching deactivated client user by ID",
			},
		})
	}

	clientUserToBeActivated.Status = "ClientUser.Status.Active"
	clientUserToBeActivated.StatusUpdatedById = input.StatusUpdatedById

	updateClientUserErr := s.repo.Update(ctx, clientUserToBeActivated)
	if updateClientUserErr != nil {
		return nil, pkg.InternalServerError(updateClientUserErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateClientUserErr,
			Metadata: map[string]string{
				"function": "ActivateClientUser",
				"action":   "updating client user status",
			},
		})
	}

	user, userErr := s.userRepo.GetByID(ctx, clientUserToBeActivated.UserID)
	if userErr != nil {
		return nil, pkg.InternalServerError(userErr.Error(), &pkg.RentLoopErrorParams{
			Err: userErr,
			Metadata: map[string]string{
				"function": "ActivateClientUser",
				"action":   "fetching user for notification",
			},
		})
	}

	r := strings.NewReplacer("{{name}}", user.Name)
	message := r.Replace(lib.CLIENT_USER_ACTIVATED_BODY)
	smsMessage := r.Replace(lib.CLIENT_USER_ACTIVATED_SMS_BODY)

	go pkg.SendEmail(
		s.appCtx.Config,
		pkg.SendEmailInput{
			Recipient: user.Email,
			Subject:   lib.CLIENT_USER_ACTIVATED_SUBJECT,
			TextBody:  message,
		},
	)

	go s.appCtx.Clients.GatekeeperAPI.SendSMS(
		context.Background(),
		gatekeeper.SendSMSInput{
			Recipient: user.PhoneNumber,
			Message:   smsMessage,
		},
	)

	return clientUserToBeActivated, nil
}

type DeactivateClientUserInput struct {
	ClientUserID      string
	StatusUpdatedById *string
	Reason            string
}

func (s *clientUserService) DeactivateClientUser(
	ctx context.Context,
	input DeactivateClientUserInput,
) (*models.ClientUser, error) {
	clientUserToBeDeactivated, getClientUserErr := s.repo.GetByQuery(
		ctx,
		map[string]any{"id": input.ClientUserID, "status": "ClientUser.Status.Active"},
	)
	if getClientUserErr != nil {
		if errors.Is(getClientUserErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("ClientUserNotFound", &pkg.RentLoopErrorParams{
				Err: getClientUserErr,
			})
		}

		return nil, pkg.InternalServerError(getClientUserErr.Error(), &pkg.RentLoopErrorParams{
			Err: getClientUserErr,
			Metadata: map[string]string{
				"function": "DeactivateClientUser",
				"action":   "fetching activated client user by ID",
			},
		})
	}

	clientUserToBeDeactivated.Status = "ClientUser.Status.Inactive"
	clientUserToBeDeactivated.StatusUpdatedById = input.StatusUpdatedById

	updateClientUserErr := s.repo.Update(ctx, clientUserToBeDeactivated)
	if updateClientUserErr != nil {
		return nil, pkg.InternalServerError(updateClientUserErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateClientUserErr,
			Metadata: map[string]string{
				"function": "DeactivateClientUser",
				"action":   "updating client user status",
			},
		})
	}

	user, userErr := s.userRepo.GetByID(ctx, clientUserToBeDeactivated.UserID)
	if userErr != nil {
		return nil, pkg.InternalServerError(userErr.Error(), &pkg.RentLoopErrorParams{
			Err: userErr,
			Metadata: map[string]string{
				"function": "DeactivateClientUser",
				"action":   "fetching user for notification",
			},
		})
	}

	r := strings.NewReplacer(
		"{{name}}", user.Name,
		"{{reason}}", input.Reason,
	)
	message := r.Replace(lib.CLIENT_USER_DEACTIVATED_BODY)
	smsMessage := r.Replace(lib.CLIENT_USER_DEACTIVATED_SMS_BODY)

	go pkg.SendEmail(
		s.appCtx.Config,
		pkg.SendEmailInput{
			Recipient: user.Email,
			Subject:   lib.CLIENT_USER_DEACTIVATED_SUBJECT,
			TextBody:  message,
		},
	)

	go s.appCtx.Clients.GatekeeperAPI.SendSMS(
		context.Background(),
		gatekeeper.SendSMSInput{
			Recipient: user.PhoneNumber,
			Message:   smsMessage,
		},
	)

	return clientUserToBeDeactivated, nil
}
