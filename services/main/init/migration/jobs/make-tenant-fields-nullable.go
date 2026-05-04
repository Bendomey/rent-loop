package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// MakeTenantFieldsNullable drops NOT NULL constraints on personal info, ID, emergency contact,
// and occupation fields to support short-term bookings where only basic info is required.
func MakeTenantFieldsNullable() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202605040001_MAKE_TENANT_FIELDS_NULLABLE",
		Migrate: func(db *gorm.DB) error {
			nullableColumns := []string{
				"date_of_birth",
				"nationality",
				"marital_status",
				"id_type",
				"id_number",
				"emergency_contact_name",
				"emergency_contact_phone",
				"relationship_to_emergency_contact",
				"occupation",
				"employer",
				"occupation_address",
			}

			for _, col := range nullableColumns {
				if err := db.Exec(
					"ALTER TABLE tenants ALTER COLUMN " + col + " DROP NOT NULL",
				).Error; err != nil {
					return err
				}
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			nonNullableColumns := []string{
				"date_of_birth",
				"nationality",
				"marital_status",
				"id_type",
				"id_number",
				"emergency_contact_name",
				"emergency_contact_phone",
				"relationship_to_emergency_contact",
				"occupation",
				"employer",
				"occupation_address",
			}

			for _, col := range nonNullableColumns {
				if err := db.Exec(
					"ALTER TABLE tenants ALTER COLUMN " + col + " SET NOT NULL",
				).Error; err != nil {
					return err
				}
			}

			return nil
		},
	}
}
