package middlewares

import (
	"errors"
	"net/http"

	"github.com/Bendomey/goutilities/pkg/validatetoken"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/dgrijalva/jwt-go"
)

func InjectTenantAuthMiddleware(appCtx pkg.AppContext) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authorizationToken := r.Header.Get("Authorization")

			if authorizationToken != "" {
				tenant, tenantError := tenantFromJWT(authorizationToken, appCtx.Config.TokenSecrets.TenantUserSecret)

				if tenantError != nil {
					http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
					return
				}

				ctx := lib.WithTenantAccount(r.Context(), tenant)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func CheckForTenantAuthPresenceMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tenant, ok := lib.TenantAccountFromContext(r.Context())
		if !ok || tenant == nil {
			http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func tenantFromJWT(unattendedToken string, secret string) (*lib.TenantAccountFromToken, error) {
	token, extractTokenError := ExtractToken(unattendedToken)

	if extractTokenError != nil {
		return nil, extractTokenError
	}

	rawToken, validateError := validatetoken.ValidateJWTToken(token, secret)
	if validateError != nil {
		return nil, errors.New("AuthorizationFailed")
	}

	claims, ok := rawToken.Claims.(jwt.MapClaims)

	var tenantFromTokenImplementation lib.TenantAccountFromToken

	if !ok || rawToken.Valid {
		tenantFromTokenImplementation.ID = claims["id"].(string)
	}

	return &tenantFromTokenImplementation, nil
}
