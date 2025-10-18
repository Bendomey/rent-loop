package services

import (
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type Services struct {
	AdminService             AdminService
	ClientApplicationService ClientApplicationService
	ClientService            ClientService
}

func NewServices(appCtx pkg.AppContext, repository repository.Repository) Services {
	adminService := NewAdminService(appCtx, repository.AdminRepository)
	clientApplicationService := NewClientApplicationService(appCtx, repository.ClientApplicationRepository)
	clientService := NewClientService(appCtx, repository.ClientRepository)

	return Services{
		AdminService:             adminService,
		ClientApplicationService: clientApplicationService,
		ClientService:            clientService,
	}
}
