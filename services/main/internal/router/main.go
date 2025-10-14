package router

import (
	"fmt"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/handlers"
	appMiddleware "github.com/Bendomey/rent-loop/services/main/internal/middlewares"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"

	_ "github.com/Bendomey/rent-loop/services/main/docs"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	httpSwagger "github.com/swaggo/http-swagger"
)

// @title RentLoop API
// @version 1.0
// @description This is the RentLoop API documentation.
// @termsOfService http://rentloop.com/terms

// @contact.name Domey Benjamin
// @contact.url https://www.linkedin.com/in/benjamin-armah-kesey-domey/
// @contact.email domeybenjamin1@gmail.com

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host https://api.rentloop.com
func New(appCtx pkg.AppContext, handlers handlers.Handlers) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.CleanPath)
	r.Use(middleware.StripSlashes)

	// for more ideas, see: https://developer.github.com/v3/#cross-origin-resource-sharing
	r.Use(cors.Handler(cors.Options{
		// AllowedOrigins:   []string{"https://foo.com"}, // Use this to allow specific origin hosts
		AllowedOrigins: []string{"https://*", "http://*"},
		// AllowOriginFunc:  func(r *http.Request, origin string) bool { return true },
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"User-Agent", "Content-Type", "Accept", "Accept-Encoding", "Accept-Language", "Cache-Control", "Connection", "DNT", "Host", "Origin", "Pragma", "Referer"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	// Rate limit: max 100 requests per minute per IP.
	r.Use(httprate.LimitByIP(100, 1*time.Minute))

	r.Use(middleware.AllowContentEncoding("deflate", "gzip"))
	r.Use(middleware.AllowContentType("application/json"))
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(appMiddleware.EnforceContentType("application/json"))

	// health check
	r.Use(middleware.Heartbeat("/"))

	r.Route("/api", func(r chi.Router) {

		// for admins
		r.Group(NewAdminRouter(appCtx, handlers))

		// for client user
		// r.Group(NewClientUserRouter(appCtx, handlers))

		// for tenant account
		// r.Group(NewTenantAccountRouter(appCtx, handlers))
	})

	// serve openapi.yaml + docs
	if appCtx.Config.Env != "production" {
		r.Get("/swagger/*", httpSwagger.Handler(
			httpSwagger.URL(fmt.Sprintf("http://localhost:%s/swagger/doc.json", appCtx.Config.Port)),
		))
	}

	return r
}
