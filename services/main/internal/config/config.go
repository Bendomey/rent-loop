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

type IRedisDB struct {
	Url string
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

type IRentloopSupport struct {
	Email string
	Phone string
}

type IRentloopPortals struct {
	AdminPortalURL           string
	PropertyManagerPortalURL string
	TenantPortalURL          string
	WebsiteURL               string
}

type IAccountingAPI struct {
	BaseURL      string
	ClientID     string
	ClientSecret string
}

type IGatekeeperAPI struct {
	BaseURL   string
	ApiKey    string
	ProjectID string
}

// IChartOfAccounts holds the fincore account IDs for each account type.
// These are loaded from environment variables since they differ per environment.
type IChartOfAccounts struct {
	// Asset Accounts
	CashBankAccountID    string
	AccountsReceivableID string

	// Liability Accounts
	SecurityDepositsHeldID string

	// Income Accounts
	RentalIncomeID             string
	MaintenanceReimbursementID string
	SubscriptionRevenueID      string

	// Expense Accounts
	MaintenanceExpenseID        string
	PropertyManagementExpenseID string
}

type IClients struct {
	AccountingAPI IAccountingAPI
	GatekeeperAPI IGatekeeperAPI
}

type Config struct {
	Port            string
	Database        IDatabase
	Env             string // development, staging, production
	Sentry          ISentry
	DefaultData     IDefaultData
	TokenSecrets    ITokenGenerationSecret
	Wittyflow       IWittyflow
	ResendAPIKey    string
	SupportData     IRentloopSupport
	Portals         IRentloopPortals
	RedisDB         IRedisDB
	Clients         IClients
	ChartOfAccounts IChartOfAccounts
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
		SupportData: IRentloopSupport{
			Email: getEnv("SUPPORT_EMAIL", "domeybenjamin1@gmail.com"),
			Phone: getEnv("SUPPORT_PHONE", "0201080802"),
		},
		Portals: IRentloopPortals{
			AdminPortalURL:           getEnv("ADMIN_PORTAL_URL", "http://localhost:3001"),
			PropertyManagerPortalURL: getEnv("PROPERTY_MANAGER_PORTAL_URL", "http://localhost:3000"),
			TenantPortalURL:          getEnv("TENANT_PORTAL_URL", "http://localhost:3002"),
			WebsiteURL:               getEnv("WEBSITE_URL", "http://localhost:3003"),
		},
		RedisDB: IRedisDB{
			Url: getEnv("REDIS_URL", "redis://localhost:6379"),
		},
		Clients: IClients{
			AccountingAPI: IAccountingAPI{
				BaseURL:      getEnv("FINCORE_API_BASE_URL", "http://localhost:8081/api/v1"),
				ClientID:     getEnv("FINCORE_CLIENT_ID", ""),
				ClientSecret: getEnv("FINCORE_CLIENT_SECRET", ""),
			},
			GatekeeperAPI: IGatekeeperAPI{
				BaseURL:   getEnv("GATEKEEPER_API_BASE_URL", "http://localhost:8082/api/v1"),
				ApiKey:    getEnv("GATEKEEPER_API_KEY", "fake-api-key"),
				ProjectID: getEnv("GATEKEEPER_PROJECT_ID", "fake-project-id"),
			},
		},
		ChartOfAccounts: IChartOfAccounts{
			// Asset Accounts
			CashBankAccountID:    getEnv("FINCORE_ACCOUNT_CASH_BANK", ""),
			AccountsReceivableID: getEnv("FINCORE_ACCOUNT_RECEIVABLE", ""),

			// Liability Accounts
			SecurityDepositsHeldID: getEnv("FINCORE_ACCOUNT_SECURITY_DEPOSITS", ""),

			// Income Accounts
			RentalIncomeID:             getEnv("FINCORE_ACCOUNT_RENTAL_INCOME", ""),
			MaintenanceReimbursementID: getEnv("FINCORE_ACCOUNT_MAINTENANCE_REIMBURSEMENT", ""),
			SubscriptionRevenueID:      getEnv("FINCORE_ACCOUNT_SUBSCRIPTION_REVENUE", ""),

			// Expense Accounts
			MaintenanceExpenseID:        getEnv("FINCORE_ACCOUNT_MAINTENANCE_EXPENSE", ""),
			PropertyManagementExpenseID: getEnv("FINCORE_ACCOUNT_PROPERTY_MGMT_EXPENSE", ""),
		},
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
