package jobs

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// SeedSystemOfflinePaymentAccount creates a default system payment account for offline/cash payments.
func SeedSystemOfflinePaymentAccount() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202602030001_SEED_SYSTEM_OFFLINE_PAYMENT_ACCOUNT",
		Migrate: func(tx *gorm.DB) error {
			account := models.PaymentAccount{
				OwnerType: "SYSTEM",
				Rail:      "OFFLINE",
				Status:    "ACTIVE",
			}
			return tx.Create(&account).Error
		},
		Rollback: func(tx *gorm.DB) error {
			return tx.Where("owner_type = ? AND rail = ?", "SYSTEM", "OFFLINE").Delete(&models.PaymentAccount{}).Error
		},
	}
}
