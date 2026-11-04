package services

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/accounting"
	"github.com/gofrs/uuid"
)

func newFakeFincore(t *testing.T, handler http.HandlerFunc) AccountingService {
	t.Helper()
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)

	return &accountingService{client: accounting.NewClient(accounting.ClientConfig{BaseURL: server.URL})}
}

func paymentEntryRequest() accounting.CreateJournalEntryRequest {
	return accounting.CreateJournalEntryRequest{
		Status:    string(accounting.JournalEntryStatusPosted),
		Reference: "PMT-INV-2610-0E23HR-abc",
		Metadata:  map[string]any{"payment_id": "abc"},
		Lines: []accounting.CreateJournalEntryLineRequest{
			{AccountID: "cash", Debit: 100},
			{AccountID: "ar", Credit: 100},
		},
	}
}

func TestRecordInvoicePaymentTreatsDuplicateReferenceAsAlreadyRecorded(t *testing.T) {
	service := newFakeFincore(t, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusConflict)
		_, _ = w.Write([]byte(`{"errors":{"message":"a journal entry with this reference already exists",` +
			`"journal_entry_id":"existing-entry-id"}}`))
	})

	entry, err := service.RecordInvoicePayment(context.Background(), paymentEntryRequest())
	if err != nil {
		t.Fatalf("expected a duplicate reference to count as recorded, got %v", err)
	}
	if entry == nil || entry.ID != "existing-entry-id" {
		t.Fatalf("expected the existing entry id, got %+v", entry)
	}
}

func TestRecordInvoicePaymentStillFailsOnOtherErrors(t *testing.T) {
	service := newFakeFincore(t, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"errors":{"message":"debit and credit totals must be equal"}}`))
	})

	if _, err := service.RecordInvoicePayment(context.Background(), paymentEntryRequest()); err == nil {
		t.Fatal("expected a validation error to fail the payment")
	}
}

func TestRecordInvoicePaymentSendsPaymentMode(t *testing.T) {
	var sent accounting.CreateJournalEntryRequest
	service := newFakeFincore(t, func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewDecoder(r.Body).Decode(&sent)
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(`{"data":{"id":"new-entry-id"}}`))
	})

	if _, err := service.RecordInvoicePayment(context.Background(), paymentEntryRequest()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if sent.Metadata["mode"] != "INVOICE_PAYMENT" {
		t.Fatalf("expected mode INVOICE_PAYMENT in metadata, got %v", sent.Metadata)
	}
	if sent.Metadata["payment_id"] != "abc" {
		t.Fatalf("expected caller metadata to be kept, got %v", sent.Metadata)
	}
}

func TestPaymentJournalReferenceIsUniquePerPayment(t *testing.T) {
	first := paymentJournalReference("INV-2610-0E23HR", uuid.Must(uuid.NewV4()))
	second := paymentJournalReference("INV-2610-0E23HR", uuid.Must(uuid.NewV4()))

	if first == second {
		t.Fatalf("two payments on one invoice share the reference %q", first)
	}
	if first == "INV-2610-0E23HR" {
		t.Fatal("payment reference collides with the invoice's issuance reference")
	}
}
