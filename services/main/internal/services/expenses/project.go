package expenses

import "github.com/Bendomey/rent-loop/services/main/internal/models"

// ExpenseStatusView projects the model onto the derivation input. It lives
// beside the rules rather than in the transformation layer so the service and
// the serialiser cannot answer "is this editable?" differently.
//
// Invoices must be preloaded. A voided invoice is skipped: it no longer bills
// anyone, so an expense whose only invoice was voided reads as having none.
func ExpenseStatusView(e *models.Expense) ExpenseView {
	view := ExpenseView{VoidedAt: e.VoidedAt}
	for i := range e.Invoices {
		if e.Invoices[i].Status == "VOID" {
			continue
		}
		view.HasInvoice = true
		view.InvoiceStatus = e.Invoices[i].Status
		break
	}
	return view
}

// FinancialStatusView projects a financial line and whichever link it carries
// onto the derivation input. It lives here for the same reason
// ExpenseStatusView does: the service and the serialiser must not be able to
// answer "is this editable?" differently.
//
// ChargeInstance and Expense (with Expense.Invoices) must be preloaded, or a
// settled line reads as outstanding.
func FinancialStatusView(f *models.MaintenanceRequestFinancial) FinancialView {
	view := FinancialView{
		SettlementType: f.SettlementType,
		Amount:         f.Amount,
	}

	if f.ChargeInstance != nil {
		view.Charge = &ChargeLinkView{
			InvoicedAmount: f.ChargeInstance.InvoicedAmount,
			SettledAmount:  f.ChargeInstance.SettledAmount,
			VoidedAt:       f.ChargeInstance.VoidedAt,
		}
	}

	if f.Expense != nil {
		expenseView := ExpenseStatusView(f.Expense)
		view.Expense = &expenseView
	}

	return view
}
