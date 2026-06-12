package models

import (
	"time"

	"github.com/shopspring/decimal"
)

// ExchangeRate stores one USD-base rate per quote currency per day.
// Base currency is always USD (OXR free-tier constraint).
// The unique index (base_currency, quote_currency, effective_date) prevents duplicates.
type ExchangeRate struct {
	BaseModelSoftDelete
	BaseCurrency  string          `gorm:"not null;index:idx_exchange_rate_unique,unique"`
	QuoteCurrency string          `gorm:"not null;index:idx_exchange_rate_unique,unique"`
	Rate          decimal.Decimal `gorm:"not null;type:numeric(18,9)"`
	EffectiveDate time.Time       `gorm:"not null;type:date;index:idx_exchange_rate_unique,unique"`
}
