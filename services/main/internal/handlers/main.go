package handlers

import (
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type Handlers struct {
	AdminHandler AdminHandler
}

func NewHandlers(appCtx pkg.AppContext, services services.Services) Handlers {

	adminHandler := NewAdminHandler(appCtx, services.AdminService)

	return Handlers{
		AdminHandler: adminHandler,
	}
}
