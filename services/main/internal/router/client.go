package router

import (
	"github.com/Bendomey/rent-loop/services/main/internal/handlers"
	"github.com/Bendomey/rent-loop/services/main/internal/middlewares"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

func NewClientUserRouter(appCtx pkg.AppContext, handlers handlers.Handlers) func(r chi.Router) {

	return func(r chi.Router) {
		r.Use(middlewares.InjectAdminAuthMiddleware(appCtx))

		// Public route (no admin auth required)
		r.Group(func(r chi.Router) {
			r.Post("/v1/clients/apply", handlers.ClientApplicationHandler.CreateClientApplication)
		})

		// Protected routes (admin auth required)
		r.Group(func(r chi.Router) {
			r.Use(middlewares.CheckForAdminAuthPresenceMiddleware)
		})
	}
}
