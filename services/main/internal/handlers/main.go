package handlers

import (
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type Handlers struct {
	AdminHandler             AdminHandler
	ClientApplicationHandler ClientApplicationHandler
	ClientUserHandler        ClientUserHandler
	PropertyHandler          PropertyHandler
}

func NewHandlers(appCtx pkg.AppContext, services services.Services) Handlers {
	adminHandler := NewAdminHandler(appCtx, services.AdminService)
	clientApplicationHandler := NewClientApplicationHandler(appCtx, services.ClientApplicationService)
	clientUserHandler := NewClientUserHandler(appCtx, services.ClientUserService)
	propertyHandler := NewPropertyHandler(appCtx, services.PropertyService)

	return Handlers{
		ClientApplicationHandler: clientApplicationHandler,
		AdminHandler:             adminHandler,
		ClientUserHandler:        clientUserHandler,
		PropertyHandler:          propertyHandler,
	}
}
