package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/lib/pq"
	gonanoid "github.com/matoous/go-nanoid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type InvoiceService interface {
	CreateInvoice(context context.Context, input CreateInvoiceInput) (*models.Invoice, error)
	UpdateInvoice(context context.Context, input UpdateInvoiceInput) (*models.Invoice, error)
	GetByID(context context.Context, query repository.GetInvoiceQuery) (*models.Invoice, error)
	ListInvoices(context context.Context, filterQuery repository.ListInvoicesFilter) (*[]models.Invoice, int64, error)
	AddLineItem(context context.Context, input AddLineItemInput) (*models.InvoiceLineItem, error)
	GetLineItems(context context.Context, invoiceID string) ([]models.InvoiceLineItem, error)
}

type invoiceService struct {
	appCtx pkg.AppContext
	repo   repository.InvoiceRepository
}

func NewInvoiceService(appCtx pkg.AppContext, repo repository.InvoiceRepository) InvoiceService {
	return &invoiceService{appCtx: appCtx, repo: repo}
}

type LineItemInput struct {
	Label       string
	Category    string
	Quantity    int64
	UnitAmount  int64
	TotalAmount int64
	Currency    string
	Metadata    *map[string]any
}

type CreateInvoiceInput struct {
	PayerType                   string
	PayerClientID               *string
	PayerPropertyID             *string
	PayerTenantID               *string
	PayeeType                   string
	PayeeClientID               *string
	ContextType                 string
	ContextTenantApplicationID  *string
	ContextLeaseID              *string
	ContextMaintenanceRequestID *string
	TotalAmount                 int64
	Taxes                       int64
	SubTotal                    int64
	Currency                    string
	Status                      string
	DueDate                     *time.Time
	AllowedPaymentRails         []string
	LineItems                   []LineItemInput
}

func (s *invoiceService) CreateInvoice(ctx context.Context, input CreateInvoiceInput) (*models.Invoice, error) {
	// Generate invoice code
	nanoID, err := gonanoid.Generate("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", 6)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateInvoice",
				"action":   "generating invoice code",
			},
		})
	}

	year, month, _ := time.Now().Date()
	code := fmt.Sprintf("INV-%02d%02d-%s", year%100, month, nanoID)

	// Build line items
	var lineItems []models.InvoiceLineItem
	for _, item := range input.LineItems {
		var metaJson *datatypes.JSON
		if item.Metadata != nil {
			json, err := lib.InterfaceToJSON(*item.Metadata)
			if err != nil {
				return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
					Err: err,
					Metadata: map[string]string{
						"function": "CreateInvoice",
						"action":   "marshalling line item metadata",
					},
				})
			}
			metaJson = json
		}

		lineItems = append(lineItems, models.InvoiceLineItem{
			Label:       item.Label,
			Category:    item.Category,
			Quantity:    item.Quantity,
			UnitAmount:  item.UnitAmount,
			TotalAmount: item.TotalAmount,
			Currency:    item.Currency,
			Metadata:    metaJson,
		})
	}

	invoice := models.Invoice{
		Code:                        code,
		PayerType:                   input.PayerType,
		PayerClientID:               input.PayerClientID,
		PayerPropertyID:             input.PayerPropertyID,
		PayerTenantID:               input.PayerTenantID,
		PayeeType:                   input.PayeeType,
		PayeeClientID:               input.PayeeClientID,
		ContextType:                 input.ContextType,
		ContextTenantApplicationID:  input.ContextTenantApplicationID,
		ContextLeaseID:              input.ContextLeaseID,
		ContextMaintenanceRequestID: input.ContextMaintenanceRequestID,
		TotalAmount:                 input.TotalAmount,
		Taxes:                       input.Taxes,
		SubTotal:                    input.SubTotal,
		Currency:                    input.Currency,
		DueDate:                     input.DueDate,
		AllowedPaymentRails:         pq.StringArray(input.AllowedPaymentRails),
		LineItems:                   lineItems,
	}

	createErr := s.repo.Create(ctx, &invoice)
	if createErr != nil {
		return nil, pkg.BadRequestError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err: createErr,
			Metadata: map[string]string{
				"function": "CreateInvoice",
				"action":   "creating invoice",
			},
		})
	}

	return &invoice, nil
}

type UpdateInvoiceInput struct {
	InvoiceID           string
	Status              *string
	TotalAmount         *int64
	Taxes               *int64
	SubTotal            *int64
	DueDate             *time.Time
	IssuedAt            *time.Time
	PaidAt              *time.Time
	VoidedAt            *time.Time
	AllowedPaymentRails *[]string
}

