package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddLeaseAgreementDocument,
// adds lease_agreement_document_id to document_signatures,
// and makes lease_agreement_document_url nullable on leases.
func AddLeaseAgreementDocument() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202606290001_ADD_LEASE_AGREEMENT_DOCUMENT",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`
				ALTER TABLE document_signatures
				ADD COLUMN IF NOT EXISTS lease_agreement_document_id UUID
			`).Error; err != nil {
				return err
			}
			return db.Exec(`
				ALTER TABLE leases
				ALTER COLUMN lease_agreement_document_url DROP NOT NULL
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(`
				ALTER TABLE document_signatures
				DROP COLUMN IF EXISTS lease_agreement_document_id
			`).Error; err != nil {
				return err
			}
			return db.Exec(`
				ALTER TABLE leases
				ALTER COLUMN lease_agreement_document_url SET NOT NULL
			`).Error
		},
	}
}
