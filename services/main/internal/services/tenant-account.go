package services

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/jackc/pgx/v5/pgconn"
)

type TenantAccountService interface {
	CreateTenantAccount(context context.Context, input CreateTenantAccountInput) (*models.TenantAccount, error)
}

type tenantAccountService struct {
	appCtx pkg.AppContext
	repo   repository.TenantAccountRepository
}

func NewTenantAccountService(appCtx pkg.AppContext, repo repository.TenantAccountRepository) TenantAccountService {
	return &tenantAccountService{appCtx: appCtx, repo: repo}
}

type CreateTenantAccountInput struct {
	TenantId          string
	PhoneNumber       string
	NotificationToken *string
}

func (s *tenantAccountService) CreateTenantAccount(
	ctx context.Context,
	input CreateTenantAccountInput,
) (*models.TenantAccount, error) {
	tenantAccount := models.TenantAccount{
		TenantId:          input.TenantId,
		PhoneNumber:       input.PhoneNumber,
		NotificationToken: input.NotificationToken,
	}

	err := s.repo.Create(ctx, &tenantAccount)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, pkg.ConflictError("TenantAccountPhoneNumberAlreadyInUse", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateTenantAccount",
				"action":   "creating tenant account",
			},
		})
	}

	return &tenantAccount, nil
}
