package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/Bendomey/goutilities/pkg/hashpassword"
	"github.com/Bendomey/goutilities/pkg/validatehash"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	gonanoid "github.com/matoous/go-nanoid"
	"github.com/redis/go-redis/v9"
)

type AuthService interface {
	SendCode(context context.Context, input SendCodeInput) error
	VerifyCode(context context.Context, input VerifyCodeInput) error
}

type authService struct {
	appCtx pkg.AppContext
}

func NewAuthService(appCtx pkg.AppContext) AuthService {
	return &authService{appCtx: appCtx}
}

type SendCodeInput struct {
	Channel string
	Email   *string
	Phone   *string
}

func (s *authService) SendCode(ctx context.Context, input SendCodeInput) error {
	identifier := ""
	if input.Channel == "email" {
		identifier = *input.Email
	} else {
		identifier = *input.Phone
	}

	code, err := gonanoid.Generate("1234567890", 6)
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "SendCode",
				"action":   "generating code",
			},
		})
	}

	hash, hashErr := hashpassword.HashPassword(code)
	if hashErr != nil {
		return pkg.InternalServerError(hashErr.Error(), &pkg.RentLoopErrorParams{
			Err: hashErr,
			Metadata: map[string]string{
				"function": "SendCode",
				"action":   "hashing code",
			},
		})
	}

	setErr := s.appCtx.RDB.Set(ctx, identifier, hash, 1*time.Hour).Err()
	if setErr != nil {
		return pkg.InternalServerError(setErr.Error(), &pkg.RentLoopErrorParams{
			Err: setErr,
			Metadata: map[string]string{
				"function": "SendCode",
				"action":   "setting code",
			},
		})
	}

	message := strings.NewReplacer(
		"{{verification_code}}", code,
		"{{expiry_duration}}", "1 hour",
	).Replace(lib.AUTH_VERIFICATION_CODE_BODY)

	if input.Channel == "email" {
		go pkg.SendEmail(
			s.appCtx,
			pkg.SendEmailInput{
				Recipient: *input.Email,
				Subject:   lib.AUTH_VERIFICATION_CODE_SUBJECT,
				TextBody:  message,
			},
		)
	} else {
		go pkg.SendSMS(
			s.appCtx,
			pkg.SendSMSInput{
				Recipient: *input.Phone,
				Message:   message,
			},
		)
	}

	return nil
}

type VerifyCodeInput struct {
	Code  string
	Email *string
	Phone *string
}

func (s *authService) VerifyCode(ctx context.Context, input VerifyCodeInput) error {
	identifier := ""
	if input.Email != nil {
		identifier = *input.Email
	} else {
		identifier = *input.Phone
	}

	hash, getErr := s.appCtx.RDB.Get(ctx, identifier).Result()
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

	isSame := validatehash.ValidateCipher(input.Code, hash)
	if !isSame {
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
