package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddMaintenanceRequestAssets replaces the single unit_id foreign key on
// maintenance requests with a maintenance_request_assets join table, and
// denormalizes property_id onto the request so property scoping and client-user
// access control do not have to reach through units on every query.
func AddMaintenanceRequestAssets() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608010001_ADD_MAINTENANCE_REQUEST_ASSETS",
		Migrate: func(db *gorm.DB) error {
			return db.Transaction(func(tx *gorm.DB) error {
				statements := []string{
					`CREATE TABLE IF NOT EXISTS maintenance_request_assets (
						id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
						created_at TIMESTAMPTZ,
						updated_at TIMESTAMPTZ,
						deleted_at TIMESTAMPTZ,
						maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id),
						asset_type TEXT NOT NULL,
						unit_id UUID REFERENCES units(id),
						property_block_id UUID REFERENCES property_blocks(id)
					)`,

					`CREATE INDEX IF NOT EXISTS idx_mra_request
						ON maintenance_request_assets (maintenance_request_id)`,
					`CREATE INDEX IF NOT EXISTS idx_mra_asset_type
						ON maintenance_request_assets (asset_type)`,
					`CREATE INDEX IF NOT EXISTS idx_mra_deleted_at
						ON maintenance_request_assets (deleted_at)`,

					// The Go type cannot express "exactly one FK, matching the
					// discriminator", so the database enforces it.
					`ALTER TABLE maintenance_request_assets
						DROP CONSTRAINT IF EXISTS chk_mra_asset_type`,
					`ALTER TABLE maintenance_request_assets
						ADD CONSTRAINT chk_mra_asset_type CHECK (
							(asset_type = 'UNIT'  AND unit_id IS NOT NULL AND property_block_id IS NULL)
							OR
							(asset_type = 'BLOCK' AND property_block_id IS NOT NULL AND unit_id IS NULL)
						)`,

					// Partial so soft-deleted rows do not block re-adding an
					// asset, and so each index only covers its own asset type.
					`CREATE UNIQUE INDEX IF NOT EXISTS idx_mra_request_unit
						ON maintenance_request_assets (maintenance_request_id, unit_id)
						WHERE unit_id IS NOT NULL AND deleted_at IS NULL`,
					`CREATE UNIQUE INDEX IF NOT EXISTS idx_mra_request_block
						ON maintenance_request_assets (maintenance_request_id, property_block_id)
						WHERE property_block_id IS NOT NULL AND deleted_at IS NULL`,

					`ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS property_id UUID`,

					// Backfill: one UNIT asset per existing request.
					`INSERT INTO maintenance_request_assets
						(id, created_at, updated_at, maintenance_request_id, asset_type, unit_id)
					 SELECT uuid_generate_v4(), NOW(), NOW(), mr.id, 'UNIT', mr.unit_id
					 FROM maintenance_requests mr
					 WHERE mr.unit_id IS NOT NULL
					   AND NOT EXISTS (
						 SELECT 1 FROM maintenance_request_assets a
						 WHERE a.maintenance_request_id = mr.id AND a.unit_id = mr.unit_id
					   )`,

					`UPDATE maintenance_requests mr
					 SET property_id = u.property_id
					 FROM units u
					 WHERE u.id = mr.unit_id AND mr.property_id IS NULL`,

					`ALTER TABLE maintenance_requests ALTER COLUMN property_id SET NOT NULL`,
					`CREATE INDEX IF NOT EXISTS idx_mr_property_id
						ON maintenance_requests (property_id)`,

					`ALTER TABLE maintenance_requests DROP COLUMN IF EXISTS unit_id`,
				}

				for _, statement := range statements {
					if err := tx.Exec(statement).Error; err != nil {
						return err
					}
				}
				return nil
			})
		},
		Rollback: func(db *gorm.DB) error {
			// Lossy by design: a genuinely multi-asset request collapses back to
			// its first unit, and a block-only request is left without a unit.
			// This exists for local rollback, not production reversal.
			return db.Transaction(func(tx *gorm.DB) error {
				statements := []string{
					`ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS unit_id UUID`,
					`UPDATE maintenance_requests mr
					 SET unit_id = (
						 SELECT a.unit_id FROM maintenance_request_assets a
						 WHERE a.maintenance_request_id = mr.id
						   AND a.asset_type = 'UNIT'
						   AND a.deleted_at IS NULL
						 ORDER BY a.created_at
						 LIMIT 1
					 )`,
					`DROP TABLE IF EXISTS maintenance_request_assets`,
					`DROP INDEX IF EXISTS idx_mr_property_id`,
					`ALTER TABLE maintenance_requests DROP COLUMN IF EXISTS property_id`,
				}

				for _, statement := range statements {
					if err := tx.Exec(statement).Error; err != nil {
						return err
					}
				}
				return nil
			})
		},
	}
}
