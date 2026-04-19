package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// MakeTenantApplicationFieldsNullable drops NOT NULL constraints on personal info and financial
// fields to support CSV/bulk upload where only a phone number is required.
// Also adds the source column to track how an application was created.
func MakeTenantApplicationFieldsNullable() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604180001_MAKE_TENANT_APPLICATION_FIELDS_NULLABLE",
		Migrate: func(db *gorm.DB) error {
			nullableColumns := []string{
				"desired_unit_id",
				"rent_fee",
				"rent_fee_currency",
				"first_name",
				"last_name",
				"gender",
				"date_of_birth",
				"nationality",
				"marital_status",
				"id_number",
				"current_address",
				"emergency_contact_name",
				"emergency_contact_phone",
				"relationship_to_emergency_contact",
				"occupation",
				"employer",
				"occupation_address",
			}

			for _, col := range nullableColumns {
				if err := db.Exec(
					"ALTER TABLE tenant_applications ALTER COLUMN "+col+" DROP NOT NULL",
				).Error; err != nil {
					return err
				}
			}

			if err := db.Exec(
				`ALTER TABLE tenant_applications ADD COLUMN IF NOT EXISTS source TEXT`,
			).Error; err != nil {
				return err
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(
				`ALTER TABLE tenant_applications DROP COLUMN IF EXISTS source`,
			).Error; err != nil {
				return err
			}
			return nil
		},
	}
}
