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
			r.Post("/v1/client-users/forgot-password", handlers.ClientUserHandler.SendForgotPasswordResetLink)
		})

		// protected client user routes
		r.Group(func(r chi.Router) {
			r.Use(middlewares.CheckForClientUserAuthPresenceMiddleware)
			r.Post("/v1/client-users", handlers.ClientUserHandler.CreateClientUser)
			r.Get("/v1/client-users/me", handlers.ClientUserHandler.GetMe)
			r.Post("/v1/client-users/reset-password", handlers.ClientUserHandler.ResetClientUserPassword)

			// properties
			r.Post("/v1/properties", handlers.PropertyHandler.CreateProperty)

			r.Route("/v1/documents", func(r chi.Router) {
				r.Post("/", handlers.DocumentHandler.CreateDocument)
				r.Get("/", handlers.DocumentHandler.ListDocuments)

				r.Route("/{document_id}", func(r chi.Router) {
					r.Get("/", handlers.DocumentHandler.GetDocumentById)
					r.Patch("/", handlers.DocumentHandler.UpdateDocument)
					r.Delete("/", handlers.DocumentHandler.DeleteDocument)
				})
			})
		})
	}
}
