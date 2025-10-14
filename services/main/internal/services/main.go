package services

import (
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type Services struct {
	AdminService AdminService
}

func NewServices(appCtx pkg.AppContext, repository repository.Repository) Services {
	adminService := NewAdminService(appCtx, repository.AdminRepository)

	return Services{
		AdminService: adminService,
	}
}
