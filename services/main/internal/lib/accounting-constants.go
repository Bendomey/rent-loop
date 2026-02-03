package lib

// AccountKey represents a chart of accounts entry type.
// These are the standard accounts used throughout the rent-loop system
// for recording financial transactions.
type AccountKey string

const (
	// Asset Accounts
	AccountKeyCashBank           AccountKey = "CASH_BANK"           // Main operating cash/bank account
	AccountKeyAccountsReceivable AccountKey = "ACCOUNTS_RECEIVABLE" // Tenant receivables

	// Liability Accounts
	AccountKeySecurityDepositsHeld AccountKey = "SECURITY_DEPOSITS_HELD" // Tenant security deposits held

	// Income Accounts
	AccountKeyRentalIncome             AccountKey = "RENTAL_INCOME"             // Rental income
	AccountKeyMaintenanceReimbursement AccountKey = "MAINTENANCE_REIMBURSEMENT" // Maintenance costs reimbursed by tenants
	AccountKeySubscriptionRevenue      AccountKey = "SUBSCRIPTION_REVENUE"      // SaaS subscription revenue

	// Expense Accounts
	AccountKeyMaintenanceExpense        AccountKey = "MAINTENANCE_EXPENSE"         // Property maintenance costs
	AccountKeyPropertyManagementExpense AccountKey = "PROPERTY_MANAGEMENT_EXPENSE" // Property management fees
)

// String returns the string representation of the account key
func (k AccountKey) String() string {
	return string(k)
}
