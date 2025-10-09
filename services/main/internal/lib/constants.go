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

// for real estate manager
const realEstateManagerContextKey contextKey = "rentloop-real-estate-manager"

func WithRealEstateManager(ctx context.Context, realEstateManager *models.RealEstateManager) context.Context {
	return context.WithValue(ctx, realEstateManagerContextKey, realEstateManager)
}

func RealEstateManagerFromContext(ctx context.Context) (*models.RealEstateManager, bool) {
	realEstateManager, ok := ctx.Value(realEstateManagerContextKey).(*models.RealEstateManager)
	return realEstateManager, ok
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
