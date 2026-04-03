package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type AgreementRepository interface {
	GetActiveAgreements(ctx context.Context) ([]models.Agreement, error)
	GetByID(ctx context.Context, id string) (*models.Agreement, error)
	Create(ctx context.Context, agreement *models.Agreement) error
	Update(ctx context.Context, agreement *models.Agreement) error
	GetAcceptanceByUserAndAgreement(
		ctx context.Context,
		clientUserID, agreementID, version string,
	) (*models.AgreementAcceptance, error)
	CreateAcceptance(ctx context.Context, acceptance *models.AgreementAcceptance) error
	ListAll(ctx context.Context) ([]models.Agreement, error)
}

type agreementRepository struct {
	DB *gorm.DB
}

func NewAgreementRepository(db *gorm.DB) AgreementRepository {
	return &agreementRepository{DB: db}
}

func (r *agreementRepository) GetActiveAgreements(ctx context.Context) ([]models.Agreement, error) {
	var agreements []models.Agreement
	result := r.DB.WithContext(ctx).Where("is_active = true").Find(&agreements)
	if result.Error != nil {
		return nil, result.Error
	}
	return agreements, nil
}

func (r *agreementRepository) GetByID(ctx context.Context, id string) (*models.Agreement, error) {
	var agreement models.Agreement
	result := r.DB.WithContext(ctx).Where("id = ?", id).First(&agreement)
	if result.Error != nil {
		return nil, result.Error
	}
	return &agreement, nil
}

func (r *agreementRepository) Create(ctx context.Context, agreement *models.Agreement) error {
	return r.DB.WithContext(ctx).Create(agreement).Error
}

func (r *agreementRepository) Update(ctx context.Context, agreement *models.Agreement) error {
	return r.DB.WithContext(ctx).Save(agreement).Error
}

func (r *agreementRepository) GetAcceptanceByUserAndAgreement(
	ctx context.Context,
	clientUserID, agreementID, version string,
) (*models.AgreementAcceptance, error) {
	var acceptance models.AgreementAcceptance
	result := r.DB.WithContext(ctx).
		Where("client_user_id = ? AND agreement_id = ? AND version = ?", clientUserID, agreementID, version).
		First(&acceptance)
	if result.Error != nil {
		return nil, result.Error
	}
	return &acceptance, nil
}

func (r *agreementRepository) CreateAcceptance(ctx context.Context, acceptance *models.AgreementAcceptance) error {
	return r.DB.WithContext(ctx).Create(acceptance).Error
}

func (r *agreementRepository) ListAll(ctx context.Context) ([]models.Agreement, error) {
	var agreements []models.Agreement
	result := r.DB.WithContext(ctx).Order("created_at DESC").Find(&agreements)
	if result.Error != nil {
		return nil, result.Error
	}
	return agreements, nil
}
