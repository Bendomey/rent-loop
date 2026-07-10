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
	Role     string `json:"role"`
}

type UserFromToken struct {
	ID string `json:"id"`
}

const userTokenContextKey contextKey = "rentloop-user"

func WithUser(ctx context.Context, user *UserFromToken) context.Context {
	return context.WithValue(ctx, userTokenContextKey, user)
}

func UserFromContext(ctx context.Context) (*UserFromToken, bool) {
	user, ok := ctx.Value(userTokenContextKey).(*UserFromToken)
	return user, ok
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

// for client user property (property-scoped access resolved by ValidatePropertyAccessMiddleware)
type ClientUserPropertyFromToken struct {
	Role string // MANAGER or STAFF at this property
}

const clientUserPropertyContextKey contextKey = "rentloop-client-user-property"

func WithClientUserProperty(ctx context.Context, cup *ClientUserPropertyFromToken) context.Context {
	return context.WithValue(ctx, clientUserPropertyContextKey, cup)
}

func ClientUserPropertyFromContext(ctx context.Context) (*ClientUserPropertyFromToken, bool) {
	cup, ok := ctx.Value(clientUserPropertyContextKey).(*ClientUserPropertyFromToken)
	return cup, ok
}

// for property access scope (cross-property resolution for the "global" mobile routes,
// resolved once per request by middlewares.InjectPropertyAccessScopeMiddleware)
type PropertyAccessScope struct {
	ClientID string
	// Unrestricted is true for OWNER — access to every property under ClientID,
	// without enumerating them. PropertyIDs is unused when this is true.
	Unrestricted bool
	// PropertyIDs is the exact set of properties this ADMIN/STAFF user is assigned to
	// (via ClientUserProperty). Always non-nil when Unrestricted is false — an empty
	// slice means the user has zero assigned properties, not "no filter."
	PropertyIDs []string
}

const propertyAccessScopeContextKey contextKey = "rentloop-property-access-scope"

func WithPropertyAccessScope(ctx context.Context, scope *PropertyAccessScope) context.Context {
	return context.WithValue(ctx, propertyAccessScopeContextKey, scope)
}

func PropertyAccessScopeFromContext(ctx context.Context) (*PropertyAccessScope, bool) {
	scope, ok := ctx.Value(propertyAccessScopeContextKey).(*PropertyAccessScope)
	return scope, ok
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

// stores url
const (
	PLAYSTORE_URL     = "https://play.google.com/store/apps/details?id=com.rentloop.app"
	APPSTORE_URL      = "https://apps.apple.com/app/rentloop/6760318488"
	DOWNLOAD_APPS_URL = "https://www.rentloopapp.com/download"
)
