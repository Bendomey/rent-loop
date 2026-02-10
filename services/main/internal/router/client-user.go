package router

import (
	"github.com/Bendomey/rent-loop/services/main/internal/handlers"
	"github.com/Bendomey/rent-loop/services/main/internal/middlewares"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

func NewClientUserRouter(appCtx pkg.AppContext, handlers handlers.Handlers) func(r chi.Router) {
	return func(r chi.Router) {
		r.Use(middlewares.InjectClientUserAuthMiddleware(appCtx))

		// unprotected client user routes
		r.Group(func(r chi.Router) {
			r.Post("/v1/clients/apply", handlers.ClientApplicationHandler.CreateClientApplication)
			r.Post("/v1/client-users/login", handlers.ClientUserHandler.AuthenticateClientUser)
			r.Post(
				"/v1/client-users/forgot-password",
				handlers.ClientUserHandler.SendForgotPasswordResetLink,
			)
			r.Get("/v1/units/{unit_id}", handlers.UnitHandler.FetchClientUnit)
		})

		// protected client user routes
		r.Group(func(r chi.Router) {
			r.Use(middlewares.CheckForClientUserAuthPresenceMiddleware)

			// client users
			r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
				Post("/v1/client-users", handlers.ClientUserHandler.CreateClientUser)
			r.Post(
				"/v1/client-users/reset-password",
				handlers.ClientUserHandler.ResetClientUserPassword,
			)
			r.Get("/v1/client-users", handlers.ClientUserHandler.ListClientUsers)
			r.Route("/v1/client-users/me", func(r chi.Router) {
				r.Get("/", handlers.ClientUserHandler.GetMe)
				r.Patch("/", handlers.ClientUserHandler.UpdateClientUserSelf)
				r.Patch("/password", handlers.ClientUserHandler.UpdateClientUserPassword)
			})

			r.Route("/v1/client-users/{client_user_id}", func(r chi.Router) {
				r.Get("/", handlers.ClientUserHandler.GetClientUserWithPopulate)
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Post("/properties:link", handlers.ClientUserPropertyHandler.LinkClientUserToProperties)
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Delete("/properties:unlink", handlers.ClientUserPropertyHandler.UnlinkClientUserFromProperties)
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Post("/activate", handlers.ClientUserHandler.ActivateClientUser)
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Post("/deactivate", handlers.ClientUserHandler.DeactivateClientUser)
			})

			// properties
			r.Route("/v1/properties", func(r chi.Router) {
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Post("/", handlers.PropertyHandler.CreateProperty)
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Get("/", handlers.PropertyHandler.ListProperties)

				// client user properties
				r.Get("/me", handlers.ClientUserPropertyHandler.ListClientUserProperties)

				r.Get("/slug/{slug}", handlers.PropertyHandler.GetPropertyBySlug)

				r.Route("/{property_id}", func(r chi.Router) {
					r.Get("/", handlers.PropertyHandler.GetPropertyById)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Patch("/", handlers.PropertyHandler.UpdateProperty)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Delete("/", handlers.PropertyHandler.DeleteProperty)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Post("/client-users:link", handlers.ClientUserPropertyHandler.LinkPropertyToClientUsers)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Delete("/client-users:unlink", handlers.ClientUserPropertyHandler.UnlinkPropertyFromClientUsers)

					r.Route("/blocks", func(r chi.Router) {
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/", handlers.PropertyBlockHandler.CreatePropertyBlock)
						r.Get("/", handlers.PropertyBlockHandler.ListPropertyBlocks)
						r.Route("/{block_id}", func(r chi.Router) {
							r.Get("/", handlers.PropertyBlockHandler.GetPropertyBlock)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/", handlers.PropertyBlockHandler.UpdatePropertyBlock)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Delete("/", handlers.PropertyBlockHandler.DeletePropertyBlock)

							r.Route("/units", func(r chi.Router) {
								r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
									Post("/", handlers.UnitHandler.CreateUnit)
							})
						})
					})

					// units
					r.Route("/units", func(r chi.Router) {
						r.Get("/", handlers.UnitHandler.ListUnits)
						r.Route("/{unit_id}", func(r chi.Router) {
							r.Get("/", handlers.UnitHandler.GetUnit)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/", handlers.UnitHandler.UpdateUnit)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Delete("/", handlers.UnitHandler.DeleteUnit)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/status:draft", handlers.UnitHandler.UpdateUnitToDraftStatus)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/status:maintenance", handlers.UnitHandler.UpdateUnitToMaintenanceStatus)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/status:available", handlers.UnitHandler.UpdateUnitToAvailableStatus)
						})
					})
				})
			})

			// documents
			r.Route("/v1/documents", func(r chi.Router) {
				r.Post("/", handlers.DocumentHandler.CreateDocument)
				r.Get("/", handlers.DocumentHandler.ListDocuments)

				r.Route("/{document_id}", func(r chi.Router) {
					r.Get("/", handlers.DocumentHandler.GetDocumentById)
					r.Patch("/", handlers.DocumentHandler.UpdateDocument)
					r.Delete("/", handlers.DocumentHandler.DeleteDocument)
				})
			})

			// client user properties
			r.Route("/v1/client-user-properties", func(r chi.Router) {
				r.Get("/", handlers.ClientUserPropertyHandler.ListAllClientUserProperties)
				r.Get(
					"/{client_user_property_id}",
					handlers.ClientUserPropertyHandler.FetchClientUserPropertyWithPopulate,
				)
			})

			r.Route("/v1/tenant-applications", func(r chi.Router) {
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Post("/invite", handlers.TenantApplicationHandler.SendTenantInvite)
				r.Get("/", handlers.TenantApplicationHandler.ListTenantApplications)
				r.Get("/{tenant_application_id}", handlers.TenantApplicationHandler.GetTenantApplication)
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Patch("/{tenant_application_id}", handlers.TenantApplicationHandler.UpdateTenantApplication)
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Delete("/{tenant_application_id}", handlers.TenantApplicationHandler.DeleteTenantApplication)
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Patch("/{tenant_application_id}/cancel", handlers.TenantApplicationHandler.CancelTenantApplication)
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Post("/{tenant_application_id}/invoice:generate", handlers.TenantApplicationHandler.GenerateInvoice)
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Post("/{tenant_application_id}/invoice/{invoice_id}/pay", handlers.TenantApplicationHandler.PayInvoice)
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Patch("/{tenant_application_id}/approve", handlers.TenantApplicationHandler.ApproveTenantApplication)
			})

			r.Route("/v1/leases", func(r chi.Router) {
				r.Get("/{lease_id}", handlers.LeaseHandler.GetLeaseByID)
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Patch("/{lease_id}", handlers.LeaseHandler.UpdateLease)
			})

			r.Route("/v1/payment-accounts", func(r chi.Router) {
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Post("/", handlers.PaymentAccountHandler.CreatePaymentAccount)
				r.Get("/", handlers.PaymentAccountHandler.ListPaymentAccounts)
				r.Route("/{payment_account_id}", func(r chi.Router) {
					r.Get("/", handlers.PaymentAccountHandler.GetPaymentAccountById)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Patch("/", handlers.PaymentAccountHandler.UpdatePaymentAccount)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Delete("/", handlers.PaymentAccountHandler.DeletePaymentAccount)
				})
			})

			r.Route("/v1/invoices", func(r chi.Router) {
				r.Get("/", handlers.InvoiceHandler.ListInvoices)
				r.Route("/{invoice_id}", func(r chi.Router) {
					r.Get("/", handlers.InvoiceHandler.GetInvoiceByID)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Patch("/", handlers.InvoiceHandler.UpdateInvoice)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Patch("/void", handlers.InvoiceHandler.VoidInvoice)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Post("/line-items", handlers.InvoiceHandler.AddLineItem)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Delete("/line-items/{line_item_id}", handlers.InvoiceHandler.RemoveLineItem)
					r.Get("/line-items", handlers.InvoiceHandler.GetLineItems)
				})
			})
		})
	}
}
