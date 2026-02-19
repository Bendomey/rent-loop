package services

import (
	"context"
	"errors"
	"time"

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
