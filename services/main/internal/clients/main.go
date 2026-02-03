package clients

import (
	"github.com/Bendomey/rent-loop/services/main/internal/clients/accounting"
	"github.com/Bendomey/rent-loop/services/main/internal/config"
)

type Clients struct {
	AccountingAPI accounting.Client
}

func NewClients(cfg config.Config) Clients {
	accountingClient := accounting.NewClient(accounting.ClientConfig{
		BaseURL:      cfg.Clients.AccountingAPI.BaseURL,
		ClientID:     cfg.Clients.AccountingAPI.ClientID,
		ClientSecret: cfg.Clients.AccountingAPI.ClientSecret,
	})

	return Clients{
		AccountingAPI: accountingClient,
	}
}
