package router

import (
	"github.com/Bendomey/rent-loop/services/main/internal/handlers"
	"github.com/Bendomey/rent-loop/services/main/internal/middlewares"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

func NewTenantAccountRouter(appCtx pkg.AppContext, handlers handlers.Handlers) func(r chi.Router) {
	return func(r chi.Router) {
		// unprotected tenant user routes
		r.Group(func(r chi.Router) {
			r.Post("/v1/tenant-applications", handlers.TenantApplicationHandler.CreateTenantApplication)
			r.Get("/v1/tenants/phone/{phone}", handlers.TenantHandler.GetTenantByPhone)
			r.Post("/v1/auth/codes", handlers.AuthHandler.SendCode)
			r.Post("/v1/auth/codes/verify", handlers.AuthHandler.VerifyCode)
		})

		// protected tenant user routes
		r.Group(func(r chi.Router) {
			r.Use(middlewares.InjectTenantAuthMiddleware(appCtx))
			r.Use(middlewares.CheckForTenantAuthPresenceMiddleware)

			r.Post("/v1/payments/offline:initiate", handlers.PaymentHandler.CreateOfflinePayment)
		})
	}
}
