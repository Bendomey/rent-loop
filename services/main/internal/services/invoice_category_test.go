package services

import (
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/config"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

func testAccounts() config.IChartOfAccounts {
	return config.IChartOfAccounts{
		CashBankAccountID:           "cash",
		AccountsReceivableID:        "ar",
		AccountsPayableID:           "ap",
		MaintenanceReimbursementID:  "maint-reimb",
		MaintenanceExpenseID:        "maint-exp",
		PropertyManagementExpenseID: "pm-exp",
		RentalIncomeID:              "rent-income",
		TenantConcessionsID:         "concessions",
		SecurityDepositsHeldID:      "deposits",
	}
}

func TestCounterpartAccountForMaintenanceCharge(t *testing.T) {
	line := models.InvoiceLineItem{Category: "MAINTENANCE_CHARGE"}
	got := counterpartAccountFor(line, testAccounts(), true)
	if got != "maint-reimb" {
		t.Errorf("got %q, want maint-reimb — a maintenance recharge is reimbursement income", got)
	}
}

// The same account in both directions is what makes a refund a genuine
// reversal rather than an unrelated second posting.
func TestCounterpartAccountForMaintenanceChargeOutbound(t *testing.T) {
	line := models.InvoiceLineItem{Category: "MAINTENANCE_CHARGE"}
	got := counterpartAccountFor(line, testAccounts(), false)
	if got != "maint-reimb" {
		t.Errorf("got %q, want maint-reimb on the outbound side too", got)
	}
}

func expenseInvoice() *models.Invoice {
	return &models.Invoice{
		Code:        "INV-2609-TEST",
		PayerType:   "PROPERTY_OWNER",
		PayeeType:   "EXTERNAL",
		ContextType: "EXPENSE",
		TotalAmount: 30000,
		Currency:    "GHS",
	}
}

// Issuing a bill the landlord received creates the debt. It must never touch
// Accounts Receivable — nobody owes the landlord anything here.
func TestExpenseInvoiceIssuancePostsPayable(t *testing.T) {
	lines := buildJournalEntryForInvoice(expenseInvoice(), testAccounts())
	if len(lines) != 2 {
		t.Fatalf("got %d lines, want 2", len(lines))
	}
	if lines[0].AccountID != "maint-exp" || lines[0].Debit != 30000 {
		t.Errorf("line 0 = %+v, want debit 30000 to maint-exp", lines[0])
	}
	if lines[1].AccountID != "ap" || lines[1].Credit != 30000 {
		t.Errorf("line 1 = %+v, want credit 30000 to ap", lines[1])
	}
}

func TestExpenseInvoicePaymentClearsPayable(t *testing.T) {
	lines := buildPaymentJournalLines(expenseInvoice(), 30000, testAccounts())
	if len(lines) != 2 {
		t.Fatalf("got %d lines, want 2", len(lines))
	}
	if lines[0].AccountID != "ap" || lines[0].Debit != 30000 {
		t.Errorf("line 0 = %+v, want debit 30000 to ap", lines[0])
	}
	if lines[1].AccountID != "cash" || lines[1].Credit != 30000 {
		t.Errorf("line 1 = %+v, want credit 30000 to cash", lines[1])
	}
}

// A part payment clears only what it covers.
func TestExpenseInvoicePartialPayment(t *testing.T) {
	lines := buildPaymentJournalLines(expenseInvoice(), 10000, testAccounts())
	if lines[0].AccountID != "ap" || lines[0].Debit != 10000 {
		t.Errorf("line 0 = %+v, want debit 10000 to ap", lines[0])
	}
	if lines[1].AccountID != "cash" || lines[1].Credit != 10000 {
		t.Errorf("line 1 = %+v, want credit 10000 to cash", lines[1])
	}
}

// Issue then pay in full nets to the single entry the old model posted
// directly, which is why migrated rows need no reversing entry.
func TestExpenseIssueThenPayNetsToExpenseOverCash(t *testing.T) {
	issue := buildJournalEntryForInvoice(expenseInvoice(), testAccounts())
	pay := buildPaymentJournalLines(expenseInvoice(), 30000, testAccounts())

	net := map[string]int64{}
	for _, l := range append(issue, pay...) {
		net[l.AccountID] += l.Debit - l.Credit
	}
	if net["ap"] != 0 {
		t.Errorf("accounts payable nets to %d, want 0", net["ap"])
	}
	if net["maint-exp"] != 30000 {
		t.Errorf("maintenance expense nets to %d, want 30000", net["maint-exp"])
	}
	if net["cash"] != -30000 {
		t.Errorf("cash nets to %d, want -30000", net["cash"])
	}
}

func expenseInvoiceWithCategory(category string) *models.Invoice {
	invoice := expenseInvoice()
	metadata, err := lib.InterfaceToJSON(map[string]any{expenseCategoryMetadataKey: category})
	if err != nil {
		panic(err)
	}
	invoice.LineItems = []models.InvoiceLineItem{{
		Label:       "Monthly management fee",
		Category:    "MAINTENANCE_FEE",
		TotalAmount: 30000,
		Metadata:    metadata,
	}}
	return invoice
}

func TestExpenseJournalRoutesManagementSeparately(t *testing.T) {
	lines := buildJournalEntryForInvoice(expenseInvoiceWithCategory("MANAGEMENT"), testAccounts())
	if lines[0].AccountID != "pm-exp" {
		t.Errorf("got %q, want pm-exp — management is not maintenance", lines[0].AccountID)
	}
}

func TestExpenseJournalRoutesEverythingElseToMaintenance(t *testing.T) {
	for _, category := range []string{"REPAIRS", "UTILITIES", "INSURANCE", "LANDSCAPING", "SECURITY", "OTHER"} {
		lines := buildJournalEntryForInvoice(expenseInvoiceWithCategory(category), testAccounts())
		if lines[0].AccountID != "maint-exp" {
			t.Errorf("%s: got %q, want maint-exp", category, lines[0].AccountID)
		}
	}
}

// An invoice raised before this routing existed carries no category. It must
// keep debiting maintenance, which is where it already sits.
func TestExpenseJournalDefaultsToMaintenanceWithoutMetadata(t *testing.T) {
	lines := buildJournalEntryForInvoice(expenseInvoice(), testAccounts())
	if lines[0].AccountID != "maint-exp" {
		t.Errorf("got %q, want maint-exp", lines[0].AccountID)
	}
}

// Issuance and its reversal must debit the same account, or voiding would
// leave both entries standing against different accounts.
func TestExpenseVoidReversesTheSameAccount(t *testing.T) {
	invoice := expenseInvoiceWithCategory("MANAGEMENT")
	original := buildJournalEntryForInvoice(invoice, testAccounts())
	reversed := buildReversingJournalEntry(original)
	if reversed[0].AccountID != original[0].AccountID {
		t.Errorf("reversal hits %q, issuance hit %q", reversed[0].AccountID, original[0].AccountID)
	}
	if reversed[0].Credit != original[0].Debit {
		t.Errorf("reversal credit %d, issuance debit %d", reversed[0].Credit, original[0].Debit)
	}
}
