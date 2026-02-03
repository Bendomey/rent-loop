package services

import (
	"context"
	"fmt"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/accounting"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

// AccountingService provides business logic for accounting operations.
// This service uses ACCRUAL ACCOUNTING where revenue is recognized when earned
// (invoice issued), not when cash is received.
type AccountingService interface {
	// Invoice Accounting (Accrual-Basis)
	// Step 1: RecordInvoiceCreated - Revenue recognized when invoice is issued
	// Step 2: RecordInvoicePayment - Receivable cleared when payment is received
	RecordInvoiceCreated(ctx context.Context, input RecordInvoiceInput) (*accounting.JournalEntry, error)
	RecordInvoicePayment(ctx context.Context, input RecordInvoicePaymentInput) (*accounting.JournalEntry, error)

	// Security Deposit Accounting
	RecordSecurityDepositReceived(
		ctx context.Context,
		input RecordSecurityDepositInput,
	) (*accounting.JournalEntry, error)
	RecordSecurityDepositRefund(
		ctx context.Context,
		input RecordSecurityDepositRefundInput,
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
func NewAccountingService(appCtx pkg.AppContext, client accounting.Client) AccountingService {
	return &accountingService{appCtx, client}
}

// ============================================================================
// Input Types
// ============================================================================

type RecordInvoiceInput struct {
	InvoiceID   string
	Amount      int64
	InvoiceDate time.Time
	TenantName  string
	Description string
}

type RecordInvoicePaymentInput struct {
	InvoiceID   string
	PaymentID   string
	Amount      int64
	PaymentDate time.Time
	TenantName  string
}

type RecordSecurityDepositInput struct {
	LeaseID      string
	TenantID     string
	Amount       int64
	ReceivedDate time.Time
	TenantName   string
	UnitName     string
}

type RecordSecurityDepositRefundInput struct {
	LeaseID         string
	TenantID        string
	RefundAmount    int64 // Amount being refunded to tenant
	DeductionAmount int64 // Amount deducted for damages, etc.
	RefundDate      time.Time
	TenantName      string
	DeductionNote   string // Reason for deductions
}

// ============================================================================
// Invoice Accounting (Accrual-Basis)
// ============================================================================

// RecordInvoiceCreated records revenue recognition when an invoice is issued.
// This is Step 1 of accrual accounting for rental payments.
//
// Journal Entry:
//   - Debit: Accounts Receivable (Asset increases - tenant owes money)
//   - Credit: Rental Income (Revenue recognized when earned, not when received)
//
// When payment is received, call RecordInvoicePayment to clear the receivable.
func (s *accountingService) RecordInvoiceCreated(
	ctx context.Context,
	input RecordInvoiceInput,
) (*accounting.JournalEntry, error) {
	// Create journal entry for invoice creation (accrual accounting):
	// Debit: Accounts Receivable (Asset increases)
	// Credit: Rent Income (Revenue recognized)

	accounts := s.appCtx.Config.ChartOfAccounts
	transactionDate := input.InvoiceDate.Format(time.RFC3339)
	reference := fmt.Sprintf("INV-%s", input.InvoiceID)

	entry, err := s.client.CreateJournalEntry(ctx, accounting.CreateJournalEntryRequest{
		Status:          string(accounting.JournalEntryStatusPosted),
		Reference:       reference,
		TransactionDate: &transactionDate,
		Metadata: map[string]any{
			"invoice_id":  input.InvoiceID,
			"tenant_name": input.TenantName,
			"description": input.Description,
			"type":        "INVOICE",
		},
		Lines: []accounting.CreateJournalEntryLineRequest{
			{
				AccountID: accounts.AccountsReceivableID,
				Debit:     input.Amount,
				Credit:    0,
				Notes:     strPtr(fmt.Sprintf("Accounts receivable - %s", input.TenantName)),
			},
			{
				AccountID: accounts.RentalIncomeID,
				Debit:     0,
				Credit:    input.Amount,
				Notes:     strPtr(fmt.Sprintf("Revenue recognized: %s", input.Description)),
			},
		},
	})
	if err != nil {
		return nil, pkg.InternalServerError("Failed to record invoice in accounting", &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function":  "RecordInvoiceCreated",
				"invoiceId": input.InvoiceID,
			},
		})
	}

	return entry, nil
}

// RecordInvoicePayment records cash receipt for a previously invoiced amount.
// This is Step 2 of accrual accounting - called when payment is received.
//
// NOTE: Revenue was already recognized in RecordInvoiceCreated.
// This entry only moves the balance from receivable to cash.
//
// Journal Entry:
//   - Debit: Cash/Bank (Asset increases - money received)
//   - Credit: Accounts Receivable (Asset decreases - debt cleared)
func (s *accountingService) RecordInvoicePayment(
	ctx context.Context,
	input RecordInvoicePaymentInput,
) (*accounting.JournalEntry, error) {
	// Accrual Step 2: Clear receivable when cash is received
	// (Revenue was already recognized when invoice was created)

	accounts := s.appCtx.Config.ChartOfAccounts
	transactionDate := input.PaymentDate.Format(time.RFC3339)
	reference := fmt.Sprintf("INV-PMT-%s", input.PaymentID)

	entry, err := s.client.CreateJournalEntry(ctx, accounting.CreateJournalEntryRequest{
		Status:          string(accounting.JournalEntryStatusPosted),
		Reference:       reference,
		TransactionDate: &transactionDate,
		Metadata: map[string]any{
			"invoice_id":  input.InvoiceID,
			"payment_id":  input.PaymentID,
			"tenant_name": input.TenantName,
			"type":        "INVOICE_PAYMENT",
		},
		Lines: []accounting.CreateJournalEntryLineRequest{
			{
				AccountID: accounts.CashBankAccountID,
				Debit:     input.Amount,
				Credit:    0,
				Notes:     strPtr("Cash received"),
			},
			{
				AccountID: accounts.AccountsReceivableID,
				Debit:     0,
				Credit:    input.Amount,
				Notes:     strPtr(fmt.Sprintf("Receivable cleared - %s", input.TenantName)),
			},
		},
	})
	if err != nil {
		return nil, pkg.InternalServerError("Failed to record invoice payment in accounting", &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function":  "RecordInvoicePayment",
				"paymentId": input.PaymentID,
			},
		})
	}

	return entry, nil
}

