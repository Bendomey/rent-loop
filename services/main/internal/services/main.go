package services

import (
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type Services struct {
	NotificationService       NotificationService
	AuthService               AuthService
	AdminService              AdminService
	UserService               UserService
	ClientService             ClientService
	ClientApplicationService  ClientApplicationService
	ClientUserService         ClientUserService
	PropertyService           PropertyService
	DocumentService           DocumentService
	UnitService               UnitService
	ClientUserPropertyService ClientUserPropertyService
	PropertyBlockService      PropertyBlockService
	TenantApplicationService  TenantApplicationService
	TenantService             TenantService
	LeaseService              LeaseService
	TenantAccountService      TenantAccountService
	PaymentAccountService     PaymentAccountService
	AccountingService         AccountingService
	InvoiceService            InvoiceService
	PaymentService            PaymentService
	SigningService            SigningService
	LeaseChecklistService     LeaseChecklistService
	LeaseChecklistItemService LeaseChecklistItemService
	ChecklistTemplateService  ChecklistTemplateService
	AnnouncementService       AnnouncementService
	MaintenanceRequestService MaintenanceRequestService
	ExpenseService            ExpenseService
	AgreementService          AgreementService
}

type INewServicesParams struct {
	AppCtx        pkg.AppContext
	Repository    repository.Repository
	RentloopQueue RentloopQueue
}

func NewServices(params INewServicesParams) Services {
	notificationService := NewNotificationService(params.AppCtx, params.Repository.FcmTokenRepository)
	accountingService := NewAccountingService(params.AppCtx)
	invoiceService := NewInvoiceService(
		params.AppCtx,
		params.Repository.InvoiceRepository,
		accountingService,
		notificationService,
		params.Repository.TenantAccountRepository,
		params.Repository.TenantRepository,
	)

	authService := NewAuthService(params.AppCtx, params.Repository.TenantAccountRepository)
	adminService := NewAdminService(params.AppCtx, params.Repository.AdminRepository)
	userService := NewUserService(params.AppCtx, params.Repository.UserRepository)
	clientService := NewClientService(params.AppCtx, params.Repository.ClientRepository)

	clientUserService := NewClientUserService(
		params.AppCtx,
		params.Repository.ClientUserRepository,
		params.Repository.ClientRepository,
		params.Repository.UserRepository,
	)

	clientApplicationService := NewClientApplicationService(ClientApplicationServiceDeps{
		AppCtx:            params.AppCtx,
		Repo:              params.Repository.ClientApplicationRepository,
		ClientService:     clientService,
		ClientUserService: clientUserService,
		UserService:       userService,
	})

	clientUserPropertyService := NewClientUserPropertyService(
		params.AppCtx,
		params.Repository.ClientUserPropertyRepository,
	)

	propertyBlockService := NewPropertyBlockService(params.AppCtx, params.Repository.PropertyBlockRepository)

	unitService := NewUnitService(UnitServiceDependencies{
		AppCtx:               params.AppCtx,
		Repo:                 params.Repository.UnitRepository,
		PropertyBlockService: propertyBlockService,
	})

	propertyService := NewPropertyService(
		PropertyServiceDependencies{
			AppCtx:                    params.AppCtx,
			Repo:                      params.Repository.PropertyRepository,
			ClientUserService:         clientUserService,
			ClientUserPropertyService: clientUserPropertyService,
			UnitService:               unitService,
			PropertyBlockService:      propertyBlockService,
			LeaseRepo:                 params.Repository.LeaseRepository,
		},
	)

	documentService := NewDocumentService(
		params.AppCtx,
		params.Repository.DocumentRepository,
	)

	tenantService := NewTenantService(params.AppCtx, params.Repository.TenantRepository)

	leaseService := NewLeaseService(
		params.AppCtx,
		params.Repository.LeaseRepository,
		invoiceService,
		notificationService,
	)

	tenantAccountService := NewTenantAccountService(params.AppCtx, params.Repository.TenantAccountRepository)

	paymentAccountService := NewPaymentAccountService(params.AppCtx, params.Repository.PaymentAccountRepository)
	tenantApplicationService := NewTenantApplicationService(TenantApplicationServiceDeps{
		AppCtx:                params.AppCtx,
		Repo:                  params.Repository.TenantApplicationRepository,
		UnitService:           unitService,
		ClientUserService:     clientUserService,
		TenantService:         tenantService,
		LeaseService:          leaseService,
		TenantAccountService:  tenantAccountService,
		InvoiceService:        invoiceService,
		PaymentAccountService: paymentAccountService,
	})
	signingService := NewSigningService(params.AppCtx, params.Repository.SigningRepository)

	paymentService := NewPaymentService(PaymentServiceDeps{
		AppCtx:                   params.AppCtx,
		Repo:                     params.Repository.PaymentRepository,
		PaymentAccountService:    paymentAccountService,
		InvoiceService:           invoiceService,
		AccountingService:        accountingService,
		NotificationService:      notificationService,
		LeaseService:             leaseService,
		TenantApplicationService: tenantApplicationService,
	})
	tenantApplicationService.SetPaymentService(paymentService)

	leaseChecklistItemService := NewLeaseChecklistItemService(
		params.AppCtx,
		params.Repository.LeaseChecklistItemRepository,
		params.Repository.LeaseChecklistRepository,
	)
	checklistTemplateService := NewChecklistTemplateService(params.Repository.ChecklistTemplateRepository)

	leaseChecklistService := NewLeaseChecklistService(LeaseChecklistServiceDeps{
		AppCtx:               params.AppCtx,
		Repo:                 params.Repository.LeaseChecklistRepository,
		ChecklistItemService: leaseChecklistItemService,
		AcknowledgmentRepo:   params.Repository.LeaseChecklistAcknowledgmentRepository,
		TemplateRepo:         params.Repository.ChecklistTemplateRepository,
		LeaseRepo:            params.Repository.LeaseRepository,
		TenantAccountRepo:    params.Repository.TenantAccountRepository,
		NotificationService:  notificationService,
	})

	announcementService := NewAnnouncementService(AnnouncementServiceDeps{
		AppCtx:              params.AppCtx,
		Repo:                params.Repository.AnnouncementRepository,
		TenantAccountRepo:   params.Repository.TenantAccountRepository,
		NotificationService: notificationService,
		RentloopQueue:       params.RentloopQueue,
	})

	maintenanceRequestService := NewMaintenanceRequestService(MaintenanceRequestServiceDeps{
		AppCtx:              params.AppCtx,
		Repo:                params.Repository.MaintenanceRequestRepository,
		LeaseRepo:           params.Repository.LeaseRepository,
		TenantAccountRepo:   params.Repository.TenantAccountRepository,
		NotificationService: notificationService,
		InvoiceService:      invoiceService,
	})

	agreementService := NewAgreementService(params.Repository.AgreementRepository)

	expenseService := NewExpenseService(ExpenseServiceDeps{
		AppCtx:         params.AppCtx,
		Repo:           params.Repository.ExpenseRepository,
		LeaseRepo:      params.Repository.LeaseRepository,
		MRRepo:         params.Repository.MaintenanceRequestRepository,
		InvoiceService: invoiceService,
	})

	return Services{
		NotificationService: notificationService,
		AccountingService:   accountingService,
		InvoiceService:      invoiceService,

		AuthService:               authService,
		AdminService:              adminService,
		UserService:               userService,
		ClientService:             clientService,
		ClientApplicationService:  clientApplicationService,
		ClientUserService:         clientUserService,
		PaymentAccountService:     paymentAccountService,
		PropertyService:           propertyService,
		DocumentService:           documentService,
		UnitService:               unitService,
		ClientUserPropertyService: clientUserPropertyService,
		PropertyBlockService:      propertyBlockService,
		TenantApplicationService:  tenantApplicationService,
		TenantService:             tenantService,
		LeaseService:              leaseService,
		TenantAccountService:      tenantAccountService,
		PaymentService:            paymentService,
		SigningService:            signingService,
		LeaseChecklistService:     leaseChecklistService,
		LeaseChecklistItemService: leaseChecklistItemService,
		ChecklistTemplateService:  checklistTemplateService,
		AnnouncementService:       announcementService,
		MaintenanceRequestService: maintenanceRequestService,
		ExpenseService:            expenseService,
		AgreementService:          agreementService,
	}
}
