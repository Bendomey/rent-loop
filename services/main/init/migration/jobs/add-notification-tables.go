package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddNotificationTables() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202406300001_ADD_NOTIFICATION_TABLES",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`
				CREATE INDEX IF NOT EXISTS idx_notifications_recipient
				ON notifications (recipient_id, recipient_type, visibility, created_at DESC)
			`).Error; err != nil {
				return err
			}
			return db.Exec(`
				CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification
				ON notification_deliveries (notification_id, channel, status)
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			db.Exec(`DROP INDEX IF EXISTS idx_notifications_recipient`)
			return db.Exec(`DROP INDEX IF EXISTS idx_notification_deliveries_notification`).Error
		},
	}
}
