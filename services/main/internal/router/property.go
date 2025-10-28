package router

import (
	"github.com/Bendomey/rent-loop/services/main/internal/handlers"
	"github.com/Bendomey/rent-loop/services/main/internal/middlewares"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

func NewPropertyRouter(appCtx pkg.AppContext, handlers handlers.Handlers) func(r chi.Router) {
	return func(r chi.Router) {
		r.Use(middlewares.InjectClientUserAuthMiddleware(appCtx))

		// protected property routes ...
		r.Group(func(r chi.Router) {
			// ensure auth is present
			r.Use(middlewares.CheckForClientUserAuthPresenceMiddleware)

			r.Post("/v1/properties", handlers.PropertyHandler.CreateProperty)
			r.Get("/v1/properties/{property_id}", handlers.PropertyHandler.GetProperty)
		})
	}
}