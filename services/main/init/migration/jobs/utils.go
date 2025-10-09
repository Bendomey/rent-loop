package jobs

import "gorm.io/gorm"

func CheckIfColumnExists(db *gorm.DB, model interface{}, column string) error {
	if !db.Migrator().HasColumn(model, column) {
		return db.Migrator().AddColumn(model, column)
	}

	return nil
}

func DropColumnIfExists(db *gorm.DB, model interface{}, column string) error {
	if db.Migrator().HasColumn(model, column) {
		return db.Migrator().DropColumn(model, column)
	}

	return nil
}
