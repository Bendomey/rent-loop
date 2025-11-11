package services

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"gorm.io/gorm"
)

type DocumentService interface {
	Create(ctx context.Context, input CreateDocumentInput) (*models.Document, error)
	Update(ctx context.Context, input UpdateDocumentInput) (*models.Document, error)
	GetByID(ctx context.Context, documentID string) (*models.Document, error)
	Delete(ctx context.Context, documentID string) error
	List(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters repository.ListDocumentsFilter,
	) ([]models.Document, error)
	Count(ctx context.Context, filterQuery lib.FilterQuery, filters repository.ListDocumentsFilter) (int64, error)
	GetByIDWithPopulate(
		ctx context.Context,
		filterQuery repository.GetDocumentWithPopulateFilter,
	) (*models.Document, error)
}

type documentService struct {
	appCtx pkg.AppContext
	repo   repository.DocumentRepository
}

func NewDocumentService(appCtx pkg.AppContext, repo repository.DocumentRepository) DocumentService {
	return &documentService{
		appCtx: appCtx,
		repo:   repo,
	}
}

type CreateDocumentInput struct {
	Title        string
	Content      map[string]interface{}
	Size         int64
	Tags         *[]string
	PropertyID   *string
	ClientUserID string
}

func (s *documentService) Create(
	ctx context.Context,
	input CreateDocumentInput,
) (*models.Document, error) {
	contentBytes, contentBytesErr := json.Marshal(input.Content)
	if contentBytesErr != nil {
		return nil, pkg.InternalServerError(contentBytesErr.Error(), &pkg.RentLoopErrorParams{
			Err: contentBytesErr,
			Metadata: map[string]string{
				"function": "CreateDocument",
				"action":   "marshaling document content to JSON",
			},
		})
	}

	tags := []string{}
	if input.Tags != nil {
		tags = *input.Tags
	}

	document := &models.Document{
		Title:       input.Title,
		Content:     contentBytes,
		Size:        input.Size,
		Tags:        tags,
		PropertyID:  input.PropertyID,
		CreatedByID: input.ClientUserID,
	}

	if err := s.repo.Create(ctx, document); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateDocument",
				"action":   "creating new document record",
			},
		})
	}

	return document, nil
}

type UpdateDocumentInput struct {
	DocumentID   string
	Title        *string
	Content      *map[string]interface{}
	Size         *int64
	Tags         *[]string
	PropertyID   *string
	ClientUserID string
}

func (s *documentService) Update(
	ctx context.Context,
	input UpdateDocumentInput,
) (*models.Document, error) {
	document, err := s.repo.GetByID(ctx, input.DocumentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("DocumentNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "UpdateDocument",
				"action":   "fetching document by ID",
			},
		})
	}

	if input.Title != nil {
		document.Title = *input.Title
	}

	if input.Content != nil {
		contentBytes, contentBytesErr := json.Marshal(*input.Content)
		if contentBytesErr != nil {
			return nil, pkg.InternalServerError(contentBytesErr.Error(), &pkg.RentLoopErrorParams{
				Err: contentBytesErr,
				Metadata: map[string]string{
					"function": "UpdateDocument",
					"action":   "marshaling updated document content to JSON",
				},
			})
		}

		document.Content = contentBytes
	}

	if input.Size != nil {
		document.Size = *input.Size
	}

	if input.Tags != nil {
		document.Tags = *input.Tags
	}

	document.PropertyID = input.PropertyID
	document.UpdatedByID = &input.ClientUserID

	if err := s.repo.Update(ctx, document); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "UpdateDocument",
				"action":   "updating document record",
			},
		})
	}

	return document, nil
}

func (s *documentService) GetByID(ctx context.Context, documentID string) (*models.Document, error) {
	document, err := s.repo.GetByID(ctx, documentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("DocumentNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetByID",
				"action":   "fetching document by ID",
			},
		})
	}

	return document, nil
}

func (s *documentService) GetByIDWithPopulate(
	ctx context.Context,
	filter repository.GetDocumentWithPopulateFilter,
) (*models.Document, error) {
	document, err := s.repo.GetByIDWithPopulate(ctx, filter)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("DocumentNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetByIDWithPopulate",
				"action":   "fetching document by ID with populate query",
			},
		})
	}

	return document, nil
}

func (s *documentService) Delete(ctx context.Context, documentID string) error {
	deleteErr := s.repo.Delete(ctx, documentID)

	if deleteErr != nil {
		return pkg.InternalServerError(deleteErr.Error(), &pkg.RentLoopErrorParams{
			Err: deleteErr,
			Metadata: map[string]string{
				"function": "DeleteDocument",
				"action":   "deleting document by ID",
			},
		})
	}

	return nil
}

func (s *documentService) List(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListDocumentsFilter,
) ([]models.Document, error) {
	documents, err := s.repo.List(ctx, filterQuery, filters)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "List",
				"action":   "listing documents",
			},
		})
	}

	return *documents, nil
}

func (s *documentService) Count(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListDocumentsFilter,
) (int64, error) {
	count, err := s.repo.Count(ctx, filterQuery, filters)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "Count",
				"action":   "counting documents",
			},
		})
	}

	return count, nil
}
