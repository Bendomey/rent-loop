package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type SigningRepository interface {
	CreateSigningToken(ctx context.Context, token *models.SigningToken) error
	GetSigningTokenByToken(ctx context.Context, tokenStr string, populate *[]string) (*models.SigningToken, error)
	UpdateSigningToken(ctx context.Context, token *models.SigningToken) error
	CreateDocumentSignature(ctx context.Context, sig *models.DocumentSignature) error
}

type signingRepository struct {
	DB *gorm.DB
}

func NewSigningRepository(DB *gorm.DB) SigningRepository {
	return &signingRepository{DB}
}

func (r *signingRepository) CreateSigningToken(ctx context.Context, token *models.SigningToken) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Create(token).Error
}

func (r *signingRepository) GetSigningTokenByToken(
	ctx context.Context,
	tokenStr string,
	populate *[]string,
) (*models.SigningToken, error) {
	var token models.SigningToken
	db := r.DB.WithContext(ctx).Where("token = ?", tokenStr)

	if populate != nil {
		for _, field := range *populate {
			db = db.Preload(field)
		}
	}

	if result := db.First(&token); result.Error != nil {
		return nil, result.Error
	}
	return &token, nil
}

func (r *signingRepository) UpdateSigningToken(ctx context.Context, token *models.SigningToken) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Save(token).Error
}

func (r *signingRepository) CreateDocumentSignature(
	ctx context.Context,
	sig *models.DocumentSignature,
) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Create(sig).Error
}
