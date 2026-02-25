package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"gorm.io/gorm"
)

type SigningService interface {
	GenerateToken(ctx context.Context, input GenerateTokenInput) (*models.SigningToken, error)
	VerifyToken(ctx context.Context, tokenStr string, populate *[]string) (*models.SigningToken, error)
	SignDocument(ctx context.Context, input SignDocumentInput) (*models.DocumentSignature, error)
	SignDocumentByPM(ctx context.Context, input SignDocumentPMInput) (*models.DocumentSignature, error)
	UpdateSigningTokenDetails(
		ctx context.Context,
		tokenID string,
		input UpdateSigningTokenDetailsInput,
	) (*models.SigningToken, error)
	ResendSigningToken(ctx context.Context, tokenID string) (*models.SigningToken, error)
	ListSigningTokens(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListSigningTokensFilter,
	) (*[]models.SigningToken, error)
	CountSigningTokens(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListSigningTokensFilter,
	) (int64, error)
	ListDocumentSignatures(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListDocumentSignaturesFilter,
	) (*[]models.DocumentSignature, error)
	CountDocumentSignatures(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListDocumentSignaturesFilter,
	) (int64, error)
}

type signingService struct {
	appCtx pkg.AppContext
	repo   repository.SigningRepository
}

func NewSigningService(
	appCtx pkg.AppContext,
	repo repository.SigningRepository,
) SigningService {
	return &signingService{appCtx: appCtx, repo: repo}
}

type GenerateTokenInput struct {
	DocumentID          string
	TenantApplicationID *string
	LeaseID             *string
	Role                string
	SignerName          *string
	SignerEmail         *string
	SignerPhone         *string
	CreatedByID         string
}

func (s *signingService) GenerateToken(
	ctx context.Context,
	input GenerateTokenInput,
) (*models.SigningToken, error) {
	token := &models.SigningToken{
		DocumentID:          input.DocumentID,
		TenantApplicationID: input.TenantApplicationID,
		LeaseID:             input.LeaseID,
		Role:                input.Role,
		SignerName:          input.SignerName,
		SignerEmail:         input.SignerEmail,
		SignerPhone:         input.SignerPhone,
		CreatedByID:         input.CreatedByID,
		ExpiresAt:           time.Now().Add(7 * 24 * time.Hour),
	}

	if err := s.repo.CreateSigningToken(ctx, token); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GenerateToken",
				"action":   "creating signing token",
			},
		})
	}

	s.sendSigningTokenNotification(ctx, token, false)

	return token, nil
}

func (s *signingService) VerifyToken(
	ctx context.Context,
	tokenStr string,
	populate *[]string,
) (*models.SigningToken, error) {
	token, err := s.repo.GetSigningTokenByToken(ctx, tokenStr, populate)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("SigningTokenNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "VerifyToken",
				"action":   "fetching signing token",
			},
		})
	}

	if !token.IsValid() {
		if token.IsUsed() {
			return nil, pkg.BadRequestError("SigningTokenAlreadyUsed", nil)
		}
		return nil, pkg.BadRequestError("SigningTokenExpired", nil)
	}

	// update last accessed at — non-fatal if it fails
	now := time.Now()
	token.LastAccessedAt = &now
	updateErr := s.repo.UpdateSigningToken(ctx, token)
	if updateErr != nil {
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateErr,
			Metadata: map[string]string{
				"function": "VerifyToken",
				"action":   "updating last accessed at",
			},
		})
	}

	return token, nil
}

type SignDocumentInput struct {
	TokenStr     string
	SignatureUrl string
	SignerName   *string
	IPAddress    string
}

func (s *signingService) SignDocument(
	ctx context.Context,
	input SignDocumentInput,
) (*models.DocumentSignature, error) {
	token, err := s.repo.GetSigningTokenByToken(ctx, input.TokenStr, nil)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("SigningTokenNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "SignDocument",
				"action":   "fetching signing token",
			},
		})
	}

	if !token.IsValid() {
		if token.IsUsed() {
			return nil, pkg.BadRequestError("SigningTokenAlreadyUsed", nil)
		}
		return nil, pkg.BadRequestError("SigningTokenExpired", nil)
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	sig := &models.DocumentSignature{
		DocumentID:          token.DocumentID,
		TenantApplicationID: token.TenantApplicationID,
		LeaseID:             token.LeaseID,
		Role:                token.Role,
		SignatureUrl:        input.SignatureUrl,
		SignedByName:        input.SignerName,
		IPAddress:           input.IPAddress,
	}

	if createErr := s.repo.CreateDocumentSignature(transCtx, sig); createErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err: createErr,
			Metadata: map[string]string{
				"function": "SignDocument",
				"action":   "creating document signature",
			},
		})
	}

	now := time.Now()
	token.SignedAt = &now
	sigID := sig.ID.String()
	token.DocumentSignatureID = &sigID

	if updateErr := s.repo.UpdateSigningToken(transCtx, token); updateErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateErr,
			Metadata: map[string]string{
				"function": "SignDocument",
				"action":   "updating signing token after signing",
			},
		})
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"function": "SignDocument",
				"action":   "committing transaction",
			},
		})
	}

	return sig, nil
}

type SignDocumentPMInput struct {
	DocumentID          string
	SignatureUrl        string
	TenantApplicationID *string
	LeaseID             *string
	SignedByID          string
}

