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
	GetDocumentSignatureByQuery(ctx context.Context, query map[string]any) (*models.DocumentSignature, error)
	ListDocumentSignatures(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters ListDocumentSignaturesFilter,
	) (*[]models.DocumentSignature, error)
	CountDocumentSignatures(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters ListDocumentSignaturesFilter,
	) (int64, error)
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

func (r *signingRepository) GetDocumentSignatureByQuery(
	ctx context.Context,
	query map[string]any,
) (*models.DocumentSignature, error) {
	var sig models.DocumentSignature
	result := r.DB.WithContext(ctx).Where(query).First(&sig)

	if result.Error != nil {
		return nil, result.Error
	}

	return &sig, nil
}

type ListDocumentSignaturesFilter struct {
	DocumentID          *string
	TenantApplicationID *string
	LeaseID             *string
	Role                *string
	SignedByID          *string
	IDs                 *[]string
}

func DocumentSignatureDocumentIDScope(documentID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if documentID == nil {
			return db
		}
		return db.Where("document_signatures.document_id = ?", *documentID)
	}
}

func DocumentSignatureTenantApplicationIDScope(tenantApplicationID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if tenantApplicationID == nil {
			return db
		}
		return db.Where("document_signatures.tenant_application_id = ?", *tenantApplicationID)
	}
}

func DocumentSignatureLeaseIDScope(leaseID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if leaseID == nil {
			return db
		}
		return db.Where("document_signatures.lease_id = ?", *leaseID)
	}
}

func DocumentSignatureRoleScope(role *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if role == nil {
			return db
		}
		return db.Where("document_signatures.role = ?", *role)
	}
}

func DocumentSignatureSignedByIDScope(signedByID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if signedByID == nil {
			return db
		}
		return db.Where("document_signatures.signed_by_id = ?", *signedByID)
	}
}

func (r *signingRepository) ListDocumentSignatures(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListDocumentSignaturesFilter,
) (*[]models.DocumentSignature, error) {
	var signatures []models.DocumentSignature

	db := r.DB.WithContext(ctx).
		Scopes(
			IDsFilterScope("document_signatures", filters.IDs),
			DateRangeScope("document_signatures", filterQuery.DateRange),
			DocumentSignatureDocumentIDScope(filters.DocumentID),
			DocumentSignatureTenantApplicationIDScope(filters.TenantApplicationID),
			DocumentSignatureLeaseIDScope(filters.LeaseID),
			DocumentSignatureRoleScope(filters.Role),
			DocumentSignatureSignedByIDScope(filters.SignedByID),
			PaginationScope(filterQuery.Page, filterQuery.PageSize),
			OrderScope("document_signatures", filterQuery.OrderBy, filterQuery.Order),
		)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	result := db.Find(&signatures)
	if result.Error != nil {
		return nil, result.Error
	}

	return &signatures, nil
}

func (r *signingRepository) CountDocumentSignatures(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListDocumentSignaturesFilter,
) (int64, error) {
	var count int64

	result := r.DB.
		WithContext(ctx).
		Model(&models.DocumentSignature{}).
		Scopes(
			IDsFilterScope("document_signatures", filters.IDs),
			DateRangeScope("document_signatures", filterQuery.DateRange),
			DocumentSignatureDocumentIDScope(filters.DocumentID),
			DocumentSignatureTenantApplicationIDScope(filters.TenantApplicationID),
			DocumentSignatureLeaseIDScope(filters.LeaseID),
			DocumentSignatureRoleScope(filters.Role),
			DocumentSignatureSignedByIDScope(filters.SignedByID),
		).
		Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}
