package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputPaymentAccount struct {
	ID         string          `json:"id"                   example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b" format:"uuid"      description:"Unique identifier for the payment account"`
	OwnerType  string          `json:"owner_type"           example:"PROPERTY_OWNER"                                          description:"Type of owner (PROPERTY_OWNER, RENTLOOP, SYSTEM)"`
	ClientID   *string         `json:"client_id,omitempty"  example:"b50874ee-1a70-436e-ba24-572078895982"                    description:"The ID of the client"`
	Client     OutputClient    `json:"client,omitempty"`
	Rail       string          `json:"rail"                 example:"MOMO"                                                    description:"Payment rail (MOMO, BANK_TRANSFER, CARD, OFFLINE)"`
	Provider   *string         `json:"provider,omitempty"   example:"MTN"                                                     description:"Payment provider"`
	Identifier *string         `json:"identifier,omitempty" example:"0241234567"                                              description:"Account identifier"`
	Metadata   *map[string]any `json:"metadata,omitempty"                                                                     description:"Additional metadata"`
	IsDefault  bool            `json:"is_default"           example:"false"                                                   description:"Whether this is the default payment account"`
	Status     string          `json:"status"               example:"ACTIVE"                                                  description:"Account status (ACTIVE, DISABLED)"`
	CreatedAt  time.Time       `json:"created_at"           example:"2023-01-01T00:00:00Z"                 format:"date-time" description:"Timestamp when the account was created"`
	UpdatedAt  time.Time       `json:"updated_at"           example:"2023-01-01T00:00:00Z"                 format:"date-time" description:"Timestamp when the account was last updated"`
}

func DBPaymentAccountToRest(i *models.PaymentAccount) interface{} {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]interface{}{
		"id":         i.ID.String(),
		"owner_type": i.OwnerType,
		"client_id":  i.ClientID,
		"client":     DBClientToRestClient(i.Client),
		"rail":       i.Rail,
		"provider":   i.Provider,
		"identifier": i.Identifier,
		"metadata":   i.Metadata,
		"is_default": i.IsDefault,
		"status":     i.Status,
		"created_at": i.CreatedAt,
		"updated_at": i.UpdatedAt,
	}

	return data
}
