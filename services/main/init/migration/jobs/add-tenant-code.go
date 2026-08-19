package jobs

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddTenantCode creates tenants.code and gives every existing tenant one.
//
// The column stays nullable — it arrived after these rows did, so a tenant
// without a code is a real state rather than a fault, and nothing downstream
// may assume one exists. This job simply means no tenant is left without one
// for want of asking.
//
// Each code is dated from the tenant's own created_at rather than the wall
// clock: TEN-2512-… tells you when that person joined, whereas backfilling
// everyone as TEN-2608-… would throw away the only information the date
// segment carries and imply seventy-six tenants arrived the day of the
// migration.
func AddTenantCode() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608190004_ADD_TENANT_CODE",
		Migrate: func(db *gorm.DB) error {
			statements := []string{
				`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS code TEXT`,
				`CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code)`,
			}

			for _, statement := range statements {
				if err := db.Exec(statement).Error; err != nil {
					return err
				}
			}

			var tenants []models.Tenant

			// Soft-deleted tenants are included deliberately: the unique index
			// covers them too, and a restored tenant with no code would be a
			// puzzle nobody would think to look for.
			if err := db.Unscoped().
				Where("code IS NULL").
				Find(&tenants).Error; err != nil {
				return err
			}

			for i := range tenants {
				at := tenants[i].CreatedAt
				if at.IsZero() {
					at = time.Now()
				}

				// Unscoped, so the collision check sees the same rows the unique
				// index does — a soft-deleted tenant still occupies its code.
				code, genErr := lib.GeneratePrefixedCodeAt(db.Unscoped(), &models.Tenant{}, "TEN", at)
				if genErr != nil {
					return genErr
				}

				if err := db.Unscoped().
					Model(&models.Tenant{}).
					Where("id = ?", tenants[i].ID).
					Update("code", *code).Error; err != nil {
					return err
				}
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			statements := []string{
				`DROP INDEX IF EXISTS idx_tenants_code`,
				`ALTER TABLE tenants DROP COLUMN IF EXISTS code`,
			}

			for _, statement := range statements {
				if err := db.Exec(statement).Error; err != nil {
					return err
				}
			}

			return nil
		},
	}
}
