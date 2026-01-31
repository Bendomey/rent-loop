package pkg

import (
	"github.com/Bendomey/rent-loop/services/main/internal/config"
	"github.com/go-playground/validator/v10"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type AppContext struct {
	DB        *gorm.DB
	RDB       *redis.Client
	Config    config.Config
	Validator *validator.Validate
}
