package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddLeaseTerminationContextFields adds context_lease_termination_id to invoices
// and lease_termination_id to document_signatures.
func AddLeaseTerminationContextFields() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202606270001_ADD_LEASE_TERMINATION_CONTEXT_FIELDS",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`
				ALTER TABLE invoices
				ADD COLUMN IF NOT EXISTS context_lease_termination_id UUID
			`).Error; err != nil {
				return err
			}
			if err := db.Exec(`
				ALTER TABLE document_signatures
				ADD COLUMN IF NOT EXISTS lease_termination_id UUID
			`).Error; err != nil {
				return err
			}
			return db.Exec(`
				ALTER TABLE signing_tokens
				ADD COLUMN IF NOT EXISTS lease_termination_id UUID
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(`
				ALTER TABLE invoices
				DROP COLUMN IF EXISTS context_lease_termination_id
			`).Error; err != nil {
				return err
			}
			if err := db.Exec(`
				ALTER TABLE document_signatures
				DROP COLUMN IF EXISTS lease_termination_id
			`).Error; err != nil {
				return err
			}
			return db.Exec(`
				ALTER TABLE signing_tokens
				DROP COLUMN IF EXISTS lease_termination_id
			`).Error
		},
	}
}
