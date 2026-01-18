package jobs

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"github.com/gofrs/uuid"
	gonanoid "github.com/matoous/go-nanoid"
	"gorm.io/gorm"
)

func SeedCodeTenantApplication() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202601172021_SEED_CODE_TENANT_APPLICATION",
		Migrate: func(tx *gorm.DB) error {
			rows, err := tx.Model(&models.TenantApplication{}).Where("code IS NULL").Select("id").Rows()
			if err != nil {
				return err
			}
			defer rows.Close()

			for rows.Next() {
				var id uuid.UUID
				rows.Scan(&id)
				code, err := gonanoid.Generate("abcdefghijklmnopqrstuvwxyz1234567890", 8)
				if err != nil {
					return err
				}
				tx.Model(&models.TenantApplication{}).Where("id = ?", id).Update("code", code)
			}

			return nil
		},
		Rollback: func(tx *gorm.DB) error {
			return nil
		},
	}
}
