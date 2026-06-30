package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// FixLADLeaseIDPartialUniqueIndex replaces the full unique index on
// lease_agreement_documents.lease_id with a partial one that excludes
// soft-deleted rows, so a new LAD can be created after the previous one
// is soft-deleted.
func FixLADLeaseIDPartialUniqueIndex() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202506300001_FIX_LAD_LEASE_ID_PARTIAL_UNIQUE_INDEX",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`
				DROP INDEX IF EXISTS idx_lease_agreement_documents_lease_id
			`).Error; err != nil {
				return err
			}
			return db.Exec(`
				CREATE UNIQUE INDEX IF NOT EXISTS idx_lad_lease_id_active
				ON lease_agreement_documents (lease_id)
				WHERE deleted_at IS NULL
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(`DROP INDEX IF EXISTS idx_lad_lease_id_active`).Error; err != nil {
				return err
			}
			return db.Exec(`
				CREATE UNIQUE INDEX IF NOT EXISTS idx_lease_agreement_documents_lease_id
				ON lease_agreement_documents (lease_id)
			`).Error
		},
	}
}