func (s *invoiceService) UpdateInvoice(ctx context.Context, input UpdateInvoiceInput) (*models.Invoice, error) {
	invoice, getErr := s.repo.GetByID(ctx, repository.GetInvoiceQuery{
		ID: input.InvoiceID,
	})
	if getErr != nil {
		if errors.Is(getErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("InvoiceNotFound", &pkg.RentLoopErrorParams{
				Err: getErr,
			})
		}
		return nil, pkg.InternalServerError(getErr.Error(), &pkg.RentLoopErrorParams{
			Err: getErr,
			Metadata: map[string]string{
				"function": "UpdateInvoice",
				"action":   "getting invoice",
			},
		})
	}

	if input.Status != nil {
		invoice.Status = *input.Status
	}

	if input.TotalAmount != nil {
		invoice.TotalAmount = *input.TotalAmount
	}

	if input.Taxes != nil {
		invoice.Taxes = *input.Taxes
	}

	if input.SubTotal != nil {
		invoice.SubTotal = *input.SubTotal
	}

	if input.DueDate != nil {
		invoice.DueDate = input.DueDate
	}

	if input.IssuedAt != nil {
		invoice.IssuedAt = input.IssuedAt
	}

	if input.PaidAt != nil {
		invoice.PaidAt = input.PaidAt
	}

	if input.VoidedAt != nil {
		invoice.VoidedAt = input.VoidedAt
	}

	if input.AllowedPaymentRails != nil {
		invoice.AllowedPaymentRails = pq.StringArray(*input.AllowedPaymentRails)
	}

	updateErr := s.repo.Update(ctx, invoice)
	if updateErr != nil {
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateErr,
			Metadata: map[string]string{
				"function": "UpdateInvoice",
				"action":   "updating invoice",
			},
		})
	}

	return invoice, nil
}

func (s *invoiceService) GetByID(ctx context.Context, query repository.GetInvoiceQuery) (*models.Invoice, error) {
	invoice, err := s.repo.GetByID(ctx, query)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("InvoiceNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetByIDWithPopulate",
				"action":   "getting invoice",
			},
		})
	}

	return invoice, nil
}

func (s *invoiceService) ListInvoices(
	ctx context.Context,
	filterQuery repository.ListInvoicesFilter,
) (*[]models.Invoice, int64, error) {
	invoices, err := s.repo.List(ctx, filterQuery)
	if err != nil {
		return nil, 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListInvoices",
				"action":   "listing invoices",
			},
		})
	}

	count, countErr := s.repo.Count(ctx, filterQuery)
	if countErr != nil {
		return nil, 0, pkg.InternalServerError(countErr.Error(), &pkg.RentLoopErrorParams{
			Err: countErr,
			Metadata: map[string]string{
				"function": "ListInvoices",
				"action":   "counting invoices",
			},
		})
	}

	return invoices, count, nil
}

type AddLineItemInput struct {
	InvoiceID   string
	Label       string
	Category    string
	Quantity    int64
	UnitAmount  int64
	TotalAmount int64
	Currency    string
	Metadata    *map[string]any
}

func (s *invoiceService) AddLineItem(ctx context.Context, input AddLineItemInput) (*models.InvoiceLineItem, error) {
	// Verify invoice exists
	_, getErr := s.repo.GetByID(ctx, repository.GetInvoiceQuery{
		ID: input.InvoiceID,
	})
	if getErr != nil {
		if errors.Is(getErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("InvoiceNotFound", &pkg.RentLoopErrorParams{
				Err: getErr,
			})
		}
		return nil, pkg.InternalServerError(getErr.Error(), &pkg.RentLoopErrorParams{
			Err: getErr,
			Metadata: map[string]string{
				"function": "AddLineItem",
				"action":   "getting invoice",
			},
		})
	}

	var metaJson *datatypes.JSON
	if input.Metadata != nil {
		json, err := lib.InterfaceToJSON(*input.Metadata)
		if err != nil {
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "AddLineItem",
					"action":   "marshalling metadata",
				},
			})
		}
		metaJson = json
	}

	lineItem := models.InvoiceLineItem{
		InvoiceID:   &input.InvoiceID,
		Label:       input.Label,
		Category:    input.Category,
		Quantity:    input.Quantity,
		UnitAmount:  input.UnitAmount,
		TotalAmount: input.TotalAmount,
		Currency:    input.Currency,
		Metadata:    metaJson,
	}

	createErr := s.repo.CreateLineItem(ctx, &lineItem)
	if createErr != nil {
		return nil, pkg.BadRequestError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err: createErr,
			Metadata: map[string]string{
				"function": "AddLineItem",
				"action":   "creating line item",
			},
		})
	}

	return &lineItem, nil
}

func (s *invoiceService) GetLineItems(ctx context.Context, invoiceID string) ([]models.InvoiceLineItem, error) {
	lineItems, err := s.repo.GetLineItems(ctx, invoiceID)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetLineItems",
				"action":   "getting line items",
			},
		})
	}

	return lineItems, nil
}
