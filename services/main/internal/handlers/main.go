package handlers

import (
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type Handlers struct {
	AuthHandler               AuthHandler
	AdminHandler              AdminHandler
	ClientApplicationHandler  ClientApplicationHandler
	ClientUserHandler         ClientUserHandler
	PropertyHandler           PropertyHandler
	ClientUserPropertyHandler ClientUserPropertyHandler
	DocumentHandler           DocumentHandler
	PropertyBlockHandler      PropertyBlockHandler
	UnitHandler               UnitHandler
	TenantApplicationHandler  TenantApplicationHandler
	TenantHandler             TenantHandler
	LeaseHandler              LeaseHandler
	PaymentAccountHandler     PaymentAccountHandler
	InvoiceHandler            InvoiceHandler
	PaymentHandler            PaymentHandler
	SigningHandler            SigningHandler
}

func NewHandlers(appCtx pkg.AppContext, services services.Services) Handlers {
	authHandler := NewAuthHandler(appCtx, services.AuthService)
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
	leaseHandler := NewLeaseHandler(appCtx, services)
	paymentAccountHandler := NewPaymentAccountHandler(appCtx, services.PaymentAccountService)

	return Handlers{
		AuthHandler:               authHandler,
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
		LeaseHandler:              leaseHandler,
		PaymentAccountHandler:     paymentAccountHandler,
		InvoiceHandler:            invoiceHandler,
		PaymentHandler:            paymentHandler,
		SigningHandler:            signingHandler,
	}
}
