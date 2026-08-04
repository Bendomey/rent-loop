package services

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"gorm.io/gorm"
)

type LeaseAgreementDocumentService interface {
	CreateLeaseAgreementDocument(
		ctx context.Context,
		input CreateLeaseAgreementDocumentInput,
	) (*models.LeaseAgreementDocument, error)
	GetByLeaseID(ctx context.Context, leaseID string) (*models.LeaseAgreementDocument, error)
	UpdateLeaseAgreementDocument(
		ctx context.Context,
		input UpdateLeaseAgreementDocumentInput,
	) (*models.LeaseAgreementDocument, error)
	DeleteLeaseAgreementDocument(ctx context.Context, leaseID string) error
	FinalizeLeaseAgreementDocument(ctx context.Context, leaseID string) (*models.LeaseAgreementDocument, error)
	RevertLeaseAgreementDocumentToDraft(ctx context.Context, leaseID string) (*models.LeaseAgreementDocument, error)
}

type leaseAgreementDocumentService struct {
	repo repository.LeaseAgreementDocumentRepository
}

func NewLeaseAgreementDocumentService(repo repository.LeaseAgreementDocumentRepository) LeaseAgreementDocumentService {
	return &leaseAgreementDocumentService{repo: repo}
}

type CreateLeaseAgreementDocumentInput struct {
	LeaseID     string
	Mode        string  // "MANUAL" | "ONLINE"
	DocumentID  *string // ONLINE only
	DocumentUrl *string // MANUAL only
}

func (s *leaseAgreementDocumentService) CreateLeaseAgreementDocument(
	ctx context.Context,
	input CreateLeaseAgreementDocumentInput,
) (*models.LeaseAgreementDocument, error) {
	existing, err := s.repo.GetByLeaseID(ctx, input.LeaseID, nil)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	if existing != nil {
		return nil, pkg.BadRequestError("LeaseAgreementDocumentAlreadyExists", nil)
	}

	doc := &models.LeaseAgreementDocument{
		LeaseID:     input.LeaseID,
		Mode:        input.Mode,
		DocumentID:  input.DocumentID,
		DocumentUrl: input.DocumentUrl,
		Status:      "DRAFT",
	}
	if err := s.repo.Create(ctx, doc); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return doc, nil
}

func (s *leaseAgreementDocumentService) GetByLeaseID(
	ctx context.Context,
	leaseID string,
) (*models.LeaseAgreementDocument, error) {
	populate := []string{"Document", "Signatures", "Signatures.SignedBy"}
	doc, err := s.repo.GetByLeaseID(ctx, leaseID, &populate)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseAgreementDocumentNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return doc, nil
}

type UpdateLeaseAgreementDocumentInput struct {
	LeaseID     string
	DocumentID  *string
	DocumentUrl *string
	Mode        *string
}

func (s *leaseAgreementDocumentService) UpdateLeaseAgreementDocument(
	ctx context.Context,
	input UpdateLeaseAgreementDocumentInput,
) (*models.LeaseAgreementDocument, error) {
	doc, err := s.repo.GetByLeaseID(ctx, input.LeaseID, nil)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseAgreementDocumentNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	if doc.Status != "DRAFT" {
		return nil, pkg.BadRequestError("LeaseAgreementDocumentNotEditable", nil)
	}

	if input.Mode != nil {
		doc.Mode = *input.Mode
		// clear the opposing field when switching modes
		if *input.Mode == "ONLINE" {
			doc.DocumentUrl = nil
		} else if *input.Mode == "MANUAL" {
			doc.DocumentID = nil
		}
	}
	if input.DocumentID != nil {
		doc.DocumentID = input.DocumentID
	}
	if input.DocumentUrl != nil {
		doc.DocumentUrl = input.DocumentUrl
	}

	if err := s.repo.Update(ctx, doc); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return doc, nil
}

func (s *leaseAgreementDocumentService) DeleteLeaseAgreementDocument(ctx context.Context, leaseID string) error {
	doc, err := s.repo.GetByLeaseID(ctx, leaseID, nil)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("LeaseAgreementDocumentNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	if err := s.repo.Delete(ctx, doc.ID.String()); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return nil
}

func (s *leaseAgreementDocumentService) FinalizeLeaseAgreementDocument(
	ctx context.Context,
	leaseID string,
) (*models.LeaseAgreementDocument, error) {
	doc, err := s.repo.GetByLeaseID(ctx, leaseID, nil)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseAgreementDocumentNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	if doc.Status != "DRAFT" {
		return nil, pkg.BadRequestError("LeaseAgreementDocumentAlreadyFinalized", nil)
	}

	doc.Status = "FINALIZED"
	if err := s.repo.Update(ctx, doc); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return doc, nil
}

func (s *leaseAgreementDocumentService) RevertLeaseAgreementDocumentToDraft(
	ctx context.Context,
	leaseID string,
) (*models.LeaseAgreementDocument, error) {
	doc, err := s.repo.GetByLeaseID(ctx, leaseID, nil)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseAgreementDocumentNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	if doc.Status != "FINALIZED" {
		return nil, pkg.BadRequestError("LeaseAgreementDocumentNotFinalized", nil)
	}

	doc.Status = "DRAFT"
	if err := s.repo.Update(ctx, doc); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return doc, nil
}
