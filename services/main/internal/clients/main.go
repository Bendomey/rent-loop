package clients

import (
	"github.com/Bendomey/rent-loop/services/main/internal/clients/accounting"
	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/config"
)

type Clients struct {
	AccountingAPI accounting.Client
	GatekeeperAPI gatekeeper.Client
}

func NewClients(cfg config.Config) Clients {
	accountingClient := accounting.NewClient(accounting.ClientConfig{
		BaseURL:      cfg.Clients.AccountingAPI.BaseURL,
		ClientID:     cfg.Clients.AccountingAPI.ClientID,
		ClientSecret: cfg.Clients.AccountingAPI.ClientSecret,
	})

	gatekeeperClient := gatekeeper.NewClient(gatekeeper.ClientConfig{
		BaseURL:   cfg.Clients.GatekeeperAPI.BaseURL,
		ApiKey:    cfg.Clients.GatekeeperAPI.ApiKey,
		ProjectID: cfg.Clients.GatekeeperAPI.ProjectID,
	})

	return Clients{
		AccountingAPI: accountingClient,
		GatekeeperAPI: gatekeeperClient,
	}
}
