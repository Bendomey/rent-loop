package clients

import (
	"github.com/Bendomey/rent-loop/services/main/internal/clients/accounting"
	"github.com/Bendomey/rent-loop/services/main/internal/clients/fcm"
	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/config"
	log "github.com/sirupsen/logrus"
)

type Clients struct {
	AccountingAPI accounting.Client
	GatekeeperAPI gatekeeper.Client
	FCM           fcm.Client
}

func NewClients(cfg config.Config) Clients {
	accountingClient := accounting.NewClient(accounting.ClientConfig{
		BaseURL:      cfg.Clients.AccountingAPI.BaseURL,
		ClientID:     cfg.Clients.AccountingAPI.ClientID,
		ClientSecret: cfg.Clients.AccountingAPI.ClientSecret,
	})

	gatekeeperClient := gatekeeper.NewClient(cfg)

	fcmClient, err := fcm.New(cfg.Firebase.ServiceAccountJSON)
	if err != nil {
		log.Fatalf("failed to initialize FCM client: %v", err)
	}

	return Clients{
		AccountingAPI: accountingClient,
		GatekeeperAPI: gatekeeperClient,
		FCM:           fcmClient,
	}
}
