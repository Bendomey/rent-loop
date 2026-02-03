package accounting

import (
	"fmt"
)

// AccountingAPIError represents an error returned from the accounting API
type AccountingAPIError struct {
	StatusCode int
	Code       string
	Message    string
}

func (e *AccountingAPIError) Error() string {
	return fmt.Sprintf("accounting API error [%d]: %s - %s", e.StatusCode, e.Code, e.Message)
}

// NewAccountingAPIError creates a new AccountingAPIError
func NewAccountingAPIError(statusCode int, code, message string) *AccountingAPIError {
	return &AccountingAPIError{
		StatusCode: statusCode,
		Code:       code,
		Message:    message,
	}
}

// Common error codes from the accounting service
const (
	ErrCodeUnauthorized     = "UNAUTHORIZED"
	ErrCodeForbidden        = "FORBIDDEN"
	ErrCodeNotFound         = "NOT_FOUND"
	ErrCodeValidationFailed = "VALIDATION_FAILED"
	ErrCodeDuplicateEntry   = "DUPLICATE_ENTRY"
	ErrCodeUnbalancedEntry  = "UNBALANCED_ENTRY"
	ErrCodeAccountInactive  = "ACCOUNT_INACTIVE"
	ErrCodeAlreadyPosted    = "ALREADY_POSTED"
	ErrCodeInternalError    = "INTERNAL_ERROR"
)

// IsNotFoundError checks if the error is a not found error
func IsNotFoundError(err error) bool {
	if apiErr, ok := err.(*AccountingAPIError); ok {
		return apiErr.Code == ErrCodeNotFound || apiErr.StatusCode == 404
	}
	return false
}

// IsValidationError checks if the error is a validation error
func IsValidationError(err error) bool {
	if apiErr, ok := err.(*AccountingAPIError); ok {
		return apiErr.Code == ErrCodeValidationFailed || apiErr.StatusCode == 400
	}
	return false
}

// IsUnbalancedEntryError checks if the error is an unbalanced journal entry error
func IsUnbalancedEntryError(err error) bool {
	if apiErr, ok := err.(*AccountingAPIError); ok {
		return apiErr.Code == ErrCodeUnbalancedEntry
	}
	return false
}

// IsAuthorizationError checks if the error is an authorization error
func IsAuthorizationError(err error) bool {
	if apiErr, ok := err.(*AccountingAPIError); ok {
		return apiErr.Code == ErrCodeUnauthorized || apiErr.Code == ErrCodeForbidden ||
			apiErr.StatusCode == 401 || apiErr.StatusCode == 403
	}
	return false
}

// IsAlreadyPostedError checks if journal entry is already posted
func IsAlreadyPostedError(err error) bool {
	if apiErr, ok := err.(*AccountingAPIError); ok {
		return apiErr.Code == ErrCodeAlreadyPosted
	}
	return false
}
