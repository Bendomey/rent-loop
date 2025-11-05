package lib

import (
	"context"

	"gorm.io/gorm"
)

type AdminFromToken struct {
	ID string `json:"id"`
}

type ClientUserFromToken struct {
	ID       string `json:"id"`
	ClientID string `json:"client_id"`
}

type TenantAccountFromToken struct {
	ID string `json:"id"`
}

type contextKey string

// for database transactions
const dbTransactionKey contextKey = "db-transactions"

func WithTransaction(ctx context.Context, tx *gorm.DB) context.Context {
	return context.WithValue(ctx, dbTransactionKey, tx)
}

func TransactionFromContext(ctx context.Context) (*gorm.DB, bool) {
	tx, ok := ctx.Value(dbTransactionKey).(*gorm.DB)
	return tx, ok
}

func ResolveDB(ctx context.Context, db *gorm.DB) *gorm.DB {
	tx, txOk := TransactionFromContext(ctx)
	if !txOk || tx == nil {
		return db
	}

	return tx
}

// for admin
const adminContextKey contextKey = "rentloop-admin"

func WithAdmin(ctx context.Context, admin *AdminFromToken) context.Context {
	return context.WithValue(ctx, adminContextKey, admin)
}

func AdminFromContext(ctx context.Context) (*AdminFromToken, bool) {
	admin, ok := ctx.Value(adminContextKey).(*AdminFromToken)
	return admin, ok
}

// for client user
const clientUserContextKey contextKey = "rentloop-client-user"

func WithClientUser(ctx context.Context, clientUser *ClientUserFromToken) context.Context {
	return context.WithValue(ctx, clientUserContextKey, clientUser)
}

func ClientUserFromContext(ctx context.Context) (*ClientUserFromToken, bool) {
	clientUser, ok := ctx.Value(clientUserContextKey).(*ClientUserFromToken)
	return clientUser, ok
}

// for tenant account
const tenantAccountContextKey contextKey = "rentloop-tenant-account"

func WithTenantAccount(ctx context.Context, tenantAccount *TenantAccountFromToken) context.Context {
	return context.WithValue(ctx, tenantAccountContextKey, tenantAccount)
}

func TenantAccountFromContext(ctx context.Context) (*TenantAccountFromToken, bool) {
	tenantAccount, ok := ctx.Value(tenantAccountContextKey).(*TenantAccountFromToken)
	return tenantAccount, ok
}

type HTTPError struct {
	Errors struct {
		Message string `json:"message"`
	} `json:"errors"`
}

type HTTPSuccess[T any] struct {
	Data T `json:"data"`
}

type HTTPReturnPaginatedMetaResponse struct {
	Page            int    `json:"page"              example:"1"`
	PageSize        int    `json:"page_size"         example:"20"`
	Order           string `json:"order"             example:"desc"`
	OrderBy         string `json:"order_by"          example:"created_at"`
	Total           int64  `json:"total"             example:"100"`
	HasNextPage     bool   `json:"has_next_page"     example:"true"`
	HasPreviousPage bool   `json:"has_previous_page" example:"false"`
}
