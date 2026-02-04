package services

import (
	"github.com/Bendomey/rent-loop/services/main/internal/clients"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type Services struct {
	AuthService               AuthService
	AdminService              AdminService
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
}

type INewServicesParams struct {
	AppCtx     pkg.AppContext
	Repository repository.Repository
	Clients    clients.Clients
}

func NewServices(params INewServicesParams) Services {
	accountingService := NewAccountingService(params.AppCtx, params.Clients.AccountingAPI)
	invoiceService := NewInvoiceService(params.AppCtx, params.Repository.InvoiceRepository, accountingService)

	authService := NewAuthService(params.AppCtx)
	adminService := NewAdminService(params.AppCtx, params.Repository.AdminRepository)
	clientApplicationService := NewClientApplicationService(
		params.AppCtx,
		params.Repository.ClientApplicationRepository,
	)

	clientUserService := NewClientUserService(
		params.AppCtx,
		params.Repository.ClientUserRepository,
		params.Repository.ClientRepository,
	)

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
		},
	)

	documentService := NewDocumentService(
		params.AppCtx,
		params.Repository.DocumentRepository,
	)

	tenantService := NewTenantService(params.AppCtx, params.Repository.TenantRepository)

	leaseService := NewLeaseService(params.AppCtx, params.Repository.LeaseRepository)

	tenantAccountService := NewTenantAccountService(params.AppCtx, params.Repository.TenantAccountRepository)

	paymentAccountService := NewPaymentAccountService(params.AppCtx, params.Repository.PaymentAccountRepository)
	tenantApplicationService := NewTenantApplicationService(TenantApplicationServiceDeps{
		AppCtx:               params.AppCtx,
		Repo:                 params.Repository.TenantApplicationRepository,
		UnitService:          unitService,
		ClientUserService:    clientUserService,
		TenantService:        tenantService,
		LeaseService:         leaseService,
		TenantAccountService: tenantAccountService,
		InvoiceService:       invoiceService,
	})

	return Services{
		AccountingService: accountingService,
		InvoiceService:    invoiceService,

		AuthService:               authService,
		AdminService:              adminService,
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
	}
}
