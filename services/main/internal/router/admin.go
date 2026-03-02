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
			r.Post("/v1/admin/admins/login", handlers.AdminHandler.Authenticate)
		})

		// protected client routes ...
		r.Group(func(r chi.Router) {
			// ensure auth is present
			r.Use(middlewares.CheckForAdminAuthPresenceMiddleware)

			r.Route("/v1/admin/admins", func(r chi.Router) {
				r.Post("/", handlers.AdminHandler.CreateAdmin)
				r.Get("/me", handlers.AdminHandler.GetMe)
				r.Get("/{admin_id}", handlers.AdminHandler.GetAdminById)
				r.Get("/", handlers.AdminHandler.ListAdmins)
			})

			r.Route("/v1/admin/client-applications", func(r chi.Router) {
				r.Get("/", handlers.ClientApplicationHandler.ListClientApplications)

				r.Route("/{application_id}", func(r chi.Router) {
					r.Get(
						"/",
						handlers.ClientApplicationHandler.GetClientApplicationById,
					)
					r.Patch(
						"/approve",
						handlers.ClientApplicationHandler.ApproveClientApplication,
					)
					r.Patch(
						"/reject",
						handlers.ClientApplicationHandler.RejectClientApplication,
					)
				})
			})
		})
	}
}
