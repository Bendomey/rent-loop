package services

import (
	"context"
	"fmt"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/accounting"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

// AccountingService provides business logic for accounting operations
type AccountingService interface {
	// Lease Payment Accounting
	RecordLeasePaymentReceived(ctx context.Context, input RecordLeasePaymentInput) (*accounting.JournalEntry, error)

	// Invoice Accounting
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

type RecordLeasePaymentInput struct {
	LeaseID        string
	LeasePaymentID string
	Amount         int64 // Amount in smallest currency unit (pesewas/cents)
	PaymentDate    time.Time
	TenantName     string
	UnitName       string
}

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
// Lease Payment Accounting
// ============================================================================

func (s *accountingService) RecordLeasePaymentReceived(
	ctx context.Context,
	input RecordLeasePaymentInput,
) (*accounting.JournalEntry, error) {
	// Create journal entry for rent payment:
	// Debit: Cash (Asset increases)
	// Credit: Rent Income (Revenue increases)

	accounts := s.appCtx.Config.ChartOfAccounts
	transactionDate := input.PaymentDate.Format(time.RFC3339)
	reference := fmt.Sprintf("RENT-PMT-%s", input.LeasePaymentID)

	entry, err := s.client.CreateJournalEntry(ctx, accounting.CreateJournalEntryRequest{
		Status:          string(accounting.JournalEntryStatusPosted),
		Reference:       reference,
		TransactionDate: &transactionDate,
		Metadata: map[string]any{
			"lease_id":         input.LeaseID,
			"lease_payment_id": input.LeasePaymentID,
			"tenant_name":      input.TenantName,
			"unit_name":        input.UnitName,
			"type":             "LEASE_PAYMENT",
		},
		Lines: []accounting.CreateJournalEntryLineRequest{
			{
				AccountID: accounts.CashBankAccountID,
				Debit:     input.Amount,
				Credit:    0,
				Notes:     strPtr(fmt.Sprintf("Cash received for rent - %s", input.UnitName)),
			},
			{
				AccountID: accounts.RentalIncomeID,
				Debit:     0,
				Credit:    input.Amount,
				Notes:     strPtr(fmt.Sprintf("Rent income from %s", input.TenantName)),
			},
		},
	})
	if err != nil {
		return nil, pkg.InternalServerError("Failed to record lease payment in accounting", &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function":       "RecordLeasePaymentReceived",
				"leasePaymentId": input.LeasePaymentID,
			},
		})
	}

	return entry, nil
}

// ============================================================================
// Invoice Accounting
// ============================================================================

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

func (s *accountingService) RecordInvoicePayment(
	ctx context.Context,
	input RecordInvoicePaymentInput,
) (*accounting.JournalEntry, error) {
	// Create journal entry for invoice payment:
	// Debit: Cash (Asset increases)
	// Credit: Accounts Receivable (Asset decreases)

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
