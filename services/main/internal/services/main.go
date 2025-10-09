package services

import (
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
)

type Services struct {
	// ClientService       ClientService
}

func NewServices(repository repository.Repository) Services {

	// clientService := NewClientService(repository.ClientRepository)

	return Services{
		// ClientService: clientService,
	}
}
