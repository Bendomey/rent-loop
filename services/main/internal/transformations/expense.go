package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/services/expenses"
)

type OutputExpense struct {
	ID                    string    `json:"id"`
	Code                  string    `json:"code"`
	ContextType           string    `json:"context_type"`
	PropertyID            string    `json:"property_id"`
	Category              string    `json:"category"`
	VendorName            *string   `json:"vendor_name,omitempty"`
	VendorContact         *string   `json:"vendor_contact,omitempty"`
	Description           string    `json:"description"`
	Amount                int64     `json:"amount"`
	Currency              string    `json:"currency"`
	Status                string    `json:"status"`
	IsEditable            bool      `json:"is_editable"`
	InvoiceID             *string   `json:"invoice_id,omitempty"`
	VoidedAt              *string   `json:"voided_at,omitempty"`
	VoidedReason          *string   `json:"voided_reason,omitempty"`
	CreatedByClientUserID string    `json:"created_by_client_user_id"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

// DBExpenseToRest transforms an Expense model to REST.
func DBExpenseToRest(e *models.Expense) any {
	if e == nil {
		return nil
	}

	view := expenses.ExpenseStatusView(e)

	var invoiceID *string
	for i := range e.Invoices {
		if e.Invoices[i].Status != "VOID" {
			id := e.Invoices[i].ID.String()
			invoiceID = &id
			break
		}
	}

	var voidedAt *string
	if e.VoidedAt != nil {
		formatted := e.VoidedAt.Format(time.RFC3339)
		voidedAt = &formatted
	}

	return map[string]any{
		"id":                        e.ID.String(),
		"code":                      e.Code,
		"context_type":              e.ContextType,
		"property_id":               e.PropertyID,
		"category":                  e.Category,
		"vendor_name":               e.VendorName,
		"vendor_contact":            e.VendorContact,
		"description":               e.Description,
		"amount":                    e.Amount,
		"currency":                  e.Currency,
		"status":                    expenses.DeriveExpenseStatus(view),
		"is_editable":               expenses.IsExpenseClean(view),
		"invoice_id":                invoiceID,
		"voided_at":                 voidedAt,
		"voided_reason":             e.VoidedReason,
		"created_by_client_user_id": e.CreatedByClientUserID,
		"created_at":                e.CreatedAt,
		"updated_at":                e.UpdatedAt,
	}
}
