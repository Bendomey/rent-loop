package accounting

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// ClientConfig holds the configuration for the accounting client
type ClientConfig struct {
	BaseURL      string
	ClientID     string // fincore client_id for authentication
	ClientSecret string // fincore client_secret for authentication
	Timeout      time.Duration
}

// Client is the HTTP client for the accounting service (fincore-engine)
type Client struct {
	config     ClientConfig
	httpClient *http.Client
}

// NewClient creates a new accounting API client
func NewClient(config ClientConfig) Client {
	if config.Timeout == 0 {
		config.Timeout = 30 * time.Second
	}

	return Client{
		config: config,
		httpClient: &http.Client{
			Timeout: config.Timeout,
		},
	}
}

// ============================================================================
// Account Operations (Chart of Accounts)
// ============================================================================

// CreateAccount creates a new account in the chart of accounts
func (c *Client) CreateAccount(ctx context.Context, req CreateAccountRequest) (*Account, error) {
	var account Account
	err := c.doRequest(ctx, http.MethodPost, "/accounts", req, &account, nil)
	if err != nil {
		return nil, err
	}
	return &account, nil
}

// GetAccount retrieves an account by ID
func (c *Client) GetAccount(ctx context.Context, accountID string, populate []AccountPopulate) (*Account, error) {
	var account Account
	var populateStrings []string
	for _, p := range populate {
		populateStrings = append(populateStrings, string(p))
	}
	err := c.doRequest(ctx, http.MethodGet, fmt.Sprintf("/accounts/%s", accountID), nil, &account, populateStrings)
	if err != nil {
		return nil, err
	}
	return &account, nil
}

// UpdateAccount updates an existing account
func (c *Client) UpdateAccount(ctx context.Context, accountID string, req UpdateAccountRequest) (*Account, error) {
	var account Account
	err := c.doRequest(ctx, http.MethodPatch, fmt.Sprintf("/accounts/%s", accountID), req, &account, nil)
	if err != nil {
		return nil, err
	}
	return &account, nil
}

// DeleteAccount deletes an account
func (c *Client) DeleteAccount(ctx context.Context, accountID string) error {
	return c.doRequest(ctx, http.MethodDelete, fmt.Sprintf("/accounts/%s", accountID), nil, nil, nil)
}

