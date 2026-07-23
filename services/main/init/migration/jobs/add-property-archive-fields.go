package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddPropertyArchiveFields backfills blocks_count and units_count for all
// existing properties by counting their current (non-deleted) blocks and
// units. deleted_by_id is intentionally left NULL for properties archived
// before this migration — there's no reliable way to attribute those after
// the fact; the UI shows a "—" fallback when it's null.
func AddPropertyArchiveFields() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202607230001_ADD_PROPERTY_ARCHIVE_FIELDS",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`
				UPDATE properties SET
					blocks_count = (
						SELECT count(*) FROM property_blocks
						WHERE property_blocks.property_id = properties.id
						  AND property_blocks.deleted_at IS NULL
					),
					units_count = (
						SELECT count(*) FROM units
						WHERE units.property_id = properties.id
						  AND units.deleted_at IS NULL
					)
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`UPDATE properties SET blocks_count = 0, units_count = 0`).Error
		},
	}
}
