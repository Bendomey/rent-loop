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

		&models.Admin{},
		&models.ClientApplication{},
		&models.Client{},
		&models.User{},
		&models.ClientUser{},
		&models.PaymentAccount{},
		&models.Property{},
		&models.ClientUserProperty{},
		&models.Document{},
		&models.PropertyBlock{},
		&models.Unit{},
		&models.Tenant{},
		&models.TenantApplication{},
		&models.Lease{},
		&models.LeaseChecklist{},
		&models.LeaseChecklistItem{},
		&models.LeaseChecklistAcknowledgment{},
		&models.ChecklistTemplate{},
		&models.ChecklistTemplateItem{},
		&models.LeasePayment{},
		&models.TenantAccount{},
		&models.Invoice{},
		&models.InvoiceLineItem{},
		&models.Payment{},
		&models.DocumentSignature{},
		&models.SigningToken{},
		&models.FcmToken{},
		&models.Announcement{},
		&models.AnnouncementRead{},
		&models.MaintenanceRequest{},
		&models.MaintenanceRequestActivityLog{},
		&models.MaintenanceRequestComment{},
		&models.Expense{},
		&models.Agreement{},
		&models.AgreementAcceptance{},
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
	if err := m.Migrate(); err != nil {
		return fmt.Errorf("[Migration.InitSchema.Migrate]: %v", err)
	}

	if err := updateMigration(db); err != nil {
		return err
	}

	m = gormigrate.New(db, gormigrate.DefaultOptions, []*gormigrate.Migration{
		jobs.SeedSuperAdmin(),
		jobs.SeedSystemOfflinePaymentAccount(),
		jobs.DropTenantAccountNotificationToken(),
		jobs.AddLeaseNextBillingDate(),
		jobs.AddInvoiceRemindersSent(),
		jobs.EnhanceLeaseChecklist(),
		jobs.SeedChecklistTemplates(),
		jobs.AddClientCompanyFields(),
		jobs.AddInvoicePropertyClientPayeeTenant(),
		jobs.DropExpenseInvoicePaidByBillable(),
		jobs.AddInvoiceVoidedReason(),
		jobs.AddExpenseCode(),
		jobs.AddExpenseLeasePropertyContext(),
		jobs.ReplacePayerTenantWithPayerLease(),
		jobs.SeedAgreements(),
		jobs.ExtractUsersFromClientUsers(),
		jobs.MakeTenantApplicationFieldsNullable(),
		jobs.MakeTenantApplicationIDTypeNullable(),
		jobs.AddClientIdentityFields(),
	})
	if err := m.Migrate(); err != nil {
		return fmt.Errorf("[Migration.Migrate]: %v", err)
	}

	return nil
}
