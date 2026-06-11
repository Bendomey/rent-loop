package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddExchangeRatesTable() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202606110003_ADD_EXCHANGE_RATES_TABLE",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`
				CREATE TABLE IF NOT EXISTS exchange_rates (
					id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
					base_currency VARCHAR(10) NOT NULL,
					quote_currency VARCHAR(10) NOT NULL,
					rate DOUBLE PRECISION NOT NULL,
					effective_date DATE NOT NULL,
					created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
					updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
					deleted_at TIMESTAMPTZ,
					CONSTRAINT idx_exchange_rate_unique UNIQUE (base_currency, quote_currency, effective_date)
				)
			`).Error; err != nil {
				return err
			}
			return db.Exec(
				`CREATE INDEX IF NOT EXISTS idx_exchange_rates_deleted_at ON exchange_rates (deleted_at)`,
			).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`DROP TABLE IF EXISTS exchange_rates`).Error
		},
	}
}
