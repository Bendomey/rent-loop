package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/services/expenses"
)

type OutputMaintenanceRequestFinancial struct {
	ID                    string    `json:"id"`
	MaintenanceRequestID  string    `json:"maintenance_request_id"`
	PropertyID            string    `json:"property_id"`
	Description           string    `json:"description"`
	Amount                int64     `json:"amount"`
	Currency              string    `json:"currency"`
	SettlementType        string    `json:"settlement_type"`
	Status                string    `json:"status"`
	IsEditable            bool      `json:"is_editable"`
	ChargeInstanceID      *string   `json:"charge_instance_id,omitempty"`
	ExpenseID             *string   `json:"expense_id,omitempty"`
	CreatedByClientUserID string    `json:"created_by_client_user_id"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

// DBMaintenanceRequestFinancialToRest transforms a financial line to REST.
func DBMaintenanceRequestFinancialToRest(f *models.MaintenanceRequestFinancial) any {
	if f == nil {
		return nil
	}

	view := expenses.FinancialStatusView(f)

	var expense any
	if f.Expense != nil {
		expense = DBExpenseToRest(f.Expense)
	}

	var charge any
	if f.ChargeInstance != nil {
		charge = DBChargeInstanceToRest(f.ChargeInstance)
	}

	return map[string]any{
		"id":                        f.ID.String(),
		"maintenance_request_id":    f.MaintenanceRequestID,
		"property_id":               f.PropertyID,
		"description":               f.Description,
		"amount":                    f.Amount,
		"currency":                  f.Currency,
		"settlement_type":           f.SettlementType,
		"status":                    expenses.DeriveFinancialStatus(view),
		"is_editable":               expenses.IsFinancialEditable(view),
		"charge_instance_id":        f.ChargeInstanceID,
		"charge":                    charge,
		"expense_id":                f.ExpenseID,
		"expense":                   expense,
		"created_by_client_user_id": f.CreatedByClientUserID,
		"created_at":                f.CreatedAt,
		"updated_at":                f.UpdatedAt,
	}
}

// DBTenantMaintenanceRequestFinancialToRest is the tenant-facing shape. It
// carries what the tenant is being charged and nothing else: no vendor, no
// expense, no settlement type. A tenant must not be able to learn what the
// landlord paid the plumber.
func DBTenantMaintenanceRequestFinancialToRest(f *models.MaintenanceRequestFinancial) any {
	if f == nil {
		return nil
	}

	return map[string]any{
		"id":                     f.ID.String(),
		"maintenance_request_id": f.MaintenanceRequestID,
		"description":            f.Description,
		"amount":                 f.Amount,
		"currency":               f.Currency,
		"status":                 expenses.DeriveFinancialStatus(expenses.FinancialStatusView(f)),
		"created_at":             f.CreatedAt,
	}
}
