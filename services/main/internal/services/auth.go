package services

import (
	"context"
	"errors"
	"net/http"
	"slices"
	"time"

	"github.com/Bendomey/goutilities/pkg/signjwt"
	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/dgrijalva/jwt-go"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type AuthService interface {
	SendCode(context context.Context, input SendCodeInput) error
	VerifyCode(context context.Context, input VerifyCodeInput) error
	SendTenantCode(ctx context.Context, phone string) error
	VerifyTenantCode(ctx context.Context, input VerifyTenantCodeInput) (*VerifyTenantCodeResponse, error)
}

type authService struct {
	appCtx            pkg.AppContext
	gatekeeperClient  gatekeeper.Client
	tenantAccountRepo repository.TenantAccountRepository
}

func NewAuthService(appCtx pkg.AppContext, tenantAccountRepo repository.TenantAccountRepository) AuthService {
	return &authService{
		appCtx:            appCtx,
		gatekeeperClient:  appCtx.Clients.GatekeeperAPI,
		tenantAccountRepo: tenantAccountRepo,
	}
}

// --- Generic OTP (existing behaviour, unchanged) ---

type SendCodeInput struct {
	Channel []string
	Email   *string
	Phone   *string
}

func (s *authService) SendCode(ctx context.Context, input SendCodeInput) error {
	if input.Email == nil && input.Phone == nil {
		return pkg.BadRequestError("EmailOrPhoneRequired", nil)
	}

	if slices.Contains(input.Channel, "EMAIL") && input.Email == nil {
		return pkg.BadRequestError("EmailRequired", nil)
	}

	if slices.Contains(input.Channel, "SMS") && input.Phone == nil {
		return pkg.BadRequestError("PhoneRequired", nil)
	}

	req := gatekeeper.GenerateOtpInput{
		PhoneNumber: input.Phone,
		Email:       input.Email,
		Size:        6,
	}
	response, err := s.gatekeeperClient.GenerateOtp(ctx, req)
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "SendCode",
				"action":   "generating code",
			},
		})
	}

	pipe := s.appCtx.RDB.TxPipeline()

	if slices.Contains(input.Channel, "EMAIL") && input.Email != nil {
		pipe.Set(ctx, *input.Email, response.Reference, 10*time.Minute)
	}

	if slices.Contains(input.Channel, "SMS") && input.Phone != nil {
		pipe.Set(ctx, *input.Phone, response.Reference, 10*time.Minute)
	}

	_, setErr := pipe.Exec(ctx)
	if setErr != nil {
		return pkg.InternalServerError(setErr.Error(), &pkg.RentLoopErrorParams{
			Err: setErr,
			Metadata: map[string]string{
				"function": "SendCode",
				"action":   "setting reference in redis",
			},
		})
	}

	return nil
}

type VerifyCodeInput struct {
	Code  string
	Email *string
	Phone *string
}

func (s *authService) VerifyCode(ctx context.Context, input VerifyCodeInput) error {
	if input.Email == nil && input.Phone == nil {
		return pkg.BadRequestError("EmailOrPhoneRequired", nil)
	}

	identifier := ""
	if input.Email != nil {
		identifier = *input.Email
	} else {
		identifier = *input.Phone
	}

	reference, getErr := s.appCtx.RDB.Get(ctx, identifier).Result()
	if getErr != nil {
		if errors.Is(getErr, redis.Nil) {
			return pkg.BadRequestError("CodeIncorrect", nil)
		}
		return pkg.InternalServerError(getErr.Error(), &pkg.RentLoopErrorParams{
			Err: getErr,
			Metadata: map[string]string{
				"function": "VerifyCode",
				"action":   "getting code",
			},
		})
	}

	response, err := s.gatekeeperClient.VerifyOtp(ctx, gatekeeper.VerifyOtpRequest{
		Reference: reference,
		Otp:       input.Code,
	})
	if err != nil {
		var gatekeeperErr *gatekeeper.GatekeeperAPIError
		if errors.As(err, &gatekeeperErr) && gatekeeperErr.StatusCode == http.StatusBadRequest {
			return pkg.BadRequestError("CodeIncorrect", nil)
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "VerifyCode",
				"action":   "verifying code",
			},
		})
	}

	if !response.Verified {
		return pkg.BadRequestError("CodeIncorrect", nil)
	}

	_, delErr := s.appCtx.RDB.Del(ctx, identifier).Result()
	if delErr != nil {
		return pkg.InternalServerError(delErr.Error(), &pkg.RentLoopErrorParams{
			Err: delErr,
			Metadata: map[string]string{
				"function": "VerifyCode",
				"action":   "deleting code",
			},
		})
	}

	return nil
}

