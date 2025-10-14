package pkg

import (
	"github.com/Bendomey/rent-loop/services/main/internal/config"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

type AppContext struct {
	DB        *gorm.DB
	Config    config.Config
	Validator *validator.Validate
}
