package accounting

import "time"

// ============================================================================
// Common Types (matching fincore-engine)
// ============================================================================

type AccountType string

const (
	AccountTypeAsset     AccountType = "ASSET"
	AccountTypeLiability AccountType = "LIABILITY"
	AccountTypeEquity    AccountType = "EQUITY"
	AccountTypeIncome    AccountType = "INCOME"
	AccountTypeExpense   AccountType = "EXPENSE"
)

type JournalEntryStatus string

const (
	JournalEntryStatusDraft  JournalEntryStatus = "DRAFT"
	JournalEntryStatusPosted JournalEntryStatus = "POSTED"
)

// ============================================================================
// Account (Chart of Accounts) - matches fincore-engine/internal/models/account.go
// ============================================================================

type Account struct {
	ID              string    `json:"id"`
	Code            string    `json:"code"`
	Name            string    `json:"name"`
	Description     *string   `json:"description"`
	Type            string    `json:"type"` // EXPENSE | LIABILITY | EQUITY | ASSET | INCOME
	IsContra        bool      `json:"is_contra"`
	IsGroup         bool      `json:"is_group"`
	ParentAccountID *string   `json:"parent_account_id"`
	ParentAccount   *Account  `json:"parent_account,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type CreateAccountRequest struct {
	Name            string  `json:"name"`
	Type            string  `json:"type"` // EXPENSE | LIABILITY | EQUITY | ASSET | INCOME
	IsContra        bool    `json:"is_contra"`
	IsGroup         bool    `json:"is_group"`
	ParentAccountID *string `json:"parent_account_id,omitempty"`
	Description     *string `json:"description,omitempty"`
}

type UpdateAccountRequest struct {
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
}

type ListAccountsRequest struct {
	ParentAccountID *string `json:"parent_account_id,omitempty"`
	AccountType     *string `json:"account_type,omitempty"`
	IsContra        *bool   `json:"is_contra,omitempty"`
	IsGroup         *bool   `json:"is_group,omitempty"`
	Page            int     `json:"page,omitempty"`
	PageSize        int     `json:"page_size,omitempty"`
	Search          string  `json:"search,omitempty"`
	Order           string  `json:"order,omitempty"`    // asc, desc
	OrderBy         string  `json:"order_by,omitempty"` // field to order by
}

type ListAccountsResponse struct {
	Data       []Account `json:"data"`
	TotalCount int64     `json:"total_count"`
	Page       int       `json:"page"`
	PageSize   int       `json:"page_size"`
}

// ============================================================================
// Journal Entry - matches fincore-engine/internal/models/journal-entry.go
// ============================================================================

type JournalEntry struct {
	ID                string             `json:"id"`
	Status            string             `json:"status"` // DRAFT, POSTED
	PostedAt          *time.Time         `json:"posted_at"`
	Reference         string             `json:"reference"`
	TransactionDate   time.Time          `json:"transaction_date"`
	Metadata          map[string]any     `json:"metadata"`
	JournalEntryLines []JournalEntryLine `json:"lines,omitempty"`
	CreatedAt         time.Time          `json:"created_at"`
	UpdatedAt         time.Time          `json:"updated_at"`
}

// ============================================================================
// Journal Entry Line - matches fincore-engine/internal/models/journal-entry-line.go
// ============================================================================

type JournalEntryLine struct {
	ID             string        `json:"id"`
	JournalEntryID string        `json:"journal_entry_id"`
	JournalEntry   *JournalEntry `json:"journal_entry,omitempty"`
	AccountID      string        `json:"account_id"`
	Account        *Account      `json:"account,omitempty"`
	Notes          *string       `json:"notes"`
	Debit          int64         `json:"debit"`  // Amount in smallest currency unit
	Credit         int64         `json:"credit"` // Amount in smallest currency unit
	CreatedAt      time.Time     `json:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at"`
}

type CreateJournalEntryLineRequest struct {
	AccountID string  `json:"account_id"`
	Notes     *string `json:"notes,omitempty"`
	Debit     int64   `json:"debit"`
	Credit    int64   `json:"credit"`
}

type CreateJournalEntryRequest struct {
	Status          string                          `json:"status"` // DRAFT, POSTED
	Reference       string                          `json:"reference"`
	TransactionDate *string                         `json:"transaction_date,omitempty"`
	Metadata        map[string]any                  `json:"metadata,omitempty"`
	Lines           []CreateJournalEntryLineRequest `json:"lines"`
}

type UpdateJournalEntryLineRequest struct {
	ID        *string `json:"id,omitempty"`
	AccountID *string `json:"account_id,omitempty"`
	Notes     *string `json:"notes,omitempty"`
	Debit     *int64  `json:"debit,omitempty"`
	Credit    *int64  `json:"credit,omitempty"`
}

type UpdateJournalEntryRequest struct {
	Reference       *string                          `json:"reference,omitempty"`
	TransactionDate *string                          `json:"transaction_date,omitempty"`
	Metadata        map[string]any                   `json:"metadata,omitempty"`
	Lines           *[]UpdateJournalEntryLineRequest `json:"lines,omitempty"`
}

type ListJournalEntriesRequest struct {
	Status   *string `json:"status,omitempty"` // DRAFT, POSTED
	Page     int     `json:"page,omitempty"`
	PageSize int     `json:"page_size,omitempty"`
	Search   string  `json:"search,omitempty"`
	Order    string  `json:"order,omitempty"`
	OrderBy  string  `json:"order_by,omitempty"`
}

type ListJournalEntriesResponse struct {
	Data       []JournalEntry `json:"data"`
	TotalCount int64          `json:"total_count"`
	Page       int            `json:"page"`
	PageSize   int            `json:"page_size"`
}

// ============================================================================
// API Response Wrapper
// ============================================================================

type APIResponse[T any] struct {
	Data   T      `json:"data,omitempty"`
	Errors *Error `json:"errors,omitempty"`
}

type Error struct {
	Message string `json:"message"`
}

// ============================================================================
// Populate Options
// ============================================================================

type AccountPopulate string

const (
	AccountPopulateParentAccount AccountPopulate = "ParentAccount"
)

type JournalEntryPopulate string

const (
	JournalEntryPopulateLines   JournalEntryPopulate = "JournalEntryLines"
	JournalEntryPopulateAccount JournalEntryPopulate = "Account"
)
