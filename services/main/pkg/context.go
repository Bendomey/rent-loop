package pkg

import (
	"github.com/Bendomey/rent-loop/services/main/internal/config"
	"github.com/Bendomey/rent-loop/services/main/internal/handlers"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

type AppContext struct {
	DB         *gorm.DB
	Config     config.Config
	Repository repository.Repository
	Handlers   handlers.Handlers
	Services   services.Services
	Validator  *validator.Validate
}
