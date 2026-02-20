package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/gofrs/uuid"
)

type OutputInvoice struct {
	ID        string `json:"id"         example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Code      string `json:"code"       example:"INV-2024-0001"`
	PayerType string `json:"payer_type" example:"TENANT"`

	PayerClientID *string       `json:"payer_client_id,omitempty" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	PayerClient   *OutputClient `json:"payer_client,omitempty"`

	PayerPropertyID *string         `json:"payer_property_id,omitempty" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	PayerProperty   *OutputProperty `json:"payer_property,omitempty"`

	PayerTenantID *string       `json:"payer_tenant_id,omitempty" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	PayerTenant   *OutputTenant `json:"payer_tenant,omitempty"`

	PayeeType     string        `json:"payee_type"                example:"PROPERTY_OWNER"`
	PayeeClientID *string       `json:"payee_client_id,omitempty" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	PayeeClient   *OutputClient `json:"payee_client,omitempty"`

	ContextType string `json:"context_type" example:"LEASE_RENT"`

	ContextTenantApplicationID *string                       `json:"context_tenant_application_id,omitempty" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	ContextTenantApplication   *OutputAdminTenantApplication `json:"context_tenant_application,omitempty"`

	ContextLeaseID *string     `json:"context_lease_id,omitempty" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	ContextLease   map[any]any `json:"context_lease,omitempty"`

	ContextMaintenanceRequestID *string `json:"context_maintenance_request_id,omitempty" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`

	TotalAmount int64  `json:"total_amount" example:"100000"`
	Taxes       int64  `json:"taxes"        example:"0"`
	SubTotal    int64  `json:"sub_total"    example:"100000"`
	Currency    string `json:"currency"     example:"GHS"`
	Status      string `json:"status"       example:"DRAFT"`

	DueDate  *time.Time `json:"due_date,omitempty"  example:"2024-07-01T00:00:00Z"`
	IssuedAt *time.Time `json:"issued_at,omitempty" example:"2024-06-15T00:00:00Z"`
	PaidAt   *time.Time `json:"paid_at,omitempty"   example:"2024-06-20T00:00:00Z"`
	VoidedAt *time.Time `json:"voided_at,omitempty" example:"2024-06-25T00:00:00Z"`

	AllowedPaymentRails []string `json:"allowed_payment_rails" example:"MOMO,BANK"`

	LineItems []OutputInvoiceLineItem `json:"line_items"`

	CreatedAt time.Time `json:"created_at" example:"2024-06-01T09:00:00Z"`
	UpdatedAt time.Time `json:"updated_at" example:"2024-06-10T09:00:00Z"`
}

func DBInvoiceToRest(services services.Services, i *models.Invoice) (any, error) {
	if i == nil || i.ID == uuid.Nil {
		return nil, nil
	}

	tenantApplication, tenantApplicationErr := DBAdminTenantApplicationToRest(services, i.ContextTenantApplication)
	if tenantApplicationErr != nil {
		return nil, tenantApplicationErr
	}

	lease, leaseErr := DBAdminLeaseToRest(services, i.ContextLease)
	if leaseErr != nil {
		return nil, leaseErr
	}

	data := map[string]any{
		"id":                             i.ID,
		"code":                           i.Code,
		"payer_type":                     i.PayerType,
		"payer_client_id":                i.PayerClientID,
		"payer_client":                   DBClientToRestClient(i.PayerClient),
		"payer_property_id":              i.PayerPropertyID,
		"payer_property":                 DBPropertyToRest(i.PayerProperty),
		"payer_tenant_id":                i.PayerTenantID,
		"payer_tenant":                   DBTenantToRest(i.PayerTenant),
		"payee_type":                     i.PayeeType,
		"payee_client_id":                i.PayeeClientID,
		"payee_client":                   DBClientToRestClient(i.PayeeClient),
		"context_type":                   i.ContextType,
		"context_tenant_application_id":  i.ContextTenantApplicationID,
		"context_tenant_application":     tenantApplication,
		"context_lease_id":               i.ContextLeaseID,
		"context_lease":                  lease,
		"context_maintenance_request_id": i.ContextMaintenanceRequestID,
		"total_amount":                   i.TotalAmount,
		"taxes":                          i.Taxes,
		"sub_total":                      i.SubTotal,
		"currency":                       i.Currency,
		"status":                         i.Status,
		"due_date":                       i.DueDate,
		"issued_at":                      i.IssuedAt,
		"paid_at":                        i.PaidAt,
		"voided_at":                      i.VoidedAt,
		"allowed_payment_rails":          []string(i.AllowedPaymentRails),
		"line_items":                     DBInvoiceLineItemsToRest(i.LineItems),
		"created_at":                     i.CreatedAt,
		"updated_at":                     i.UpdatedAt,
	}

	return data, nil
}

func DBInvoiceLineItemsToRest(items []models.InvoiceLineItem) []any {
	if items == nil {
		return []any{}
	}

	result := make([]any, len(items))
	for i, item := range items {
		result[i] = DBInvoiceLineItemToRest(&item)
	}

	return result
}

type OutputInvoiceLineItem struct {
	ID          string `json:"id"                 example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	InvoiceID   string `json:"invoice_id"         example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Label       string `json:"label"              example:"January Rent"`
	Category    string `json:"category"           example:"RENT"`
	Quantity    int64  `json:"quantity"           example:"1"`
	UnitAmount  int64  `json:"unit_amount"        example:"100000"`
	TotalAmount int64  `json:"total_amount"       example:"100000"`
	Currency    string `json:"currency"           example:"GHS"`
	Metadata    any    `json:"metadata,omitempty"`

	CreatedAt time.Time `json:"created_at" example:"2024-06-01T09:00:00Z"`
	UpdatedAt time.Time `json:"updated_at" example:"2024-06-10T09:00:00Z"`
}

func DBInvoiceLineItemToRest(i *models.InvoiceLineItem) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":           i.ID,
		"invoice_id":   i.InvoiceID,
		"label":        i.Label,
		"category":     i.Category,
		"quantity":     i.Quantity,
		"unit_amount":  i.UnitAmount,
		"total_amount": i.TotalAmount,
		"currency":     i.Currency,
		"metadata":     i.Metadata,
		"created_at":   i.CreatedAt,
		"updated_at":   i.UpdatedAt,
	}

	return data
}
