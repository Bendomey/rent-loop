package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// DropTenantAccountNotificationToken removes the legacy single-token column from
// tenant_accounts. FCM tokens are now stored in the fcm_tokens table.
func DropTenantAccountNotificationToken() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "DROP_TENANT_ACCOUNT_NOTIFICATION_TOKEN",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE tenant_accounts DROP COLUMN IF EXISTS notification_token`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE tenant_accounts ADD COLUMN IF NOT EXISTS notification_token TEXT`).Error
		},
	}
}
