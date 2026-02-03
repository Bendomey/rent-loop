package services

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type PaymentAccountService interface {
	CreatePaymentAccount(context context.Context, input CreatePaymentAccountInput) (*models.PaymentAccount, error)
	ListPaymentAccounts(
		context context.Context,
		filterQuery repository.ListPaymentAccountsFilter,
	) ([]models.PaymentAccount, error)
	CountPaymentAccounts(
		context context.Context,
		filterQuery repository.ListPaymentAccountsFilter,
	) (int64, error)
	GetPaymentAccount(
		context context.Context,
		query repository.GetPaymentAccountQuery,
	) (*models.PaymentAccount, error)
	UpdatePaymentAccount(context context.Context, input UpdatePaymentAccountInput) (*models.PaymentAccount, error)
	DeletePaymentAccount(context context.Context, input DeletePaymentAccountInput) error
}

type paymentAccountService struct {
	appCtx pkg.AppContext
	repo   repository.PaymentAccountRepository
}

func NewPaymentAccountService(appCtx pkg.AppContext, repo repository.PaymentAccountRepository) PaymentAccountService {
	return &paymentAccountService{
		appCtx: appCtx,
		repo:   repo,
	}
}

type CreatePaymentAccountInput struct {
	OwnerType  string
	ClientID   string
	Rail       string
	Provider   *string
	Identifier *string
	Metadata   *map[string]any
	IsDefault  bool
	Status     string
}

func (s *paymentAccountService) CreatePaymentAccount(
	ctx context.Context,
	input CreatePaymentAccountInput,
) (*models.PaymentAccount, error) {
	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	var metadata *datatypes.JSON
	if input.Metadata != nil {
		jsonData, err := lib.InterfaceToJSON(*input.Metadata)
		if err != nil {
			return nil, pkg.BadRequestError("InvalidMetadata", &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "CreatePaymentAccount",
					"action":   "converting metadata to JSON",
				},
			})
		}
		metadata = jsonData
	}

	paymentAccount := models.PaymentAccount{
		OwnerType:  input.OwnerType,
		ClientID:   &input.ClientID,
		Rail:       input.Rail,
		Provider:   input.Provider,
		Identifier: input.Identifier,
		Metadata:   metadata,
		IsDefault:  input.IsDefault,
		Status:     input.Status,
	}

	// If the new account is set as default, wrap in transaction to ensure atomicity
	if input.IsDefault {
		if err := s.repo.UnsetDefaultForClient(transCtx, input.ClientID, nil); err != nil {
			transaction.Rollback()
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "CreatePaymentAccount",
					"action":   "unsetting default for other payment accounts",
				},
			})
		}
	}

	if err := s.repo.Create(transCtx, &paymentAccount); err != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreatePaymentAccount",
				"action":   "creating new payment account",
			},
		})
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"function": "CreatePaymentAccount",
				"action":   "committing transaction",
			},
		})
	}

	return &paymentAccount, nil
}

func (s *paymentAccountService) ListPaymentAccounts(
	ctx context.Context,
	filterQuery repository.ListPaymentAccountsFilter,
) ([]models.PaymentAccount, error) {
	paymentAccounts, err := s.repo.List(ctx, filterQuery)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListPaymentAccounts",
				"action":   "listing payment accounts",
			},
		})
	}

	return *paymentAccounts, nil
}

func (s *paymentAccountService) CountPaymentAccounts(
	ctx context.Context,
	filterQuery repository.ListPaymentAccountsFilter,
) (int64, error) {
	count, err := s.repo.Count(ctx, filterQuery)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountPaymentAccounts",
				"action":   "counting payment accounts",
			},
		})
	}

	return count, nil
}

func (s *paymentAccountService) GetPaymentAccount(
	ctx context.Context,
	query repository.GetPaymentAccountQuery,
) (*models.PaymentAccount, error) {
	paymentAccount, err := s.repo.GetByID(ctx, query)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("PaymentAccountNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetPaymentAccount",
				"action":   "fetching payment account by ID",
			},
		})
	}

	return paymentAccount, nil
}

type UpdatePaymentAccountInput struct {
	PaymentAccountID string
	ClientID         string
	Provider         *string
	Identifier       *string
	Metadata         *map[string]any
	IsDefault        *bool
	Status           *string
}

func (s *paymentAccountService) UpdatePaymentAccount(
	ctx context.Context,
	input UpdatePaymentAccountInput,
) (*models.PaymentAccount, error) {
	paymentAccount, err := s.repo.GetByQuery(
		ctx,
		map[string]any{"id": input.PaymentAccountID, "client_id": input.ClientID},
	)
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "UpdatePaymentAccount",
					"action":   "get payment account by id",
				},
			})
		}

		return nil, pkg.NotFoundError("PaymentAccountNotFound", &pkg.RentLoopErrorParams{
			Err: err,
		})
	}

	var metadata *datatypes.JSON
	if input.Metadata != nil {
		jsonData, err := lib.InterfaceToJSON(*input.Metadata)
		if err != nil {
			return nil, pkg.BadRequestError("InvalidMetadata", &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "UpdatePaymentAccount",
					"action":   "converting metadata to JSON",
				},
			})
		}
		metadata = jsonData
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	paymentAccount.Provider = input.Provider
	paymentAccount.Identifier = input.Identifier
	paymentAccount.Metadata = metadata

	if input.Status != nil {
		paymentAccount.Status = *input.Status
	}

	// If setting this account as default, wrap in transaction to ensure atomicity
	if input.IsDefault != nil && *input.IsDefault {
		if err := s.repo.UnsetDefaultForClient(transCtx, input.ClientID, &input.PaymentAccountID); err != nil {
			transaction.Rollback()
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "UpdatePaymentAccount",
					"action":   "unsetting default for other payment accounts",
				},
			})
		}

		paymentAccount.IsDefault = *input.IsDefault
	}

	if updateErr := s.repo.Update(transCtx, paymentAccount); updateErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateErr,
			Metadata: map[string]string{
				"function": "UpdatePaymentAccount",
				"action":   "updating payment account details",
			},
		})
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"function": "UpdatePaymentAccount",
				"action":   "committing transaction",
			},
		})
	}

	return paymentAccount, nil
}

type DeletePaymentAccountInput struct {
	PaymentAccountID string
	ClientID         string
}

func (s *paymentAccountService) DeletePaymentAccount(ctx context.Context, input DeletePaymentAccountInput) error {
	_, err := s.repo.GetByQuery(
		ctx,
		map[string]any{"id": input.PaymentAccountID, "client_id": input.ClientID},
	)
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "DeletePaymentAccount",
					"action":   "fetching payment account by ID",
				},
			})
		}

		return pkg.NotFoundError("PaymentAccountNotFound", &pkg.RentLoopErrorParams{
			Err: err,
		})
	}

	deleteErr := s.repo.Delete(ctx, input.PaymentAccountID)
	if deleteErr != nil {
		return pkg.InternalServerError(deleteErr.Error(), &pkg.RentLoopErrorParams{
			Err: deleteErr,
			Metadata: map[string]string{
				"function": "DeletePaymentAccount",
				"action":   "deleting payment account",
			},
		})
	}

	return nil
}
