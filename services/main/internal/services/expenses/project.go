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
