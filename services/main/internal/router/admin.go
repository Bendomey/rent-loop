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

		// protected client routes ...
		r.Group(func(r chi.Router) {
			// ensure auth is present
			r.Use(middlewares.CheckForAdminAuthPresenceMiddleware)

			r.Post("/v1/admins", handlers.AdminHandler.CreateAdmin)
			r.Get("/v1/admins/me", handlers.AdminHandler.GetMe)
			r.Get("/v1/admins/{admin_id}", handlers.AdminHandler.GetAdminById)
			r.Get("/v1/admins", handlers.AdminHandler.ListAdmins)
			r.Get("/v1/client-applications", handlers.ClientApplicationHandler.ListClientApplications)
			r.Get(
				"/v1/client-applications/{application_id}",
				handlers.ClientApplicationHandler.GetClientApplicationById,
			)
			r.Patch(
				"/v1/client-applications/{application_id}/approve",
				handlers.ClientApplicationHandler.ApproveClientApplication,
			)
			r.Patch(
				"/v1/client-applications/{application_id}/reject",
				handlers.ClientApplicationHandler.RejectClientApplication,
			)
		})
	}
}
