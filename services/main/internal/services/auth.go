package services

import (
	"context"
	"errors"
	"slices"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/redis/go-redis/v9"
)

type AuthService interface {
	SendCode(context context.Context, input SendCodeInput) error
	VerifyCode(context context.Context, input VerifyCodeInput) error
}

type authService struct {
	appCtx           pkg.AppContext
	gatekeeperClient gatekeeper.Client
}

func NewAuthService(appCtx pkg.AppContext, gatekeeperClient gatekeeper.Client) AuthService {
	return &authService{appCtx: appCtx, gatekeeperClient: gatekeeperClient}
}

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
