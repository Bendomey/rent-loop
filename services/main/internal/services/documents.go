package services

import (
	"context"
	"encoding/json"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
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

func (s *documentService) Create(ctx context.Context, input CreateDocumentInput) (*models.Document, error) {
	contentBytes, contentBytesErr := json.Marshal(input.Content)
	if contentBytesErr != nil {
		return nil, contentBytesErr
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
		return nil, err
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

func (s *documentService) Update(ctx context.Context, input UpdateDocumentInput) (*models.Document, error) {
	document, getErr := s.repo.GetByID(ctx, input.DocumentID)

	if getErr != nil {
		return nil, getErr
	}

	if input.Title != nil {
		document.Title = *input.Title
	}

	if input.Content != nil {
		contentBytes, contentBytesErr := json.Marshal(*input.Content)
		if contentBytesErr != nil {
			return nil, contentBytesErr
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
		return nil, err
	}

	return document, nil
}

func (s *documentService) GetByID(ctx context.Context, documentID string) (*models.Document, error) {
	return s.repo.GetByID(ctx, documentID)
}

func (s *documentService) Delete(ctx context.Context, documentID string) error {
	return s.repo.Delete(ctx, documentID)
}

func (s *documentService) List(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListDocumentsFilter,
) ([]models.Document, error) {
	documents, err := s.repo.List(ctx, filterQuery, filters)
	if err != nil {
		return nil, err
	}

	return *documents, nil
}

func (s *documentService) Count(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters repository.ListDocumentsFilter,
) (int64, error) {
	return s.repo.Count(ctx, filterQuery, filters)
}
