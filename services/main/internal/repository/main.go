package repository

import "gorm.io/gorm"

type Repository struct {
	AdminRepository                        AdminRepository
	ClientApplicationRepository            ClientApplicationRepository
	UserRepository                         UserRepository
	ClientUserRepository                   ClientUserRepository
	ClientRepository                       ClientRepository
	PropertyRepository                     PropertyRepository
	ClientUserPropertyRepository           ClientUserPropertyRepository
	DocumentRepository                     DocumentRepository
	UnitRepository                         UnitRepository
	PropertyBlockRepository                PropertyBlockRepository
	TenantApplicationRepository            TenantApplicationRepository
	TenantRepository                       TenantRepository
	LeaseRepository                        LeaseRepository
	TenantAccountRepository                TenantAccountRepository
	PaymentAccountRepository               PaymentAccountRepository
	InvoiceRepository                      InvoiceRepository
	PaymentRepository                      PaymentRepository
	SigningRepository                      SigningRepository
	LeaseChecklistRepository               LeaseChecklistRepository
	LeaseChecklistItemRepository           LeaseChecklistItemRepository
	LeaseChecklistAcknowledgmentRepository LeaseChecklistAcknowledgmentRepository
	ChecklistTemplateRepository            ChecklistTemplateRepository
	FcmTokenRepository                     FcmTokenRepository
	AnnouncementRepository                 AnnouncementRepository
	MaintenanceRequestRepository           MaintenanceRequestRepository
	ExpenseRepository                      ExpenseRepository
	AgreementRepository                    AgreementRepository
	BookingRepository                      BookingRepository
	UnitDateBlockRepository                UnitDateBlockRepository
}

func NewRepository(db *gorm.DB) Repository {
	adminRepository := NewAdminRepository(db)
	clientApplicationRepository := NewClientApplicationRepository(db)
	userRepository := NewUserRepository(db)
	clientUserRepository := NewClientUserRepository(db)
	clientRepository := NewClientRepository(db)
	propertyRepository := NewPropertyRepository(db)
	clientUserPropertyRepository := NewClientUserPropertyRepository(db)
	documentRepository := NewDocumentRepository(db)
	unitRepository := NewUnitRepository(db)
	propertyBlockRepository := NewPropertyBlockRepository(db)
	tenantApplicationRepository := NewTenantApplicationRepository(db)
	tenantRepository := NewTenantRepository(db)
	leaseRepository := NewLeaseRepository(db)
	tenantAccountRepository := NewTenantAccountRepository(db)
	paymentAccountRepository := NewPaymentAccountRepository(db)
	invoiceRepository := NewInvoiceRepository(db)
	paymentRepository := NewPaymentRepository(db)
	signingRepository := NewSigningRepository(db)
	leaseChecklistRepository := NewLeaseChecklistRepository(db)
	leaseChecklistItemRepository := NewLeaseChecklistItemRepository(db)
	leaseChecklistAcknowledgmentRepository := NewLeaseChecklistAcknowledgmentRepository(db)
	checklistTemplateRepository := NewChecklistTemplateRepository(db)
	fcmTokenRepository := NewFcmTokenRepository(db)
	announcementRepository := NewAnnouncementRepository(db)
	maintenanceRequestRepository := NewMaintenanceRequestRepository(db)
	expenseRepository := NewExpenseRepository(db)
	agreementRepository := NewAgreementRepository(db)
	bookingRepo := NewBookingRepository(db)
	unitDateBlockRepo := NewUnitDateBlockRepository(db)

	return Repository{
		AdminRepository:                        adminRepository,
		ClientApplicationRepository:            clientApplicationRepository,
		UserRepository:                         userRepository,
		ClientUserRepository:                   clientUserRepository,
		ClientRepository:                       clientRepository,
		PropertyRepository:                     propertyRepository,
		ClientUserPropertyRepository:           clientUserPropertyRepository,
		DocumentRepository:                     documentRepository,
		UnitRepository:                         unitRepository,
		PropertyBlockRepository:                propertyBlockRepository,
		TenantApplicationRepository:            tenantApplicationRepository,
		TenantRepository:                       tenantRepository,
		LeaseRepository:                        leaseRepository,
		TenantAccountRepository:                tenantAccountRepository,
		PaymentAccountRepository:               paymentAccountRepository,
		InvoiceRepository:                      invoiceRepository,
		PaymentRepository:                      paymentRepository,
		SigningRepository:                      signingRepository,
		LeaseChecklistRepository:               leaseChecklistRepository,
		LeaseChecklistItemRepository:           leaseChecklistItemRepository,
		LeaseChecklistAcknowledgmentRepository: leaseChecklistAcknowledgmentRepository,
		ChecklistTemplateRepository:            checklistTemplateRepository,
		FcmTokenRepository:                     fcmTokenRepository,
		AnnouncementRepository:                 announcementRepository,
		MaintenanceRequestRepository:           maintenanceRequestRepository,
		ExpenseRepository:                      expenseRepository,
		AgreementRepository:                    agreementRepository,
		BookingRepository:                      bookingRepo,
		UnitDateBlockRepository:                unitDateBlockRepo,
	}
}