func (s *signingService) SignDocumentByPM(
	ctx context.Context,
	input SignDocumentPMInput,
) (*models.DocumentSignature, error) {
	// check and make sure PM has not signed yet
	existingSig, err := s.repo.GetDocumentSignatureByQuery(ctx, map[string]any{
		"document_id":           input.DocumentID,
		"role":                  "PROPERTY_MANAGER",
		"tenant_application_id": input.TenantApplicationID,
		"lease_id":              input.LeaseID,
	})
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "SignDocumentByPM",
					"action":   "checking for existing PM signature",
				},
			})
		}
	}

	if existingSig != nil {
		return nil, pkg.BadRequestError("PMSignatureAlreadyExists", nil)
	}

	sig := &models.DocumentSignature{
		DocumentID:          input.DocumentID,
		TenantApplicationID: input.TenantApplicationID,
		LeaseID:             input.LeaseID,
		Role:                "PROPERTY_MANAGER",
		SignatureUrl:        input.SignatureUrl,
		SignedByID:          &input.SignedByID,
	}

	if createErr := s.repo.CreateDocumentSignature(ctx, sig); createErr != nil {
		return nil, pkg.InternalServerError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err: createErr,
			Metadata: map[string]string{
				"function": "SignDocumentByPM",
				"action":   "creating document signature",
			},
		})
	}

	return sig, nil
}

type UpdateSigningTokenDetailsInput struct {
	SignerName  lib.Optional[string]
	SignerEmail lib.Optional[string]
	SignerPhone lib.Optional[string]
}

func (s *signingService) sendSigningTokenNotification(
	ctx context.Context,
	token *models.SigningToken,
	isResend bool,
) {
	signerName := "there"
	if token.SignerName != nil {
		signerName = *token.SignerName
	}

	expiresAt := token.ExpiresAt.Format("January 2, 2006 at 15:04 UTC")

	subject := lib.SIGNING_TOKEN_INVITE_SUBJECT
	body := lib.SIGNING_TOKEN_INVITE_BODY
	if isResend {
		subject = lib.SIGNING_TOKEN_RESENT_SUBJECT
		body = lib.SIGNING_TOKEN_RESENT_BODY
	}

	message := strings.ReplaceAll(body, "{{signer_name}}", signerName)
	message = strings.ReplaceAll(message, "{{token}}", token.Token)
	message = strings.ReplaceAll(message, "{{expires_at}}", expiresAt)

	if token.SignerEmail != nil {
		go pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
			Recipient: *token.SignerEmail,
			Subject:   subject,
			TextBody:  message,
		})
	}

	if token.SignerPhone != nil {
		go s.appCtx.Clients.GatekeeperAPI.SendSMS(ctx, gatekeeper.SendSMSInput{
			Recipient: *token.SignerPhone,
			Message:   message,
		})
	}
}

func (s *signingService) UpdateSigningTokenDetails(
	ctx context.Context,
	tokenID string,
	input UpdateSigningTokenDetailsInput,
) (*models.SigningToken, error) {
	token, err := s.repo.GetSigningTokenByID(ctx, tokenID, nil)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("SigningTokenNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "UpdateSigningTokenDetails",
				"action":   "fetching signing token",
			},
		})
	}

	if token.IsUsed() {
		return nil, pkg.BadRequestError("SigningTokenAlreadyUsed", nil)
	}

	if input.SignerName.IsSet {
		token.SignerName = input.SignerName.Ptr()
	}

	if input.SignerEmail.IsSet {
		token.SignerEmail = input.SignerEmail.Ptr()
	}

	if input.SignerPhone.IsSet {
		token.SignerPhone = input.SignerPhone.Ptr()
	}

	if updateErr := s.repo.UpdateSigningToken(ctx, token); updateErr != nil {
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateErr,
			Metadata: map[string]string{
				"function": "UpdateSigningTokenDetails",
				"action":   "updating signing token",
			},
		})
	}

	return token, nil
}

func (s *signingService) ResendSigningToken(
	ctx context.Context,
	tokenID string,
) (*models.SigningToken, error) {
	token, err := s.repo.GetSigningTokenByID(ctx, tokenID, nil)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("SigningTokenNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ResendSigningToken",
				"action":   "fetching signing token",
			},
		})
	}

	if token.IsUsed() {
		return nil, pkg.BadRequestError("SigningTokenAlreadyUsed", nil)
	}

	token.ExpiresAt = time.Now().Add(7 * 24 * time.Hour)

	if updateErr := s.repo.UpdateSigningToken(ctx, token); updateErr != nil {
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateErr,
			Metadata: map[string]string{
				"function": "ResendSigningToken",
				"action":   "extending signing token expiry",
			},
		})
	}

	s.sendSigningTokenNotification(ctx, token, true)

	return token, nil
}

func (s *signingService) ListSigningTokens(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListSigningTokensFilter,
) (*[]models.SigningToken, error) {
	tokens, err := s.repo.ListSigningTokens(ctx, filterQuery, filters)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListSigningTokens",
				"action":   "listing signing tokens",
			},
		})
	}

	return tokens, nil
}

func (s *signingService) CountSigningTokens(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListSigningTokensFilter,
) (int64, error) {
	count, err := s.repo.CountSigningTokens(ctx, filterQuery, filters)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountSigningTokens",
				"action":   "counting signing tokens",
			},
		})
	}

	return count, nil
}

func (s *signingService) ListDocumentSignatures(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListDocumentSignaturesFilter,
) (*[]models.DocumentSignature, error) {
	signatures, err := s.repo.ListDocumentSignatures(ctx, filterQuery, filters)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListDocumentSignatures",
				"action":   "listing document signatures",
			},
		})
	}

	return signatures, nil
}

func (s *signingService) CountDocumentSignatures(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListDocumentSignaturesFilter,
) (int64, error) {
	count, err := s.repo.CountDocumentSignatures(ctx, filterQuery, filters)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountDocumentSignatures",
				"action":   "counting document signatures",
			},
		})
	}

	return count, nil
}
