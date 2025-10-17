package router

import (
	"github.com/Bendomey/rent-loop/services/main/internal/handlers"
	"github.com/Bendomey/rent-loop/services/main/internal/middlewares"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

func NewClientApplicationRouter(appCtx pkg.AppContext, handlers handlers.Handlers) func(r chi.Router) {
	return func(r chi.Router) {
		r.Route("/v1/client-applications", func(r chi.Router) {
			// Public route (no admin auth required)
			r.Group(func(r chi.Router) {
				r.Post("/", handlers.ClientApplicationHandler.CreateClientApplication)
			})

			// Protected routes (admin auth required)
			r.Group(func(r chi.Router) {
				r.Use(middlewares.CheckForAdminAuthPresenceMiddleware)
				r.Get("/", handlers.ClientApplicationHandler.ListClientApplications)
				r.Get("/{id}", handlers.ClientApplicationHandler.GetClientApplicationById)
			})
		})
	}
}
