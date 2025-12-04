package services

import (
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type Services struct {
	AdminService              AdminService
	ClientApplicationService  ClientApplicationService
	ClientUserService         ClientUserService
	PropertyService           PropertyService
	DocumentService           DocumentService
	UnitService               UnitService
	ClientUserPropertyService ClientUserPropertyService
	PropertyBlockService      PropertyBlockService
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

	unitService := NewUnitService(appCtx, repository.UnitRepository)

	propertyBlockService := NewPropertyBlockService(appCtx, repository.PropertyBlockRepository)

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

	return Services{
		AdminService:              adminService,
		ClientApplicationService:  clientApplicationService,
		ClientUserService:         clientUserService,
		PropertyService:           propertyService,
		DocumentService:           documentService,
		UnitService:               unitService,
		ClientUserPropertyService: clientUserPropertyService,
		PropertyBlockService:      propertyBlockService,
	}
}
