package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

type OutputExpense struct {
	ID                          string    `json:"id"`
	Code                        string    `json:"code"`
	ContextType                 string    `json:"context_type"`
	ContextMaintenanceRequestID string    `json:"context_maintenance_request_id"`
	Description                 string    `json:"description"`
	Amount                      float64   `json:"amount"`
	Currency                    string    `json:"currency"`
	CreatedByClientUserID       *string   `json:"created_by_client_user_id,omitempty"`
	CreatedAt                   time.Time `json:"created_at"`
	UpdatedAt                   time.Time `json:"updated_at"`
}

// DBExpenseToRest transforms an Expense model to REST.
func DBExpenseToRest(e *models.Expense) any {
	if e == nil {
		return nil
	}

	invoices := make([]any, len(e.Invoices))

	for i := range e.Invoices {
		invoices[i] = DBInvoiceToRest(&e.Invoices[i])
	}

	return map[string]any{
		"id":                             e.ID.String(),
		"code":                           e.Code,
		"context_type":                   e.ContextType,
		"context_maintenance_request_id": e.ContextMaintenanceRequestID,
		"description":                    e.Description,
		"amount":                         e.Amount,
		"currency":                       e.Currency,
		"invoices":                       invoices,
		"created_by_client_user_id":      e.CreatedByClientUserID,
		"created_at":                     e.CreatedAt,
		"updated_at":                     e.UpdatedAt,
	}
}
