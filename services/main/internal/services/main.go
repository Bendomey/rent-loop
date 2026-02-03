package services

import (
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
}

func NewServices(appCtx pkg.AppContext, repository repository.Repository) Services {
	adminService := NewAdminService(appCtx, repository.AdminRepository)
	clientApplicationService := NewClientApplicationService(
		appCtx,
		repository.ClientApplicationRepository,
	)

	clientUserService := NewClientUserService(
		appCtx,
		repository.ClientUserRepository,
		repository.ClientRepository,
	)

	clientUserPropertyService := NewClientUserPropertyService(
		appCtx,
		repository.ClientUserPropertyRepository,
	)

	propertyBlockService := NewPropertyBlockService(appCtx, repository.PropertyBlockRepository)

	unitService := NewUnitService(UnitServiceDependencies{
		AppCtx:               appCtx,
		Repo:                 repository.UnitRepository,
		PropertyBlockService: propertyBlockService,
	})

	propertyService := NewPropertyService(
		PropertyServiceDependencies{
			AppCtx:                    appCtx,
			Repo:                      repository.PropertyRepository,
			ClientUserService:         clientUserService,
			ClientUserPropertyService: clientUserPropertyService,
			UnitService:               unitService,
			PropertyBlockService:      propertyBlockService,
		},
	)

	documentService := NewDocumentService(
		appCtx,
		repository.DocumentRepository,
	)

	tenantService := NewTenantService(appCtx, repository.TenantRepository)

	leaseService := NewLeaseService(appCtx, repository.LeaseRepository)

	tenantAccountService := NewTenantAccountService(appCtx, repository.TenantAccountRepository)

	paymentAccountService := NewPaymentAccountService(appCtx, repository.PaymentAccountRepository)

	tenantApplicationService := NewTenantApplicationService(TenantApplicationServiceDeps{
		AppCtx:               appCtx,
		Repo:                 repository.TenantApplicationRepository,
		UnitService:          unitService,
		ClientUserService:    clientUserService,
		TenantService:        tenantService,
		LeaseService:         leaseService,
		TenantAccountService: tenantAccountService,
	})

	authService := NewAuthService(appCtx)

	return Services{
		AuthService:               authService,
		AdminService:              adminService,
		ClientApplicationService:  clientApplicationService,
		ClientUserService:         clientUserService,
		PropertyService:           propertyService,
		DocumentService:           documentService,
		UnitService:               unitService,
		ClientUserPropertyService: clientUserPropertyService,
		PropertyBlockService:      propertyBlockService,
		TenantApplicationService:  tenantApplicationService,
		TenantService:             tenantService,
		LeaseService:              leaseService,
		TenantAccountService:      tenantAccountService,
		PaymentAccountService:     paymentAccountService,
	}
}
