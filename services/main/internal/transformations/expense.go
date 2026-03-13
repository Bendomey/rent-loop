package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

type OutputExpense struct {
	ID                          string         `json:"id"`
	ContextType                 string         `json:"context_type"`
	ContextMaintenanceRequestID string         `json:"context_maintenance_request_id"`
	Description                 string         `json:"description"`
	Amount                      float64        `json:"amount"`
	Currency                    string         `json:"currency"`
	PaidBy                      string         `json:"paid_by"`
	BillableToTenant            bool           `json:"billable_to_tenant"`
	InvoiceID                   *string        `json:"invoice_id,omitempty"`
	Invoice                     *OutputInvoice `json:"invoice,omitempty"`
	CreatedByClientUserID       *string        `json:"created_by_client_user_id,omitempty"`
	CreatedAt                   time.Time      `json:"created_at"`
	UpdatedAt                   time.Time      `json:"updated_at"`
}

// DBExpenseToRest transforms an Expense model to REST.
func DBExpenseToRest(e *models.Expense) any {
	if e == nil {
		return nil
	}
	return map[string]any{
		"id":                             e.ID.String(),
		"context_type":                   e.ContextType,
		"context_maintenance_request_id": e.ContextMaintenanceRequestID,
		"description":                    e.Description,
		"amount":                         e.Amount,
		"currency":                       e.Currency,
		"paid_by":                        e.PaidBy,
		"billable_to_tenant":             e.BillableToTenant,
		"invoice_id":                     e.InvoiceID,
		"invoice":                        DBInvoiceToRest(e.Invoice),
		"created_by_client_user_id":      e.CreatedByClientUserID,
		"created_at":                     e.CreatedAt,
		"updated_at":                     e.UpdatedAt,
	}
}
