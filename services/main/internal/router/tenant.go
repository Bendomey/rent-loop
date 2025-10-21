package router

import (
	"github.com/Bendomey/rent-loop/services/main/internal/handlers"
	"github.com/Bendomey/rent-loop/services/main/internal/middlewares"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

func NewTenantAccountRouter(appCtx pkg.AppContext, handlers handlers.Handlers) func(r chi.Router) {
	return func(r chi.Router) {
		r.Use(middlewares.InjectTenantAuthMiddleware(appCtx))

		// unprotected tenant user routes
		r.Group(func(r chi.Router) {})

		// protected tenant user routes
		r.Group(func(r chi.Router) {
			r.Use(middlewares.CheckForTenantAuthPresenceMiddleware)
		})
	}
}
