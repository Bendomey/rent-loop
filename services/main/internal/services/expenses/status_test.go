package expenses

import (
	"testing"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

func ts() *time.Time {
	t := time.Date(2026, 9, 10, 0, 0, 0, 0, time.UTC)
	return &t
}

func TestDeriveExpenseStatusVoided(t *testing.T) {
	got := DeriveExpenseStatus(ExpenseView{VoidedAt: ts(), HasInvoice: true, InvoiceStatus: "ISSUED"})
	if got != StatusVoided {
		t.Errorf("got %q, want %q — voiding wins over every other state", got, StatusVoided)
	}
}

// Legacy rows migrated from the old model have no invoice. They posted
// Dr Expense / Cr Cash at creation, so the money had already left.
func TestDeriveExpenseStatusLegacyRowIsSettled(t *testing.T) {
	got := DeriveExpenseStatus(ExpenseView{HasInvoice: false})
	if got != StatusSettled {
		t.Errorf("got %q, want %q — a legacy row's cash already left", got, StatusSettled)
	}
}

func TestDeriveExpenseStatusFromInvoice(t *testing.T) {
	cases := map[string]string{
		"DRAFT":          StatusOutstanding,
		"ISSUED":         StatusOutstanding,
		"PARTIALLY_PAID": StatusPartiallySettled,
		"PAID":           StatusSettled,
		"VOID":           StatusOutstanding,
	}
	for invoiceStatus, want := range cases {
		got := DeriveExpenseStatus(ExpenseView{HasInvoice: true, InvoiceStatus: invoiceStatus})
		if got != want {
			t.Errorf("invoice %s: got %q, want %q", invoiceStatus, got, want)
		}
	}
}

func TestIsExpenseCleanUntilPaid(t *testing.T) {
	if !IsExpenseClean(ExpenseView{HasInvoice: true, InvoiceStatus: "ISSUED"}) {
		t.Error("got dirty, want clean — issued but unpaid is still correctable")
	}
	if IsExpenseClean(ExpenseView{HasInvoice: true, InvoiceStatus: "PARTIALLY_PAID"}) {
		t.Error("got clean, want dirty — money has moved")
	}
	if IsExpenseClean(ExpenseView{HasInvoice: true, InvoiceStatus: "PAID"}) {
		t.Error("got clean, want dirty — money has moved")
	}
	if IsExpenseClean(ExpenseView{VoidedAt: ts()}) {
		t.Error("got clean, want dirty — a voided expense is not editable")
	}
}

// A voided invoice bills nobody, so an expense whose only invoice was voided
// reads as having none rather than as outstanding.
func TestExpenseStatusViewSkipsVoidedInvoices(t *testing.T) {
	expense := &models.Expense{
		Invoices: []models.Invoice{
			{Status: "VOID"},
			{Status: "PAID"},
		},
	}
	view := ExpenseStatusView(expense)
	if !view.HasInvoice || view.InvoiceStatus != "PAID" {
		t.Errorf("got %+v, want the live PAID invoice", view)
	}

	onlyVoided := &models.Expense{Invoices: []models.Invoice{{Status: "VOID"}}}
	if ExpenseStatusView(onlyVoided).HasInvoice {
		t.Error("got HasInvoice, want false — the only invoice was voided")
	}
}

func TestDeriveFinancialStatusRecordOnly(t *testing.T) {
	got := DeriveFinancialStatus(FinancialView{SettlementType: SettlementRecordOnly})
	if got != StatusRecorded {
		t.Errorf("got %q, want %q", got, StatusRecorded)
	}
}

func TestDeriveFinancialStatusMirrorsCharge(t *testing.T) {
	cases := []struct {
		name string
		view ChargeLinkView
		want string
	}{
		{"untouched", ChargeLinkView{}, StatusOutstanding},
		{"invoiced", ChargeLinkView{InvoicedAmount: 20000}, StatusInvoiced},
		{"part settled", ChargeLinkView{InvoicedAmount: 20000, SettledAmount: 5000}, StatusPartiallySettled},
		{"settled", ChargeLinkView{InvoicedAmount: 20000, SettledAmount: 20000}, StatusSettled},
		{"voided", ChargeLinkView{VoidedAt: ts()}, StatusVoided},
	}
	for _, c := range cases {
		link := c.view
		got := DeriveFinancialStatus(
			FinancialView{SettlementType: SettlementTenantCharge, Charge: &link, Amount: 20000},
		)
		if got != c.want {
			t.Errorf("%s: got %q, want %q", c.name, got, c.want)
		}
	}
}

func TestIsFinancialEditable(t *testing.T) {
	if !IsFinancialEditable(FinancialView{SettlementType: SettlementRecordOnly}) {
		t.Error("a record-only line is always editable — it links to nothing")
	}
	clean := ChargeLinkView{}
	if !IsFinancialEditable(FinancialView{SettlementType: SettlementTenantCharge, Charge: &clean}) {
		t.Error("an untouched charge is editable")
	}
	billed := ChargeLinkView{InvoicedAmount: 20000}
	if IsFinancialEditable(FinancialView{SettlementType: SettlementTenantCharge, Charge: &billed}) {
		t.Error("an invoiced charge is frozen — the tenant has seen the figure")
	}
	paid := ExpenseView{HasInvoice: true, InvoiceStatus: "PAID"}
	if IsFinancialEditable(FinancialView{SettlementType: SettlementVendorExpense, Expense: &paid}) {
		t.Error("a paid expense is frozen")
	}
}

// A link the type says should be there but is missing must not read as
// editable — a nil link is a broken row, not a clean one.
func TestIsFinancialEditableMissingLinkIsFrozen(t *testing.T) {
	if IsFinancialEditable(FinancialView{SettlementType: SettlementTenantCharge}) {
		t.Error("got editable, want frozen — the charge link is missing")
	}
	if IsFinancialEditable(FinancialView{SettlementType: SettlementVendorExpense}) {
		t.Error("got editable, want frozen — the expense link is missing")
	}
}