// ListAccounts retrieves a list of accounts with optional filters
func (c *Client) ListAccounts(ctx context.Context, req ListAccountsRequest) (*ListAccountsResponse, error) {
	query := url.Values{}
	if req.ParentAccountID != nil {
		query.Set("parent_account_id", *req.ParentAccountID)
	}
	if req.AccountType != nil {
		query.Set("account_type", *req.AccountType)
	}
	if req.IsContra != nil {
		query.Set("is_contra", fmt.Sprintf("%t", *req.IsContra))
	}
	if req.IsGroup != nil {
		query.Set("is_group", fmt.Sprintf("%t", *req.IsGroup))
	}
	if req.Page > 0 {
		query.Set("page", fmt.Sprintf("%d", req.Page))
	}
	if req.PageSize > 0 {
		query.Set("page_size", fmt.Sprintf("%d", req.PageSize))
	}
	if req.Search != "" {
		query.Set("search", req.Search)
	}
	if req.Order != "" {
		query.Set("order", req.Order)
	}
	if req.OrderBy != "" {
		query.Set("order_by", req.OrderBy)
	}

	path := "/accounts"
	if len(query) > 0 {
		path = fmt.Sprintf("%s?%s", path, query.Encode())
	}

	var response ListAccountsResponse
	err := c.doRequest(ctx, http.MethodGet, path, nil, &response, nil)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// ============================================================================
// Journal Entry Operations
// ============================================================================

// CreateJournalEntry creates a new journal entry
func (c *Client) CreateJournalEntry(ctx context.Context, req CreateJournalEntryRequest) (*JournalEntry, error) {
	var entry JournalEntry
	err := c.doRequest(ctx, http.MethodPost, "/journal-entries", req, &entry, nil)
	if err != nil {
		return nil, err
	}
	return &entry, nil
}

// GetJournalEntry retrieves a journal entry by ID
func (c *Client) GetJournalEntry(
	ctx context.Context,
	entryID string,
	populate []JournalEntryPopulate,
) (*JournalEntry, error) {
	var entry JournalEntry
	var populateStrings []string
	for _, p := range populate {
		populateStrings = append(populateStrings, string(p))
	}
	err := c.doRequest(ctx, http.MethodGet, fmt.Sprintf("/journal-entries/%s", entryID), nil, &entry, populateStrings)
	if err != nil {
		return nil, err
	}
	return &entry, nil
}

// UpdateJournalEntry updates an existing journal entry (only if status is DRAFT)
func (c *Client) UpdateJournalEntry(
	ctx context.Context,
	entryID string,
	req UpdateJournalEntryRequest,
) (*JournalEntry, error) {
	var entry JournalEntry
	err := c.doRequest(ctx, http.MethodPatch, fmt.Sprintf("/journal-entries/%s", entryID), req, &entry, nil)
	if err != nil {
		return nil, err
	}
	return &entry, nil
}

// DeleteJournalEntry deletes a journal entry (only if status is DRAFT)
func (c *Client) DeleteJournalEntry(ctx context.Context, entryID string) error {
	return c.doRequest(ctx, http.MethodDelete, fmt.Sprintf("/journal-entries/%s", entryID), nil, nil, nil)
}

// PostJournalEntry posts a draft journal entry (changes status from DRAFT to POSTED)
func (c *Client) PostJournalEntry(ctx context.Context, entryID string) (*JournalEntry, error) {
	var entry JournalEntry
	err := c.doRequest(ctx, http.MethodPatch, fmt.Sprintf("/journal-entries/%s/post", entryID), nil, &entry, nil)
	if err != nil {
		return nil, err
	}
	return &entry, nil
}

// ListJournalEntries retrieves a list of journal entries with optional filters
func (c *Client) ListJournalEntries(
	ctx context.Context,
	req ListJournalEntriesRequest,
) (*ListJournalEntriesResponse, error) {
	query := url.Values{}
	if req.Status != nil {
		query.Set("status", *req.Status)
	}
	if req.Page > 0 {
		query.Set("page", fmt.Sprintf("%d", req.Page))
	}
	if req.PageSize > 0 {
		query.Set("page_size", fmt.Sprintf("%d", req.PageSize))
	}
	if req.Search != "" {
		query.Set("search", req.Search)
	}
	if req.Order != "" {
		query.Set("order", req.Order)
	}
	if req.OrderBy != "" {
		query.Set("order_by", req.OrderBy)
	}

	path := "/journal-entries"
	if len(query) > 0 {
		path = fmt.Sprintf("%s?%s", path, query.Encode())
	}

	var response ListJournalEntriesResponse
	err := c.doRequest(ctx, http.MethodGet, path, nil, &response, nil)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// ============================================================================
// Internal HTTP Methods
// ============================================================================

func (c *Client) doRequest(
	ctx context.Context,
	method, path string,
	body interface{},
	result interface{},
	populate []string,
) error {
	fullURL := fmt.Sprintf("%s%s", c.config.BaseURL, path)

	// Add populate query params if provided
	if len(populate) > 0 {
		if strings.Contains(fullURL, "?") {
			fullURL = fmt.Sprintf("%s&populate=%s", fullURL, strings.Join(populate, ","))
		} else {
			fullURL = fmt.Sprintf("%s?populate=%s", fullURL, strings.Join(populate, ","))
		}
	}

	var bodyReader io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("failed to marshal request body: %w", err)
		}
		bodyReader = bytes.NewReader(jsonBody)
	}

	req, err := http.NewRequestWithContext(ctx, method, fullURL, bodyReader)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	// Set fincore-engine auth headers
	if c.config.ClientID != "" && c.config.ClientSecret != "" {
		req.Header.Set("X-FinCore-Client-Id", c.config.ClientID)
		req.Header.Set("X-FinCore-Client-Secret", c.config.ClientSecret)
	}

	logrus.WithFields(logrus.Fields{
		"method": method,
		"url":    fullURL,
	}).Debug("Making request to accounting service")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	// Handle error responses
	if resp.StatusCode >= 400 {
		var apiResp APIResponse[any]
		if err := json.Unmarshal(respBody, &apiResp); err != nil {
			return NewAccountingAPIError(resp.StatusCode, ErrCodeInternalError, string(respBody))
		}
		if apiResp.Errors != nil {
			return NewAccountingAPIError(resp.StatusCode, ErrCodeInternalError, apiResp.Errors.Message)
		}
		return NewAccountingAPIError(resp.StatusCode, ErrCodeInternalError, "Unknown error")
	}

	// Parse successful response
	if result != nil {
		var apiResp APIResponse[json.RawMessage]
		if err := json.Unmarshal(respBody, &apiResp); err != nil {
			// Try direct unmarshal if not wrapped in APIResponse
			if err := json.Unmarshal(respBody, result); err != nil {
				return fmt.Errorf("failed to unmarshal response: %w", err)
			}
			return nil
		}
		if err := json.Unmarshal(apiResp.Data, result); err != nil {
			return fmt.Errorf("failed to unmarshal response data: %w", err)
		}
	}

	return nil
}
