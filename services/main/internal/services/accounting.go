package services

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/accounting"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

// AccountingService provides business logic for accounting operations.
type AccountingService interface {
	RecordInvoiceCreated(
		ctx context.Context,
		input accounting.CreateJournalEntryRequest,
	) (*accounting.JournalEntry, error)
	RecordInvoicePayment(
		ctx context.Context,
		input accounting.CreateJournalEntryRequest,
	) (*accounting.JournalEntry, error)
}

type accountingService struct {
	appCtx pkg.AppContext
	client accounting.Client
}

// AccountingServiceConfig holds the configuration for the accounting service
type AccountingServiceConfig struct {
	BaseURL      string
	ClientID     string // fincore client_id
	ClientSecret string // fincore client_secret
}

// NewAccountingService creates a new accounting service
func NewAccountingService(appCtx pkg.AppContext) AccountingService {
	return &accountingService{appCtx, appCtx.Clients.AccountingAPI}
}

func (s *accountingService) RecordInvoiceCreated(
	ctx context.Context,
	input accounting.CreateJournalEntryRequest,
) (*accounting.JournalEntry, error) {
	metadata := map[string]any{
		"mode": "INVOICE_CREATION",
	}
	for k, v := range input.Metadata {
		metadata[k] = v
	}

	input.Metadata = metadata

	entry, err := s.client.CreateJournalEntry(ctx, input)
	if err != nil {
		return nil, pkg.InternalServerError("Failed to record invoice in accounting", &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function":         "RecordInvoiceCreated",
				"invoiceReference": input.Reference,
			},
		})
	}

	return entry, nil
}

func (s *accountingService) RecordInvoicePayment(
	ctx context.Context,
	input accounting.CreateJournalEntryRequest,
) (*accounting.JournalEntry, error) {
	metadata := map[string]any{
		"mode": "INVOICE_PAYMENT",
	}
	for k, v := range input.Metadata {
		metadata[k] = v
	}

	entry, err := s.client.CreateJournalEntry(ctx, input)
	if err != nil {
		return nil, pkg.InternalServerError("Failed to record invoice payment in accounting", &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function":         "RecordInvoicePayment",
				"paymentReference": input.Reference,
			},
		})
	}

	return entry, nil
}
