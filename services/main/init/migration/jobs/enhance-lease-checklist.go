package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// EnhanceLeaseChecklist adds the status, check_in_checklist_id, submitted_at, and round
// columns to lease_checklists, and notes + photos to lease_checklist_items.
// New tables (lease_checklist_acknowledgments, checklist_templates, checklist_template_items)
// are created automatically by AutoMigrate.
func EnhanceLeaseChecklist() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202603180001_ENHANCE_LEASE_CHECKLIST",
		Migrate: func(tx *gorm.DB) error {
			if err := tx.Exec(`ALTER TABLE lease_checklists ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'`).Error; err != nil {
				return err
			}
			if err := tx.Exec(`ALTER TABLE lease_checklists ADD COLUMN IF NOT EXISTS check_in_checklist_id UUID REFERENCES lease_checklists(id)`).Error; err != nil {
				return err
			}
			if err := tx.Exec(`ALTER TABLE lease_checklists ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ`).Error; err != nil {
				return err
			}
			if err := tx.Exec(`ALTER TABLE lease_checklists ADD COLUMN IF NOT EXISTS round INTEGER NOT NULL DEFAULT 1`).Error; err != nil {
				return err
			}
			if err := tx.Exec(`ALTER TABLE lease_checklist_items ADD COLUMN IF NOT EXISTS notes TEXT`).Error; err != nil {
				return err
			}
			if err := tx.Exec(`ALTER TABLE lease_checklist_items ADD COLUMN IF NOT EXISTS photos TEXT[]`).Error; err != nil {
				return err
			}
			return nil
		},
		Rollback: func(tx *gorm.DB) error {
			if err := tx.Exec(`ALTER TABLE lease_checklist_items DROP COLUMN IF EXISTS notes`).Error; err != nil {
				return err
			}
			if err := tx.Exec(`ALTER TABLE lease_checklist_items DROP COLUMN IF EXISTS photos`).Error; err != nil {
				return err
			}
			if err := tx.Exec(`ALTER TABLE lease_checklists DROP COLUMN IF EXISTS round`).Error; err != nil {
				return err
			}
			if err := tx.Exec(`ALTER TABLE lease_checklists DROP COLUMN IF EXISTS submitted_at`).Error; err != nil {
				return err
			}
			if err := tx.Exec(`ALTER TABLE lease_checklists DROP COLUMN IF EXISTS check_in_checklist_id`).Error; err != nil {
				return err
			}
			if err := tx.Exec(`ALTER TABLE lease_checklists DROP COLUMN IF EXISTS status`).Error; err != nil {
				return err
			}
			return nil
		},
	}
}
