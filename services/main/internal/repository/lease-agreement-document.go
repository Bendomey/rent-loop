package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type LeaseAgreementDocumentRepository interface {
	Create(ctx context.Context, doc *models.LeaseAgreementDocument) error
	GetByLeaseID(ctx context.Context, leaseID string, populate *[]string) (*models.LeaseAgreementDocument, error)
	Update(ctx context.Context, doc *models.LeaseAgreementDocument) error
	Delete(ctx context.Context, id string) error
}

type leaseAgreementDocumentRepository struct {
	DB *gorm.DB
}

func NewLeaseAgreementDocumentRepository(db *gorm.DB) LeaseAgreementDocumentRepository {
	return &leaseAgreementDocumentRepository{DB: db}
}

func (r *leaseAgreementDocumentRepository) Create(ctx context.Context, doc *models.LeaseAgreementDocument) error {
	return r.DB.WithContext(ctx).Create(doc).Error
}

func (r *leaseAgreementDocumentRepository) GetByLeaseID(
	ctx context.Context,
	leaseID string,
	populate *[]string,
) (*models.LeaseAgreementDocument, error) {
	var doc models.LeaseAgreementDocument
	db := r.DB.WithContext(ctx).Where("lease_id = ?", leaseID)

	if populate != nil {
		for _, field := range *populate {
			db = db.Preload(field)
		}
	}

	if err := db.First(&doc).Error; err != nil {
		return nil, err
	}
	return &doc, nil
}

func (r *leaseAgreementDocumentRepository) Update(ctx context.Context, doc *models.LeaseAgreementDocument) error {
	return r.DB.WithContext(ctx).Save(doc).Error
}

func (r *leaseAgreementDocumentRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Where("id = ?", id).Delete(&models.LeaseAgreementDocument{}).Error
}
