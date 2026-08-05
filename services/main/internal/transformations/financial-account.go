package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

// DeriveChargeStatus computes a charge instance's status from its amounts.
// The status is deliberately NOT stored: it would be a fourth thing to keep in
// sync with InvoicedAmount, SettledAmount and VoidedAt, and that desync is what
// makes a ledger untrustworthy.
func DeriveChargeStatus(m models.ChargeInstance) string {
	if m.VoidedAt != nil {
		return "VOID"
	}

	settled := absInt64(m.SettledAmount)
	invoiced := absInt64(m.InvoicedAmount)
	total := absInt64(m.Amount)

	switch {
	case total > 0 && settled >= total:
		return "SETTLED"
	case settled > 0:
		return "PARTIALLY_SETTLED"
	case total > 0 && invoiced >= total:
		return "INVOICED"
	case invoiced > 0:
		return "PARTIALLY_INVOICED"
	default:
		return "OUTSTANDING"
	}
}

func absInt64(v int64) int64 {
	if v < 0 {
		return -v
	}
	return v
}

type OutputChargeInstance struct {
	ID                 string     `json:"id"                      example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	FinancialAccountID string     `json:"financial_account_id"`
	Name               string     `json:"name"                    example:"Rent – February 2027"`
	Category           string     `json:"category"                example:"RENT"`
	Amount             int64      `json:"amount"                  example:"100000"`
	Currency           string     `json:"currency"                example:"GHS"`
	DueDate            time.Time  `json:"due_date"`
	PeriodStart        *time.Time `json:"period_start,omitempty"`
	PeriodEnd          *time.Time `json:"period_end,omitempty"`
	InvoicedAmount     int64      `json:"invoiced_amount"         example:"0"`
	SettledAmount      int64      `json:"settled_amount"          example:"0"`
	OutstandingAmount  int64      `json:"outstanding_amount"      example:"100000"`
	Status             string     `json:"status"                  example:"OUTSTANDING"`
	VoidedAt           *time.Time `json:"voided_at,omitempty"`
	VoidedReason       *string    `json:"voided_reason,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

func DBChargeInstanceToRest(m *models.ChargeInstance) *OutputChargeInstance {
	if m == nil {
		return nil
	}

	return &OutputChargeInstance{
		ID:                 m.ID.String(),
		FinancialAccountID: m.FinancialAccountID,
		Name:               m.Name,
		Category:           m.Category,
		Amount:             m.Amount,
		Currency:           m.Currency,
		DueDate:            m.DueDate,
		PeriodStart:        m.PeriodStart,
		PeriodEnd:          m.PeriodEnd,
		InvoicedAmount:     m.InvoicedAmount,
		SettledAmount:      m.SettledAmount,
		OutstandingAmount:  m.Amount - m.SettledAmount,
		Status:             DeriveChargeStatus(*m),
		VoidedAt:           m.VoidedAt,
		VoidedReason:       m.VoidedReason,
		CreatedAt:          m.CreatedAt,
		UpdatedAt:          m.UpdatedAt,
	}
}

type OutputFinancialAccount struct {
	ID                  string     `json:"id"                     example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Code                string     `json:"code"                   example:"FA-2608-A1B2C3"`
	TenantApplicationID string     `json:"tenant_application_id"`
	LeaseID             *string    `json:"lease_id,omitempty"`
	ClientID            *string    `json:"client_id,omitempty"`
	PropertyID          *string    `json:"property_id,omitempty"`
	TenantID            *string    `json:"tenant_id,omitempty"`
	Currency            string     `json:"currency"               example:"GHS"`
	RentBillingCadence  string     `json:"rent_billing_cadence"   example:"EVERY_N_PERIODS"`
	RentBillingInterval int64      `json:"rent_billing_interval"  example:"12"`
	AutoIssueDaysBefore int64      `json:"auto_issue_days_before" example:"5"`
	Status              string     `json:"status"                 example:"ACTIVE"`
	ClosedAt            *time.Time `json:"closed_at,omitempty"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

func DBFinancialAccountToRest(m *models.FinancialAccount) *OutputFinancialAccount {
	if m == nil {
		return nil
	}

	return &OutputFinancialAccount{
		ID:                  m.ID.String(),
		Code:                m.Code,
		TenantApplicationID: m.TenantApplicationID,
		LeaseID:             m.LeaseID,
		ClientID:            m.ClientID,
		PropertyID:          m.PropertyID,
		TenantID:            m.TenantID,
		Currency:            m.Currency,
		RentBillingCadence:  m.RentBillingCadence,
		RentBillingInterval: m.RentBillingInterval,
		AutoIssueDaysBefore: m.AutoIssueDaysBefore,
		Status:              m.Status,
		ClosedAt:            m.ClosedAt,
		CreatedAt:           m.CreatedAt,
		UpdatedAt:           m.UpdatedAt,
	}
}

// OutputTenantApplicationFinancials is the application's financial summary.
//
// It replaces the old `application_payment_invoice` field. An application now
// has a financial account with many charges and any number of invoices, so the
// UI needs the balance rather than "the" invoice:
//
//	charges prepared  ->  financial_account is present
//	fully paid        ->  outstanding_amount == 0
//	part paid         ->  total_settled > 0
type OutputTenantApplicationFinancials struct {
	ID                string `json:"id"                 example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Code              string `json:"code"               example:"FA-2608-A1B2C3"`
	Currency          string `json:"currency"           example:"GHS"`
	TotalCharged      int64  `json:"total_charged"      example:"1300000"`
	TotalSettled      int64  `json:"total_settled"      example:"1300000"`
	OutstandingAmount int64  `json:"outstanding_amount" example:"0"`
	AvailableCredit   int64  `json:"available_credit"   example:"0"`
	ChargeCount       int64  `json:"charge_count"       example:"13"`
	InvoiceCount      int64  `json:"invoice_count"      example:"1"`
}

func DBTenantApplicationFinancialsToRest(
	m *models.TenantApplicationFinancials,
) *OutputTenantApplicationFinancials {
	if m == nil || m.Account == nil {
		return nil
	}

	return &OutputTenantApplicationFinancials{
		ID:                m.Account.ID.String(),
		Code:              m.Account.Code,
		Currency:          m.Account.Currency,
		TotalCharged:      m.TotalCharged,
		TotalSettled:      m.TotalSettled,
		OutstandingAmount: m.OutstandingAmount,
		AvailableCredit:   m.AvailableCredit,
		ChargeCount:       m.ChargeCount,
		InvoiceCount:      m.InvoiceCount,
	}
}
