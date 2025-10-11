package lib

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

type contextKey string

// for admin
const adminContextKey contextKey = "rentloop-admin"

func WithAdmin(ctx context.Context, admin *models.Admin) context.Context {
	return context.WithValue(ctx, adminContextKey, admin)
}

func AadminFromContext(ctx context.Context) (*models.Admin, bool) {
	admin, ok := ctx.Value(adminContextKey).(*models.Admin)
	return admin, ok
}

// for client user
const clientUserContextKey contextKey = "rentloop-client-user"

func WithClientUser(ctx context.Context, clientUser *models.ClientUser) context.Context {
	return context.WithValue(ctx, clientUserContextKey, clientUser)
}

func ClientUserFromContext(ctx context.Context) (*models.ClientUser, bool) {
	clientUser, ok := ctx.Value(clientUserContextKey).(*models.ClientUser)
	return clientUser, ok
}

// for tenant account
const tenantAccountContextKey contextKey = "rentloop-tenant-account"

func WithTenantAccount(ctx context.Context, tenantAccount *models.TenantAccount) context.Context {
	return context.WithValue(ctx, tenantAccountContextKey, tenantAccount)
}

func TenantAccountFromContext(ctx context.Context) (*models.TenantAccount, bool) {
	tenantAccount, ok := ctx.Value(tenantAccountContextKey).(*models.TenantAccount)
	return tenantAccount, ok
}
