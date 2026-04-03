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
			r.Post("/v1/waitlist", handlers.WaitlistHandler.CreateWaitlistEntry)

			r.Post("/v1/admin/clients/apply", handlers.ClientApplicationHandler.CreateClientApplication)
			r.Post("/v1/admin/client-users/login", handlers.ClientUserHandler.AuthenticateClientUser)
			r.Post(
				"/v1/admin/client-users/forgot-password",
				handlers.ClientUserHandler.SendForgotPasswordResetLink,
			)
			r.Get("/v1/units/{unit_id}", handlers.UnitHandler.FetchClientUnit)

			// signing (token-based auth, no JWT required)
			r.Get("/v1/signing/{token}/verify", handlers.SigningHandler.VerifyToken)
			r.Post("/v1/signing/{token}/sign", handlers.SigningHandler.SignDocument)

			r.Post(
				"/v1/tenant-applications",
				handlers.TenantApplicationHandler.CreateTenantApplication,
			)
			r.Patch(
				"/v1/tenant-applications/{tenant_application_id}",
				handlers.TenantApplicationHandler.UpdateTenantApplication,
			)
			r.Get(
				"/v1/tenant-applications/{tenant_application_id}",
				handlers.TenantApplicationHandler.GetTenantApplication,
			)

			r.Patch("/v1/documents/{document_id}", handlers.DocumentHandler.UpdateDocument)
		})

		// protected client user routes
		r.Group(func(r chi.Router) {
			r.Use(middlewares.CheckForClientUserAuthPresenceMiddleware)

			// analytics
			r.Get("/v1/admin/analytics/token", handlers.AnalyticsHandler.GetToken)

			// clients
			r.Route("/v1/admin/clients", func(r chi.Router) {
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Patch("/{client_id}", handlers.ClientHandler.UpdateClient)
			})

			// client users
			r.Route("/v1/admin/client-users", func(r chi.Router) {
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Post("/", handlers.ClientUserHandler.CreateClientUser)
				r.Post(
					"/reset-password",
					handlers.ClientUserHandler.ResetClientUserPassword,
				)

				r.Get("/", handlers.ClientUserHandler.ListClientUsers)
				r.Route("/me", func(r chi.Router) {
					r.Get("/", handlers.ClientUserHandler.GetMe)
					r.Patch("/", handlers.ClientUserHandler.UpdateClientUserSelf)
					r.Patch("/password", handlers.ClientUserHandler.UpdateClientUserPassword)
				})

				r.Route("/{client_user_id}", func(r chi.Router) {
					r.Get("/", handlers.ClientUserHandler.GetClientUserWithPopulate)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Patch("/", handlers.ClientUserHandler.UpdateClientUserByID)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Post("/properties:link", handlers.ClientUserPropertyHandler.LinkClientUserToProperties)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Delete("/properties:unlink", handlers.ClientUserPropertyHandler.UnlinkClientUserFromProperties)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Post("/activate", handlers.ClientUserHandler.ActivateClientUser)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Post("/deactivate", handlers.ClientUserHandler.DeactivateClientUser)
				})
			})

			// properties
			r.Route("/v1/admin/properties", func(r chi.Router) {
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Post("/", handlers.PropertyHandler.CreateProperty)
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Get("/", handlers.PropertyHandler.ListProperties)

				// client user properties
				r.Get("/me", handlers.ClientUserPropertyHandler.ListClientUserProperties)

				r.Get("/slug/{slug}", handlers.PropertyHandler.GetPropertyBySlug)

				r.Route("/{property_id}", func(r chi.Router) {
					r.Get("/leases", handlers.LeaseHandler.ListLeasesByProperty)
					r.Get("/tenants", handlers.TenantHandler.ListTenantsByProperty)
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

					// property-scoped expenses
					r.Route("/expenses", func(r chi.Router) {
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/", handlers.ExpenseHandler.AddExpense)
						r.Get("/", handlers.ExpenseHandler.ListPropertyExpenses)
						r.Route("/{expense_id}", func(r chi.Router) {
							r.Get("/", handlers.ExpenseHandler.GetExpense)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Delete("/", handlers.ExpenseHandler.DeleteExpense)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Post("/generate:invoice", handlers.ExpenseHandler.GenerateExpenseInvoice)
						})
					})

					// property-scoped announcements
					r.Route("/announcements", func(r chi.Router) {
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/", handlers.AnnouncementHandler.CreateAnnouncement)
						r.Get("/", handlers.AnnouncementHandler.ListAnnouncements)
						r.Route("/{announcement_id}", func(r chi.Router) {
							r.Get("/", handlers.AnnouncementHandler.GetAnnouncementById)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/", handlers.AnnouncementHandler.UpdateAnnouncement)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Delete("/", handlers.AnnouncementHandler.DeleteAnnouncement)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Post("/publish", handlers.AnnouncementHandler.PublishAnnouncement)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Post("/schedule", handlers.AnnouncementHandler.ScheduleAnnouncement)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Delete("/schedule", handlers.AnnouncementHandler.CancelScheduleAnnouncement)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/expiry", handlers.AnnouncementHandler.ExtendAnnouncementExpiry)
						})
					})

					r.Route("/tenant-applications", func(r chi.Router) {
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/invite", handlers.TenantApplicationHandler.SendTenantInvite)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/", handlers.TenantApplicationHandler.AdminCreateTenantApplication)
						r.Get("/", handlers.TenantApplicationHandler.ListTenantApplications)
						r.Get("/{tenant_application_id}", handlers.TenantApplicationHandler.AdminGetTenantApplication)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Patch("/{tenant_application_id}", handlers.TenantApplicationHandler.AdminUpdateTenantApplication)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Delete("/{tenant_application_id}", handlers.TenantApplicationHandler.DeleteTenantApplication)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Patch("/{tenant_application_id}/cancel", handlers.TenantApplicationHandler.CancelTenantApplication)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/{tenant_application_id}/invoice:generate", handlers.TenantApplicationHandler.GenerateInvoice)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/{tenant_application_id}/invoice/{invoice_id}/pay", handlers.TenantApplicationHandler.PayInvoice)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Patch("/{tenant_application_id}/approve", handlers.TenantApplicationHandler.ApproveTenantApplication)
					})

					r.Route("/signing", func(r chi.Router) {
						// property owner signing.
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/", handlers.SigningHandler.SignDocumentPM)
					})

					r.Route("/signing-tokens", func(r chi.Router) {
						// signing - generate tokens
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/", handlers.SigningHandler.GenerateToken)

						r.Get("/", handlers.SigningHandler.ListSigningTokens)
						r.Route("/{signing_token_id}", func(r chi.Router) {
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/", handlers.SigningHandler.UpdateToken)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Post("/resend", handlers.SigningHandler.ResendToken)
						})
					})

					r.Route("/leases/{lease_id}", func(r chi.Router) {
						r.Get("/", handlers.LeaseHandler.GetLeaseByID)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Patch("/", handlers.LeaseHandler.UpdateLease)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Patch("/status:active", handlers.LeaseHandler.ActivateLease)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Patch("/status:cancelled", handlers.LeaseHandler.CancelLease)

						r.Route("/checklists", func(r chi.Router) {
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Post("/", handlers.LeaseChecklistHandler.CreateLeaseChecklist)
							r.Get("/", handlers.LeaseChecklistHandler.ListLeaseChecklists)
							r.Route("/{checklist_id}", func(r chi.Router) {
								r.Get("/", handlers.LeaseChecklistHandler.GetLeaseCheckList)
								r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
									Patch("/", handlers.LeaseChecklistHandler.UpdateLeaseChecklist)
								r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
									Delete("/", handlers.LeaseChecklistHandler.DeleteLeaseChecklist)
								r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
									Post("/submit", handlers.LeaseChecklistHandler.SubmitLeaseChecklist)
								r.Get("/comparison", handlers.LeaseChecklistHandler.GetChecklistComparison)
								r.Route("/items", func(r chi.Router) {
									r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
										Post("/", handlers.LeaseChecklistHandler.CreateLeaseChecklistItem)
									r.Route("/{item_id}", func(r chi.Router) {
										r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
											Patch("/", handlers.LeaseChecklistHandler.UpdateLeaseChecklistItem)
										r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
											Delete("/", handlers.LeaseChecklistHandler.DeleteLeaseChecklistItem)
									})
								})
							})
						})
						r.Route("/expenses", func(r chi.Router) {
							r.Get("/", handlers.ExpenseHandler.ListLeaseExpenses)
						})
					})

					r.Route("/tenants/{tenant_id}", func(r chi.Router) {
						r.Get("/", handlers.TenantHandler.GetTenantByID)
						r.Get("/leases", handlers.LeaseHandler.ListLeasesByTenant)
					})

					// maintenance requests
					r.Route("/maintenance-requests", func(r chi.Router) {
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/", handlers.MaintenanceRequestHandler.Create)
						r.Get("/", handlers.MaintenanceRequestHandler.List)
						r.Route("/{maintenance_request_id}", func(r chi.Router) {
							r.Get("/", handlers.MaintenanceRequestHandler.Get)
							r.Patch("/", handlers.MaintenanceRequestHandler.Update)
							r.Post("/assign-worker", handlers.MaintenanceRequestHandler.AssignWorker)
							r.Post("/assign-manager", handlers.MaintenanceRequestHandler.AssignManager)
							r.Patch("/status", handlers.MaintenanceRequestHandler.UpdateStatus)
							r.Get("/activity_logs", handlers.MaintenanceRequestHandler.ListActivityLogs)
							r.Route("/comments", func(r chi.Router) {
								r.Post("/", handlers.MaintenanceRequestHandler.CreateComment)
								r.Get("/", handlers.MaintenanceRequestHandler.ListComments)
								r.Route("/{comment_id}", func(r chi.Router) {
									r.Patch("/", handlers.MaintenanceRequestHandler.UpdateComment)
									r.Delete("/", handlers.MaintenanceRequestHandler.DeleteComment)
								})
							})
							r.Route("/expenses", func(r chi.Router) {
								r.Get("/", handlers.ExpenseHandler.ListMRExpenses)
							})
						})
					})

					r.Route("/invoices", func(r chi.Router) {
						r.Get("/", handlers.InvoiceHandler.ListInvoices)
						r.Route("/{invoice_id}", func(r chi.Router) {
							r.Get("/", handlers.InvoiceHandler.GetInvoiceByID)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/", handlers.InvoiceHandler.UpdateInvoice)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/void", handlers.InvoiceHandler.VoidInvoice)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Delete("/", handlers.InvoiceHandler.DeleteInvoice)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Post("/line-items", handlers.InvoiceHandler.AddLineItem)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Delete("/line-items/{line_item_id}", handlers.InvoiceHandler.RemoveLineItem)
							r.Get("/line-items", handlers.InvoiceHandler.GetLineItems)
						})
					})

					// payments
					r.Route("/payments/{payment_id}", func(r chi.Router) {
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Patch("/verify", handlers.PaymentHandler.VerifyPayment)
					})
				})
			})

			// global announcements
			r.Route("/v1/admin/announcements", func(r chi.Router) {
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Post("/", handlers.AnnouncementHandler.CreateAnnouncement)
				r.Get("/", handlers.AnnouncementHandler.ListAnnouncements)
				r.Route("/{announcement_id}", func(r chi.Router) {
					r.Get("/", handlers.AnnouncementHandler.GetAnnouncementById)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Patch("/", handlers.AnnouncementHandler.UpdateAnnouncement)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Delete("/", handlers.AnnouncementHandler.DeleteAnnouncement)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Post("/publish", handlers.AnnouncementHandler.PublishAnnouncement)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Post("/schedule", handlers.AnnouncementHandler.ScheduleAnnouncement)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Delete("/schedule", handlers.AnnouncementHandler.CancelScheduleAnnouncement)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Patch("/expiry", handlers.AnnouncementHandler.ExtendAnnouncementExpiry)
				})
			})

			// documents
			r.Route("/v1/admin/documents", func(r chi.Router) {
				r.Post("/", handlers.DocumentHandler.CreateDocument)
				r.Get("/", handlers.DocumentHandler.ListDocuments)

				r.Route("/{document_id}", func(r chi.Router) {
					r.Get("/", handlers.DocumentHandler.GetDocumentById)
					r.Patch("/", handlers.DocumentHandler.AdminUpdateDocument)
					r.Delete("/", handlers.DocumentHandler.DeleteDocument)
				})
			})

			// client user properties
			r.Route("/v1/admin/client-user-properties", func(r chi.Router) {
				r.Get("/", handlers.ClientUserPropertyHandler.ListAllClientUserProperties)
				r.Get(
					"/{client_user_property_id}",
					handlers.ClientUserPropertyHandler.FetchClientUserPropertyWithPopulate,
				)
			})

			// agreements
			r.Route("/v1/admin/agreements", func(r chi.Router) {
				r.Get("/", handlers.AgreementHandler.GetAgreements)
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "OWNER")).
					Post("/{agreement_id}/accept", handlers.AgreementHandler.AcceptAgreement)
			})

			// checklist templates
			r.Route("/v1/admin/checklist-templates", func(r chi.Router) {
				r.Get("/", handlers.ChecklistTemplateHandler.ListChecklistTemplates)
				r.Get("/{template_id}", handlers.ChecklistTemplateHandler.GetChecklistTemplate)
			})

			r.Route("/v1/admin/payment-accounts", func(r chi.Router) {
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
		})
	}
}
