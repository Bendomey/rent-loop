package services

import (
	"context"
	"errors"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"gorm.io/gorm"
)

type AgreementWithAcceptance struct {
	Agreement       models.Agreement
	UserHasAccepted bool
}

type AgreementService interface {
	GetActiveAgreementsForUser(ctx context.Context, clientUserID string) ([]AgreementWithAcceptance, error)
	AcceptAgreement(
		ctx context.Context,
		clientUserID, agreementID, ipAddress string,
	) (*models.AgreementAcceptance, error)
	// Admin operations
	AdminCreateAgreement(ctx context.Context, input AdminCreateAgreementInput) (*models.Agreement, error)
	AdminUpdateAgreement(ctx context.Context, input AdminUpdateAgreementInput) (*models.Agreement, error)
	AdminActivateAgreement(ctx context.Context, agreementID string) (*models.Agreement, error)
	AdminListAgreements(ctx context.Context) ([]models.Agreement, error)
}

type AdminCreateAgreementInput struct {
	Name          string
	Version       string
	Content       string
	EffectiveDate time.Time
}

type AdminUpdateAgreementInput struct {
	AgreementID   string
	Name          *string
	Version       *string
	Content       *string
	EffectiveDate *time.Time
}

type agreementService struct {
	repo repository.AgreementRepository
}

func NewAgreementService(repo repository.AgreementRepository) AgreementService {
	return &agreementService{repo: repo}
}

func (s *agreementService) GetActiveAgreementsForUser(
	ctx context.Context,
	clientUserID string,
) ([]AgreementWithAcceptance, error) {
	agreements, err := s.repo.GetActiveAgreements(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]AgreementWithAcceptance, 0, len(agreements))
	for _, a := range agreements {
		acceptance, err := s.repo.GetAcceptanceByUserAndAgreement(ctx, clientUserID, a.ID.String(), a.Version)
		userHasAccepted := err == nil && acceptance != nil
		result = append(result, AgreementWithAcceptance{
			Agreement:       a,
			UserHasAccepted: userHasAccepted,
		})
	}

	return result, nil
}

func (s *agreementService) AcceptAgreement(
	ctx context.Context,
	clientUserID, agreementID, ipAddress string,
) (*models.AgreementAcceptance, error) {
	agreement, err := s.repo.GetByID(ctx, agreementID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("AgreementNotFound")
		}
		return nil, err
	}

	if !agreement.IsActive {
		return nil, errors.New("AgreementNotActive")
	}

	// Idempotent — return existing acceptance if already accepted
	existing, err := s.repo.GetAcceptanceByUserAndAgreement(ctx, clientUserID, agreementID, agreement.Version)
	if err == nil && existing != nil {
		return existing, nil
	}

	now := time.Now()
	acceptance := &models.AgreementAcceptance{
		ClientUserID: clientUserID,
		AgreementID:  agreementID,
		Version:      agreement.Version,
		AcceptedAt:   now,
		IPAddress:    ipAddress,
	}

	if err := s.repo.CreateAcceptance(ctx, acceptance); err != nil {
		return nil, err
	}

	return acceptance, nil
}

func (s *agreementService) AdminCreateAgreement(
	ctx context.Context,
	input AdminCreateAgreementInput,
) (*models.Agreement, error) {
	agreement := &models.Agreement{
		Name:          input.Name,
		Version:       input.Version,
		Content:       input.Content,
		EffectiveDate: input.EffectiveDate,
		IsActive:      false,
	}

	if err := s.repo.Create(ctx, agreement); err != nil {
		return nil, err
	}

	return agreement, nil
}

func (s *agreementService) AdminUpdateAgreement(
	ctx context.Context,
	input AdminUpdateAgreementInput,
) (*models.Agreement, error) {
	agreement, err := s.repo.GetByID(ctx, input.AgreementID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("AgreementNotFound")
		}
		return nil, err
	}

	if input.Name != nil {
		agreement.Name = *input.Name
	}
	if input.Version != nil {
		agreement.Version = *input.Version
	}
	if input.Content != nil {
		agreement.Content = *input.Content
	}
	if input.EffectiveDate != nil {
		agreement.EffectiveDate = *input.EffectiveDate
	}

	if err := s.repo.Update(ctx, agreement); err != nil {
		return nil, err
	}

	return agreement, nil
}

func (s *agreementService) AdminActivateAgreement(
	ctx context.Context,
	agreementID string,
) (*models.Agreement, error) {
	agreement, err := s.repo.GetByID(ctx, agreementID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("AgreementNotFound")
		}
		return nil, err
	}

	agreement.IsActive = true

	if err := s.repo.Update(ctx, agreement); err != nil {
		return nil, err
	}

	return agreement, nil
}

func (s *agreementService) AdminListAgreements(ctx context.Context) ([]models.Agreement, error) {
	return s.repo.ListAll(ctx)
}
