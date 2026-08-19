package repository

import "gorm.io/gorm"

type Repository struct {
	AdminRepository                        AdminRepository
	ClientApplicationRepository            ClientApplicationRepository
	UserRepository                         UserRepository
	RefreshTokenRepository                 RefreshTokenRepository
	SessionRepository                      SessionRepository
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
	FinancialAccountRepository             FinancialAccountRepository
	FinancialAccountClosureRepository      FinancialAccountClosureRepository
	ChargeRepository                       ChargeRepository
	PaymentAllocationRepository            PaymentAllocationRepository
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
	LeaseTerminationRepository             LeaseTerminationRepository
	ExchangeRateRepository                 ExchangeRateRepository
	LeaseAgreementDocumentRepository       LeaseAgreementDocumentRepository
	NotificationRepository                 NotificationRepository
}

func NewRepository(db *gorm.DB) Repository {
	adminRepository := NewAdminRepository(db)
	clientApplicationRepository := NewClientApplicationRepository(db)
	userRepository := NewUserRepository(db)
	refreshTokenRepository := NewRefreshTokenRepository(db)
	sessionRepository := NewSessionRepository(db)
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
	financialAccountRepository := NewFinancialAccountRepository(db)
	financialAccountClosureRepository := NewFinancialAccountClosureRepository(db)
	chargeRepository := NewChargeRepository(db)
	paymentAllocationRepository := NewPaymentAllocationRepository(db)
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
	leaseTerminationRepo := NewLeaseTerminationRepository(db)
	exchangeRateRepository := NewExchangeRateRepository(db)
	leaseAgreementDocumentRepository := NewLeaseAgreementDocumentRepository(db)
	notificationRepository := NewNotificationRepository(db)

	return Repository{
		AdminRepository:                        adminRepository,
		ClientApplicationRepository:            clientApplicationRepository,
		UserRepository:                         userRepository,
		RefreshTokenRepository:                 refreshTokenRepository,
		SessionRepository:                      sessionRepository,
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
		FinancialAccountRepository:             financialAccountRepository,
		FinancialAccountClosureRepository:      financialAccountClosureRepository,
		ChargeRepository:                       chargeRepository,
		PaymentAllocationRepository:            paymentAllocationRepository,
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
		LeaseTerminationRepository:             leaseTerminationRepo,
		ExchangeRateRepository:                 exchangeRateRepository,
		LeaseAgreementDocumentRepository:       leaseAgreementDocumentRepository,
		NotificationRepository:                 notificationRepository,
	}
}
