package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// DropLegacyFinancialAccountApplicationUnique removes the UNIQUE index that
// still allows only one account per tenant application.
//
// The model no longer asks for it: OriginTenantApplicationID carries a plain
// `index` tag, because a renewal may separate onto its own account and that
// second account originates from the very same application. But AutoMigrate
// never drops an index it did not create, and the Go field was renamed
// (TenantApplicationID -> OriginTenantApplicationID, mapped back with a
// `column:` tag), so GORM saw an entirely new index name and simply added
// idx_financial_accounts_origin_tenant_application_id beside the old one.
// The legacy UNIQUE survived, orphaned but still enforced.
//
// Locally this is invisible: a database built by AutoMigrate from the current
// model never had the unique index in the first place. It only bites on a
// database that predates the rename — which is every deployed environment.
// There, separating a renewal onto its own account fails with SQLSTATE 23505.
func DropLegacyFinancialAccountApplicationUnique() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608190003_DROP_LEGACY_FA_APPLICATION_UNIQUE_INDEX",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(
				`DROP INDEX IF EXISTS idx_financial_accounts_tenant_application_id`,
			).Error
		},
		Rollback: func(db *gorm.DB) error {
			// Only succeeds while no application has more than one account.
			// Once a renewal has separated, the constraint is no longer true
			// of the data and this rollback will refuse — correctly.
			return db.Exec(
				`CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_accounts_tenant_application_id
				 ON financial_accounts (tenant_application_id)`,
			).Error
		},
	}
}
