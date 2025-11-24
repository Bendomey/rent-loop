package migration

import (
	"fmt"

	"github.com/Bendomey/rent-loop/services/main/init/migration/jobs"
	log "github.com/sirupsen/logrus"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func updateMigration(db *gorm.DB) error {
	err := db.AutoMigrate(
		&models.Payment{},

		&models.Admin{},
		&models.ClientApplication{},
		&models.Client{},
		&models.ClientUser{},
		&models.Property{},
		&models.ClientUserProperty{},
		&models.Document{},
		&models.PropertyBlock{},
		&models.Unit{},
		&models.TenantApplication{},
		&models.Tenant{},
		&models.Lease{},
		&models.LeaseChecklist{},
		&models.LeasePayment{},
		&models.MaintenanceRequest{},
		&models.Announcement{},
		&models.TenantAccount{},
	)
	return err
}

// ServiceAutoMigration migrates all the tables and modifications to the connected source
func ServiceAutoMigration(db *gorm.DB) error {
	// Keep a list of migrations here
	m := gormigrate.New(db, gormigrate.DefaultOptions, nil)

	m.InitSchema(func(db *gorm.DB) error {
		log.Info("[Migration.InitSchema] Initializing database schema")
		db.Exec("create extension \"uuid-ossp\";")
		if err := updateMigration(db); err != nil {
			return fmt.Errorf("[Migration.InitSchema]: %v", err)
		}
		// Add more jobs, etc here
		return nil
	})
	m.Migrate()

	if err := updateMigration(db); err != nil {
		return err
	}

	m = gormigrate.New(db, gormigrate.DefaultOptions, []*gormigrate.Migration{
		jobs.SeedSuperAdmin(),
	})
	m.Migrate()

	return nil
}
