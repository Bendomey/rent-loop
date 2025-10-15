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

type ITokenGenerationSecret struct {
	AdminSecret      string
	ClientUserSecret string
	TenantUserSecret string
}

type IWittyflow struct {
	AppID     string
	AppSecret string
}

type Config struct {
	Port         string
	Database     IDatabase
	Env          string // development, staging, production
	Sentry       ISentry
	DefaultData  IDefaultData
	TokenSecrets ITokenGenerationSecret
	Wittyflow    IWittyflow
	ResendAPIKey string
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
		TokenSecrets: ITokenGenerationSecret{
			AdminSecret:      getEnv("ADMIN_SECRET", "superduperadminsecret"),
			ClientUserSecret: getEnv("CLIENT_USER_SECRET", "superduperclientusersecret"),
			TenantUserSecret: getEnv("TENANT_USER_SECRET", "superdupertenantusersecret"),
		},
		Wittyflow: IWittyflow{
			AppID:     getEnv("WITTYFLOW_APP_ID", "fake-app-id"),
			AppSecret: getEnv("WITTYFLOW_APP_SECRET", "fake-app-secret"),
		},
		ResendAPIKey: getEnv("RESEND_API_KEY", "fake-api-key"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
