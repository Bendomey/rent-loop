package router

import (
	"github.com/Bendomey/rent-loop/services/main/internal/handlers"
	"github.com/Bendomey/rent-loop/services/main/internal/middlewares"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

func NewAdminRouter(appCtx pkg.AppContext, handlers handlers.Handlers) func(r chi.Router) {
	return func(r chi.Router) {
		r.Use(middlewares.InjectAdminAuthMiddleware(appCtx))

		r.Group(func(r chi.Router) {
			r.Post("/v1/admins/login", handlers.AdminHandler.Authenticate)
		})

		r.Group(func(r chi.Router) {
			r.Post("/v1/clients/apply", handlers.ClientApplicationHandler.CreateClientApplication)
			r.Get("/v1/admins/test", handlers.AdminHandler.HelloWorld)
		})

		// protected client routes ...
		r.Group(func(r chi.Router) {
			// ensure auth is present
			r.Use(middlewares.CheckForAdminAuthPresenceMiddleware)

			r.Post("/v1/admins", handlers.AdminHandler.CreateAdmin)
			r.Get("/v1/admins/me", handlers.AdminHandler.GetMe)
			r.Get("/v1/admins/{id}", handlers.AdminHandler.GetAdminById)
			r.Get("/v1/admins", handlers.AdminHandler.ListAdmins)
		})
	}
}
