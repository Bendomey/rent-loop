package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func ReplacePayerTenantWithPayerLease() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202603310001_REPLACE_PAYER_TENANT_WITH_PAYER_LEASE",
		Migrate: func(db *gorm.DB) error {
			// 1. Add payer_lease_id column
			if err := db.Exec(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payer_lease_id UUID REFERENCES leases(id)`).Error; err != nil {
				return err
			}

			// 2. Backfill: for each invoice with payer_tenant_id set,
			//    find that tenant's lease and set payer_lease_id.
			//    Guarded: column may already be dropped if migration partially ran before.
			if err := db.Exec(`
				DO $$
				BEGIN
					IF EXISTS (
						SELECT 1 FROM information_schema.columns
						WHERE table_name = 'invoices' AND column_name = 'payer_tenant_id'
					) THEN
						UPDATE invoices
						SET payer_lease_id = l.id
						FROM leases l
						WHERE l.tenant_id = invoices.payer_tenant_id
						  AND invoices.payer_tenant_id IS NOT NULL
						  AND l.deleted_at IS NULL;
					END IF;
				END $$;
			`).Error; err != nil {
				return err
			}

			// 3. Drop payer_tenant_id column
			return db.Exec(`ALTER TABLE invoices DROP COLUMN IF EXISTS payer_tenant_id`).Error
		},
		Rollback: func(db *gorm.DB) error {
			// 1. Add back payer_tenant_id column
			if err := db.Exec(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payer_tenant_id UUID REFERENCES tenants(id)`).Error; err != nil {
				return err
			}

			// 2. Backfill backwards: find tenant from lease
			if err := db.Exec(`
				UPDATE invoices
				SET payer_tenant_id = l.tenant_id
				FROM leases l
				WHERE l.id = invoices.payer_lease_id
				  AND invoices.payer_lease_id IS NOT NULL
				  AND l.deleted_at IS NULL
			`).Error; err != nil {
				return err
			}

			// 3. Drop payer_lease_id column
			return db.Exec(`ALTER TABLE invoices DROP COLUMN IF EXISTS payer_lease_id`).Error
		},
	}
}
