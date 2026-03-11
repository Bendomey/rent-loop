package handlers

import (
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type Handlers struct {
	NotificationHandler       NotificationHandler
	AuthHandler               AuthHandler
	AdminHandler              AdminHandler
	AnalyticsHandler          AnalyticsHandler
	ClientApplicationHandler  ClientApplicationHandler
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
}

func NewHandlers(appCtx pkg.AppContext, services services.Services) Handlers {
	notificationHandler := NewNotificationHandler(appCtx, services.NotificationService)
	authHandler := NewAuthHandler(appCtx, services.AuthService)
	analyticsHandler := NewAnalyticsHandler(appCtx)
	adminHandler := NewAdminHandler(appCtx, services.AdminService)
	clientApplicationHandler := NewClientApplicationHandler(appCtx, services.ClientApplicationService)
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
	leaseChecklistHandler := NewLeaseChecklistHandler(appCtx, services.LeaseChecklistService)

	return Handlers{
		NotificationHandler:       notificationHandler,
		AuthHandler:               authHandler,
		AnalyticsHandler:          analyticsHandler,
		ClientApplicationHandler:  clientApplicationHandler,
		AdminHandler:              adminHandler,
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
	}
}
