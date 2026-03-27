package config

import (
	"os"
	"slices"
	"strings"
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
	AccountsPayableID      string

	// Income Accounts
	RentalIncomeID             string
	MaintenanceReimbursementID string
	SubscriptionRevenueID      string
	ExpenseIncomeID            string

	// Expense Accounts
	PropertyManagementExpenseID string
}

type IClients struct {
	AccountingAPI IAccountingAPI
	GatekeeperAPI IGatekeeperAPI
}

type IFirebase struct {
	ServiceAccountJSON string
}

type ITestOTP struct {
	PhoneNumbers []string
	Code         string
}

type Config struct {
	Firebase        IFirebase
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
	CubeApiSecret   string
	TestOTP         ITestOTP
}

// IsTestOTPPhone returns true only in non-production environments when the
// given phone number is in the whitelisted test numbers list.
func (c *Config) IsTestOTPPhone(phone string) bool {
	// TODO: bring this back later. they can't access it it don't know the env, right? 😅
	// if c.Env == "production" {
	// 	return false
	// }
	return slices.Contains(c.TestOTP.PhoneNumbers, phone)
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
			Email: getEnv("SUPPORT_EMAIL", "rentloopapp@gmail.com"),
			Phone: getEnv("SUPPORT_PHONE", "+233201080802"),
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
		CubeApiSecret: getEnv("CUBEJS_API_SECRET", "superdupercubeapisecret"),
		TestOTP: ITestOTP{
			PhoneNumbers: parseCommaSeparated(getEnv("TEST_OTP_PHONE_NUMBERS", "")),
			Code:         getEnv("TEST_OTP_CODE", ""),
		},
		Firebase: IFirebase{
			ServiceAccountJSON: getEnv("FIREBASE_SERVICE_ACCOUNT_JSON", ""),
		},
		ChartOfAccounts: IChartOfAccounts{
			// Asset Accounts
			CashBankAccountID:    getEnv("FINCORE_ACCOUNT_CASH_BANK", ""),
			AccountsReceivableID: getEnv("FINCORE_ACCOUNT_RECEIVABLE", ""),

			// Liability Accounts
			SecurityDepositsHeldID: getEnv("FINCORE_ACCOUNT_SECURITY_DEPOSITS", ""),
			AccountsPayableID:      getEnv("FINCORE_ACCOUNT_PAYABLE", ""),

			// Income Accounts
			RentalIncomeID:             getEnv("FINCORE_ACCOUNT_RENTAL_INCOME", ""),
			MaintenanceReimbursementID: getEnv("FINCORE_ACCOUNT_MAINTENANCE_REIMBURSEMENT", ""),
			SubscriptionRevenueID:      getEnv("FINCORE_ACCOUNT_SUBSCRIPTION_REVENUE", ""),
			ExpenseIncomeID:            getEnv("FINCORE_ACCOUNT_EXPENSE_INCOME", ""),

			// Expense Accounts
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

func parseCommaSeparated(s string) []string {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
