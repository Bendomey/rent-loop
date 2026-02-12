package models

import "gorm.io/datatypes"

type PaymentAccount struct {
	BaseModelSoftDelete
	OwnerType string `gorm:"not null;"` // PROPERTY_OWNER | RENTLOOP | SYSTEM

	ClientID *string
	Client   *Client

	Rail     string  `gorm:"not null;"` // MOMO | BANK_TRANSFER | CARD | OFFLINE
	Provider *string // MTN | VODAFONE | AIRTELTIGO | PAYSTACK | BANK_API

	Identifier *string // Momo: phone number | Bank: account number | Card: processor customer ID

	// any other info needed.
	Metadata *datatypes.JSON `gorm:"type:jsonb"` // JSON metadata for the payment account

	IsDefault bool   `gorm:"not null;default:false;"`
	Status    string `gorm:"not null;"` // 'ACTIVE' | 'DISABLED'
}
