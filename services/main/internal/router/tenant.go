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
			r.Get("/v1/tenants/phone/{phone}", handlers.TenantHandler.GetTenantByPhone)
			r.Post("/v1/auth/codes", handlers.AuthHandler.SendCode)
			r.Post("/v1/auth/codes/verify", handlers.AuthHandler.VerifyCode)
			r.Post("/v1/tenant-accounts/auth/codes", handlers.AuthHandler.SendTenantCode)
			r.Post("/v1/tenant-accounts/auth/codes/verify", handlers.AuthHandler.VerifyTenantCode)

			// Public tracking routes (no auth required)
			r.Get("/v1/tenant-applications/code/{code}", handlers.TenantApplicationHandler.GetTenantApplicationByCode)
			r.Post("/v1/tenant-applications/code/{code}/otp:send", handlers.TenantApplicationHandler.SendTrackingOtp)
			r.Post(
				"/v1/tenant-applications/code/{code}/otp:verify",
				handlers.TenantApplicationHandler.VerifyTrackingOtp,
			)
			r.Post(
				"/v1/tenant-applications/code/{code}/invoice/{invoice_id}/pay",
				handlers.TenantApplicationHandler.PayTrackingInvoice,
			)
		})

		// protected tenant user routes
		r.Group(func(r chi.Router) {
			r.Use(middlewares.InjectTenantAuthMiddleware(appCtx))
			r.Use(middlewares.CheckForTenantAuthPresenceMiddleware)

			r.Get("/v1/tenant-accounts/me", handlers.TenantAccountHandler.GetMe)
			r.Get("/v1/leases", handlers.LeaseHandler.ListLeasesByTenantAccount)
			r.Post("/v1/payments/offline:initiate", handlers.PaymentHandler.CreateOfflinePayment)
			r.Post("/v1/tenant-accounts/fcm-token", handlers.NotificationHandler.RegisterFcmToken)
			r.Delete("/v1/tenant-accounts/fcm-token", handlers.NotificationHandler.DeleteFcmToken)

			// tenant announcements
			r.Get("/v1/leases/{lease_id}/announcements", handlers.AnnouncementHandler.ListTenantAnnouncements)
			r.Get("/v1/announcements/{announcement_id}", handlers.AnnouncementHandler.GetTenantAnnouncement)
			r.Post("/v1/announcements/{announcement_id}/read", handlers.AnnouncementHandler.MarkAnnouncementRead)

			// tenant maintenance requests
			r.Post("/v1/leases/{lease_id}/maintenance-requests", handlers.MaintenanceRequestHandler.TenantCreate)
			r.Get("/v1/leases/{lease_id}/maintenance-requests", handlers.MaintenanceRequestHandler.TenantList)
			r.Get("/v1/leases/{lease_id}/maintenance-requests/{id}", handlers.MaintenanceRequestHandler.TenantGet)
		})
	}
}
