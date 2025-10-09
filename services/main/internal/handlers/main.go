package handlers

import (
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/go-playground/validator/v10"
)

type Handlers struct {
	// ClientHandler       ClientHandler
}

func NewHandlers(services services.Services, validate *validator.Validate) Handlers {

	// clientHandler := NewClientHandler(services.ClientService, validate)

	return Handlers{
		// ClientHandler: clientHandler,
	}
}