// --- Tenant mobile auth (phone/OTP → JWT) ---

func (s *authService) SendTenantCode(ctx context.Context, phone string) error {
	_, findErr := s.tenantAccountRepo.FindOne(ctx, map[string]any{
		"phone_number": phone,
	})
	if findErr != nil {
		if errors.Is(findErr, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("TenantNotFound", nil)
		}
		return pkg.InternalServerError(findErr.Error(), &pkg.RentLoopErrorParams{
			Err: findErr,
			Metadata: map[string]string{
				"function": "SendTenantCode",
				"action":   "fetching tenant account",
			},
		})
	}

	response, err := s.gatekeeperClient.GenerateOtp(ctx, gatekeeper.GenerateOtpInput{
		PhoneNumber: &phone,
		Size:        6,
	})
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "SendTenantCode",
				"action":   "generating code",
			},
		})
	}

	setErr := s.appCtx.RDB.Set(ctx, "tenant:"+phone, response.Reference, 10*time.Minute).Err()
	if setErr != nil {
		return pkg.InternalServerError(setErr.Error(), &pkg.RentLoopErrorParams{
			Err: setErr,
			Metadata: map[string]string{
				"function": "SendTenantCode",
				"action":   "setting reference in redis",
			},
		})
	}

	return nil
}

type VerifyTenantCodeInput struct {
	Code  string
	Phone string
}

type VerifyTenantCodeResponse struct {
	Token         string
	TenantAccount *models.TenantAccount
}

func (s *authService) VerifyTenantCode(
	ctx context.Context,
	input VerifyTenantCodeInput,
) (*VerifyTenantCodeResponse, error) {
	reference, getErr := s.appCtx.RDB.Get(ctx, "tenant:"+input.Phone).Result()
	if getErr != nil {
		if errors.Is(getErr, redis.Nil) {
			return nil, pkg.BadRequestError("CodeIncorrect", nil)
		}
		return nil, pkg.InternalServerError(getErr.Error(), &pkg.RentLoopErrorParams{
			Err: getErr,
			Metadata: map[string]string{
				"function": "VerifyTenantCode",
				"action":   "getting code",
			},
		})
	}

	response, err := s.gatekeeperClient.VerifyOtp(ctx, gatekeeper.VerifyOtpRequest{
		Reference: reference,
		Otp:       input.Code,
	})
	if err != nil {
		var gatekeeperErr *gatekeeper.GatekeeperAPIError
		if errors.As(err, &gatekeeperErr) && gatekeeperErr.StatusCode == http.StatusBadRequest {
			return nil, pkg.BadRequestError("CodeIncorrect", nil)
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "VerifyTenantCode",
				"action":   "verifying code",
			},
		})
	}

	if !response.Verified {
		return nil, pkg.BadRequestError("CodeIncorrect", nil)
	}

	_, delErr := s.appCtx.RDB.Del(ctx, "tenant:"+input.Phone).Result()
	if delErr != nil {
		return nil, pkg.InternalServerError(delErr.Error(), &pkg.RentLoopErrorParams{
			Err: delErr,
			Metadata: map[string]string{
				"function": "VerifyTenantCode",
				"action":   "deleting code",
			},
		})
	}

	tenantAccount, findErr := s.tenantAccountRepo.FindOne(ctx, map[string]any{
		"phone_number": input.Phone,
	})
	if findErr != nil {
		return nil, pkg.InternalServerError(findErr.Error(), &pkg.RentLoopErrorParams{
			Err: findErr,
			Metadata: map[string]string{
				"function": "VerifyTenantCode",
				"action":   "fetching tenant account",
			},
		})
	}

	token, signErr := signjwt.SignJWT(jwt.MapClaims{
		"id": tenantAccount.ID,
	}, s.appCtx.Config.TokenSecrets.TenantUserSecret)
	if signErr != nil {
		return nil, pkg.InternalServerError(signErr.Error(), &pkg.RentLoopErrorParams{
			Err: signErr,
			Metadata: map[string]string{
				"function": "VerifyTenantCode",
				"action":   "signing token",
			},
		})
	}

	return &VerifyTenantCodeResponse{Token: token, TenantAccount: tenantAccount}, nil
}