// ============================================================================
// Security Deposit Accounting
// ============================================================================

func (s *accountingService) RecordSecurityDepositReceived(
	ctx context.Context,
	input RecordSecurityDepositInput,
) (*accounting.JournalEntry, error) {
	// Create journal entry for security deposit received:
	// Debit: Cash (Asset increases)
	// Credit: Security Deposit Liability (Liability increases)

	accounts := s.appCtx.Config.ChartOfAccounts
	transactionDate := input.ReceivedDate.Format(time.RFC3339)
	reference := fmt.Sprintf("SEC-DEP-%s-%s", input.LeaseID, input.TenantID)

	entry, err := s.client.CreateJournalEntry(ctx, accounting.CreateJournalEntryRequest{
		Status:          string(accounting.JournalEntryStatusPosted),
		Reference:       reference,
		TransactionDate: &transactionDate,
		Metadata: map[string]any{
			"lease_id":    input.LeaseID,
			"tenant_id":   input.TenantID,
			"tenant_name": input.TenantName,
			"unit_name":   input.UnitName,
			"type":        "SECURITY_DEPOSIT",
		},
		Lines: []accounting.CreateJournalEntryLineRequest{
			{
				AccountID: accounts.CashBankAccountID,
				Debit:     input.Amount,
				Credit:    0,
				Notes:     strPtr(fmt.Sprintf("Security deposit received - %s", input.UnitName)),
			},
			{
				AccountID: accounts.SecurityDepositsHeldID,
				Debit:     0,
				Credit:    input.Amount,
				Notes:     strPtr(fmt.Sprintf("Security deposit liability - %s", input.TenantName)),
			},
		},
	})
	if err != nil {
		return nil, pkg.InternalServerError("Failed to record security deposit in accounting", &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "RecordSecurityDepositReceived",
				"leaseId":  input.LeaseID,
			},
		})
	}

	return entry, nil
}

func (s *accountingService) RecordSecurityDepositRefund(
	ctx context.Context,
	input RecordSecurityDepositRefundInput,
) (*accounting.JournalEntry, error) {
	// Create journal entry for security deposit refund:
	// Debit: Security Deposit Liability (Liability decreases)
	// Credit: Cash (for refund amount)
	// Credit: Income (for deductions, if any)

	accounts := s.appCtx.Config.ChartOfAccounts
	totalDeposit := input.RefundAmount + input.DeductionAmount

	lines := []accounting.CreateJournalEntryLineRequest{
		{
			AccountID: accounts.SecurityDepositsHeldID,
			Debit:     totalDeposit,
			Credit:    0,
			Notes:     strPtr("Security deposit liability cleared"),
		},
		{
			AccountID: accounts.CashBankAccountID,
			Debit:     0,
			Credit:    input.RefundAmount,
			Notes:     strPtr(fmt.Sprintf("Cash refunded to %s", input.TenantName)),
		},
	}

	// If there are deductions, credit to rental income (or a specific deduction account)
	if input.DeductionAmount > 0 {
		lines = append(lines, accounting.CreateJournalEntryLineRequest{
			AccountID: accounts.RentalIncomeID,
			Debit:     0,
			Credit:    input.DeductionAmount,
			Notes:     strPtr(fmt.Sprintf("Deposit deduction: %s", input.DeductionNote)),
		})
	}

	transactionDate := input.RefundDate.Format(time.RFC3339)
	reference := fmt.Sprintf("SEC-DEP-REF-%s-%s", input.LeaseID, input.TenantID)

	entry, err := s.client.CreateJournalEntry(ctx, accounting.CreateJournalEntryRequest{
		Status:          string(accounting.JournalEntryStatusPosted),
		Reference:       reference,
		TransactionDate: &transactionDate,
		Metadata: map[string]any{
			"lease_id":       input.LeaseID,
			"tenant_id":      input.TenantID,
			"tenant_name":    input.TenantName,
			"refund_amount":  input.RefundAmount,
			"deduction":      input.DeductionAmount,
			"deduction_note": input.DeductionNote,
			"type":           "SECURITY_DEPOSIT_REFUND",
		},
		Lines: lines,
	})
	if err != nil {
		return nil, pkg.InternalServerError(
			"Failed to record security deposit refund in accounting",
			&pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "RecordSecurityDepositRefund",
					"leaseId":  input.LeaseID,
				},
			},
		)
	}

	return entry, nil
}

// ============================================================================
// Helpers
// ============================================================================

func strPtr(s string) *string {
	return &s
}
