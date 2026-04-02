package handlers

import (
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type Handlers struct {
	NotificationHandler       NotificationHandler
	AuthHandler               AuthHandler
	AdminHandler              AdminHandler
	UserHandler               UserHandler
	AnalyticsHandler          AnalyticsHandler
	ClientApplicationHandler  ClientApplicationHandler
	ClientHandler             ClientHandler
	ClientUserHandler         ClientUserHandler
	PropertyHandler           PropertyHandler
	ClientUserPropertyHandler ClientUserPropertyHandler
	DocumentHandler           DocumentHandler
	PropertyBlockHandler      PropertyBlockHandler
	UnitHandler               UnitHandler
	TenantApplicationHandler  TenantApplicationHandler
	TenantHandler             TenantHandler
	TenantAccountHandler      TenantAccountHandler
	LeaseHandler              LeaseHandler
	PaymentAccountHandler     PaymentAccountHandler
	InvoiceHandler            InvoiceHandler
	PaymentHandler            PaymentHandler
	SigningHandler            SigningHandler
	LeaseChecklistHandler     LeaseChecklistHandler
	ChecklistTemplateHandler  ChecklistTemplateHandler
	AnnouncementHandler       AnnouncementHandler
	MaintenanceRequestHandler MaintenanceRequestHandler
	WaitlistHandler           WaitlistHandler
	ExpenseHandler            ExpenseHandler
	AgreementHandler          AgreementHandler
}

func NewHandlers(appCtx pkg.AppContext, services services.Services) Handlers {
	waitlistHandler := NewWaitlistHandler(appCtx, services.WaitlistService)
	notificationHandler := NewNotificationHandler(appCtx, services.NotificationService)
	authHandler := NewAuthHandler(appCtx, services.AuthService)
	analyticsHandler := NewAnalyticsHandler(appCtx)
	adminHandler := NewAdminHandler(appCtx, services.AdminService)
	userHandler := NewUserHandler(appCtx, services.UserService)
	clientApplicationHandler := NewClientApplicationHandler(appCtx, services.ClientApplicationService)
	clientHandler := NewClientHandler(appCtx, services.ClientService)
	clientUserHandler := NewClientUserHandler(appCtx, services.ClientUserService)
	propertyHandler := NewPropertyHandler(appCtx, services.PropertyService)
	clientUserPropertyHandler := NewClientUserPropertyHandler(appCtx, services.ClientUserPropertyService)
	documentHandler := NewDocumentHandler(appCtx, services.DocumentService)
	propertyBlockHandler := NewPropertyBlockHandler(appCtx, services.PropertyBlockService)
	unitHandler := NewUnitHandler(appCtx, services.UnitService)
	invoiceHandler := NewInvoiceHandler(appCtx, services)
	paymentHandler := NewPaymentHandler(appCtx, services)

	signingHandler := NewSigningHandler(appCtx, services)
	tenantApplicationHandler := NewTenantApplicationHandler(
		appCtx,
		services,
	)
	tenantHandler := NewTenantHandler(appCtx, services.TenantService)
	tenantAccountHandler := NewTenantAccountHandler(appCtx, services.TenantAccountService)
	leaseHandler := NewLeaseHandler(appCtx, services)
	paymentAccountHandler := NewPaymentAccountHandler(appCtx, services.PaymentAccountService)
	leaseChecklistHandler := NewLeaseChecklistHandler(
		appCtx,
		services.LeaseChecklistService,
		services.LeaseChecklistItemService,
	)
	checklistTemplateHandler := NewChecklistTemplateHandler(appCtx, services.ChecklistTemplateService)
	announcementHandler := NewAnnouncementHandler(appCtx, services.AnnouncementService)
	maintenanceRequestHandler := NewMaintenanceRequestHandler(
		appCtx,
		services.MaintenanceRequestService,
		services.TenantAccountService,
	)
	expenseHandler := NewExpenseHandler(appCtx, services.ExpenseService)
	agreementHandler := NewAgreementHandler(appCtx, services.AgreementService)

	return Handlers{
		NotificationHandler:       notificationHandler,
		AuthHandler:               authHandler,
		AnalyticsHandler:          analyticsHandler,
		ClientApplicationHandler:  clientApplicationHandler,
		ClientHandler:             clientHandler,
		AdminHandler:              adminHandler,
		UserHandler:               userHandler,
		ClientUserHandler:         clientUserHandler,
		PropertyHandler:           propertyHandler,
		ClientUserPropertyHandler: clientUserPropertyHandler,
		DocumentHandler:           documentHandler,
		PropertyBlockHandler:      propertyBlockHandler,
		UnitHandler:               unitHandler,
		TenantApplicationHandler:  tenantApplicationHandler,
		TenantHandler:             tenantHandler,
		TenantAccountHandler:      tenantAccountHandler,
		LeaseHandler:              leaseHandler,
		PaymentAccountHandler:     paymentAccountHandler,
		InvoiceHandler:            invoiceHandler,
		PaymentHandler:            paymentHandler,
		SigningHandler:            signingHandler,
		LeaseChecklistHandler:     leaseChecklistHandler,
		ChecklistTemplateHandler:  checklistTemplateHandler,
		AnnouncementHandler:       announcementHandler,
		MaintenanceRequestHandler: maintenanceRequestHandler,
		WaitlistHandler:           waitlistHandler,
		ExpenseHandler:            expenseHandler,
		AgreementHandler:          agreementHandler,
	}
}
