package main

import (
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/clients"
	"github.com/Bendomey/rent-loop/services/main/internal/config"
	"github.com/Bendomey/rent-loop/services/main/internal/db"
	"github.com/Bendomey/rent-loop/services/main/internal/handlers"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/router"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/getsentry/raven-go"
	log "github.com/sirupsen/logrus"
)

func main() {
	cfg := config.Load()

	// init sentry
	if cfg.Env == "production" {
		log.Info("Initializing Sentry...")
		pkg.Sentry(cfg.Sentry.DSN, cfg.Sentry.Environment)
	}

	database, err := db.Connect(cfg)
	if err != nil {
		raven.CaptureError(err, nil)
		log.Fatal("failed to connect db:", err)
	}

	redis, err := db.ConnectRedis(cfg)
	if err != nil {
		raven.CaptureError(err, nil)
		log.Fatal("failed to connect redis:", err)
	}

	appCtx := pkg.AppContext{
		DB:        database,
		RDB:       redis,
		Config:    cfg,
		Validator: lib.NewValidator(),
	}

	repository := repository.NewRepository(database)
	clients := clients.NewClients(cfg)
	services := services.NewServices(services.INewServicesParams{
		AppCtx:     appCtx,
		Repository: repository,
		Clients:    clients,
	})
	handlers := handlers.NewHandlers(appCtx, services)

	r := router.New(appCtx, handlers)

	log.Printf("Server running on :%s\n", cfg.Port)

	log.Printf(`[RentLoop] :: Server started successfully on http://localhost:%v`, cfg.Port)
	errServer := http.ListenAndServe(":"+cfg.Port, r)

	if errServer != nil {
		raven.CaptureError(errServer, nil)
		log.Fatalf("Error occurred while serving rentloop engine, %v", errServer)
	}
}
