package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputPayment struct {
	ID        string        `json:"id"                example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b" format:"uuid" description:"Unique identifier for the payment"`
	InvoiceID string        `json:"invoice_id"        example:"b50874ee-1a70-436e-ba24-572078895982"               description:"The ID of the invoice"`
	Invoice   OutputInvoice `json:"invoice,omitempty"`

	Rail     string  `json:"rail"               example:"OFFLINE" description:"Payment rail (MOMO, BANK_TRANSFER, CARD, OFFLINE)"`
	Provider *string `json:"provider,omitempty" example:"CASH"    description:"Payment provider"`

	Amount   int64  `json:"amount"   example:"100000" description:"Payment amount in smallest currency unit"`
	Currency string `json:"currency" example:"GHS"    description:"Currency code"`

	Reference *string `json:"reference,omitempty" example:"TXN123456" description:"Unique reference from payment processor"`

	Status       string     `json:"status"                  example:"PENDING"              description:"Payment status (PENDING, SUCCESSFUL, FAILED)"`
	SuccessfulAt *time.Time `json:"successful_at,omitempty" example:"2024-06-20T10:00:00Z" description:"Timestamp when payment was successful"`
	FailedAt     *time.Time `json:"failed_at,omitempty"     example:"2024-06-20T10:00:00Z" description:"Timestamp when payment failed"`

	Metadata *map[string]any `json:"metadata,omitempty" description:"Additional metadata"`

	CreatedAt time.Time `json:"created_at" example:"2023-01-01T00:00:00Z" format:"date-time" description:"Timestamp when the payment was created"`
	UpdatedAt time.Time `json:"updated_at" example:"2023-01-01T00:00:00Z" format:"date-time" description:"Timestamp when the payment was last updated"`
}

func DBPaymentToRest(p *models.Payment) interface{} {
	if p == nil || p.ID == uuid.Nil {
		return nil
	}

	data := map[string]interface{}{
		"id":            p.ID.String(),
		"invoice_id":    p.InvoiceID,
		"invoice":       DBInvoiceToRest(&p.Invoice),
		"rail":          p.Rail,
		"provider":      p.Provider,
		"amount":        p.Amount,
		"currency":      p.Currency,
		"reference":     p.Reference,
		"status":        p.Status,
		"successful_at": p.SuccessfulAt,
		"failed_at":     p.FailedAt,
		"metadata":      p.Metadata,
		"created_at":    p.CreatedAt,
		"updated_at":    p.UpdatedAt,
	}

	return data
}

func DBPaymentsToRest(payments *[]models.Payment) []interface{} {
	if payments == nil {
		return []interface{}{}
	}

	result := make([]interface{}, len(*payments))
	for i, p := range *payments {
		result[i] = DBPaymentToRest(&p)
	}
	return result
}
