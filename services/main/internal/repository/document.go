package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type DocumentRepository interface {
	GetByID(context context.Context, id string) (*models.Document, error)
	Create(context context.Context, document *models.Document) error
	Update(context context.Context, document *models.Document) error
	Delete(context context.Context, documentID string) error
	List(context context.Context, filterQuery lib.FilterQuery, filters ListDocumentsFilter) (*[]models.Document, error)
	Count(context context.Context, filterQuery lib.FilterQuery, filters ListDocumentsFilter) (int64, error)
}

type documentRepository struct {
	DB *gorm.DB
}

func NewDocumentRepository(DB *gorm.DB) DocumentRepository {
	return &documentRepository{DB}
}

func (r *documentRepository) GetByID(ctx context.Context, id string) (*models.Document, error) {
	var document models.Document
	result := r.DB.WithContext(ctx).Where("id = ?", id).First(&document)
	if result.Error != nil {
		return nil, result.Error
	}
	return &document, nil
}

func (r *documentRepository) Create(ctx context.Context, document *models.Document) error {
	return r.DB.WithContext(ctx).Create(document).Error
}

func (r *documentRepository) Update(ctx context.Context, document *models.Document) error {
	return r.DB.WithContext(ctx).Save(document).Error
}

func (r *documentRepository) Delete(ctx context.Context, documentID string) error {
	return r.DB.WithContext(ctx).Where("id = ?", documentID).Delete(&models.Document{}).Error
}

type ListDocumentsFilter struct {
	Tags       *[]string
	PropertyID *string
	ClientID   string
}

func (r *documentRepository) List(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListDocumentsFilter,
) (*[]models.Document, error) {
	var documents []models.Document

	db := r.DB.WithContext(ctx).
		Scopes(
			DateRangeScope("documents", filterQuery.DateRange),
			SearchScope("documents", filterQuery.Search),
			ClientIDFilterScope(filters.ClientID),
			PropertyIDFilterScope(filters.PropertyID),
			TagsFilterScope(filters.Tags),

			PaginationScope(filterQuery.Page, filterQuery.PageSize),
			OrderScope("documents", filterQuery.OrderBy, filterQuery.Order),
		)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	results := db.Find(&documents)

	if results.Error != nil {
		return nil, results.Error
	}

	return &documents, nil
}

func (r *documentRepository) Count(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListDocumentsFilter,
) (int64, error) {
	var count int64

	result := r.DB.
		WithContext(ctx).
		Model(&models.Document{}).
		Scopes(
			DateRangeScope("documents", filterQuery.DateRange),
			SearchScope("documents", filterQuery.Search),
			ClientIDFilterScope(filters.ClientID),
			PropertyIDFilterScope(filters.PropertyID),
			TagsFilterScope(filters.Tags),
		).
		Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func PropertyIDFilterScope(propertyID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyID == nil {
			return db
		}

		return db.Where("documents.property_id = ?", *propertyID)
	}
}

func ClientIDFilterScope(clientID string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Joins("JOIN client_users ON documents.created_by_id = client_users.id").
			Where("client_users.client_id = ?", clientID)
	}
}

func TagsFilterScope(tags *[]string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if tags == nil || len(*tags) == 0 {
			return db
		}

		return db.Where("documents.tags && ?", pq.StringArray(*tags))
	}
}
