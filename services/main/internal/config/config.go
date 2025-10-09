package config

import (
	"os"
)

type IDatabase struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

type ISentry struct {
	DSN         string
	Environment string
}

type IDefaultData struct {
	SuperAdminName     string
	SuperAdminEmail    string
	SuperAdminPassword string
}

type Config struct {
	Port        string
	Database    IDatabase
	Env         string // development, staging, production
	Sentry      ISentry
	DefaultData IDefaultData
}

// Load loads config from environment variables
func Load() Config {
	return Config{
		Port: getEnv("PORT", "8080"),
		Env:  getEnv("GO_ENV", "development"),
		Database: IDatabase{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "your_user"),
			Password: getEnv("DB_PASS", "your_password"),
			Name:     getEnv("DB_NAME", "your_database"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Sentry: ISentry{
			DSN:         getEnv("SENTRY_DSN", ""),
			Environment: getEnv("SENTRY_ENVIRONMENT", "development"),
		},
		DefaultData: IDefaultData{
			SuperAdminName:     getEnv("SUPER_ADMIN_NAME", "Super Admin"),
			SuperAdminEmail:    getEnv("SUPER_ADMIN_EMAIL", "admin@example.com"),
			SuperAdminPassword: getEnv("SUPER_ADMIN_PASSWORD", "password"),
		},
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
