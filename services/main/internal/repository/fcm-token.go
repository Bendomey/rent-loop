package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type FcmTokenRepository interface {
	// Upsert inserts the token if it doesn't exist; updates UpdatedAt if it does.
	Upsert(ctx context.Context, token *models.FcmToken) error
	// FindAllByTenantAccountID returns every token registered for the given account.
	FindAllByTenantAccountID(ctx context.Context, tenantAccountID string) ([]*models.FcmToken, error)
	// Delete removes a token by its value (called when FCM reports it as invalid).
	Delete(ctx context.Context, token string) error
}

type fcmTokenRepository struct {
	DB *gorm.DB
}

func NewFcmTokenRepository(db *gorm.DB) FcmTokenRepository {
	return &fcmTokenRepository{DB: db}
}

func (r *fcmTokenRepository) Upsert(ctx context.Context, token *models.FcmToken) error {
	return r.DB.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "token"}},
			DoUpdates: clause.AssignmentColumns([]string{"updated_at", "platform"}),
		}).
		Create(token).Error
}

func (r *fcmTokenRepository) FindAllByTenantAccountID(
	ctx context.Context,
	tenantAccountID string,
) ([]*models.FcmToken, error) {
	var tokens []*models.FcmToken
	if err := r.DB.WithContext(ctx).
		Where("tenant_account_id = ?", tenantAccountID).
		Find(&tokens).Error; err != nil {
		return nil, err
	}
	return tokens, nil
}

func (r *fcmTokenRepository) Delete(ctx context.Context, token string) error {
	return r.DB.WithContext(ctx).
		Where("token = ?", token).
		Delete(&models.FcmToken{}).Error
}
