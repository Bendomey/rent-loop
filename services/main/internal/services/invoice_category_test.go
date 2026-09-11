package services

import (
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/config"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

func testAccounts() config.IChartOfAccounts {
	return config.IChartOfAccounts{
		CashBankAccountID:          "cash",
		AccountsReceivableID:       "ar",
		AccountsPayableID:          "ap",
		MaintenanceReimbursementID: "maint-reimb",
		MaintenanceExpenseID:       "maint-exp",
		RentalIncomeID:             "rent-income",
		TenantConcessionsID:        "concessions",
		SecurityDepositsHeldID:     "deposits",
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
