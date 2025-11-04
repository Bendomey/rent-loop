package services

import (
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type Services struct {
	AdminService             AdminService
	ClientApplicationService ClientApplicationService
	ClientUserService        ClientUserService
	PropertyService          PropertyService
	DocumentService          DocumentService
	UnitService              UnitService
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

	unitService := NewUnitService(appCtx, repository.UnitRepository)

	propertyService := NewPropertyService(
		PropertyServiceDependencies{
			AppCtx:                 appCtx,
			Repo:                   repository.PropertyRepository,
			ClientUserRepo:         repository.ClientUserRepository,
			ClientUserPropertyRepo: repository.ClientUserPropertyRepository,
			UnitService:            unitService,
		},
	)

	documentService := NewDocumentService(
		appCtx,
		repository.DocumentRepository,
	)

	return Services{
		AdminService:             adminService,
		ClientApplicationService: clientApplicationService,
		ClientUserService:        clientUserService,
		PropertyService:          propertyService,
		DocumentService:          documentService,
		UnitService:              unitService,
	}
}
