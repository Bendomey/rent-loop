package middlewares

import (
	"errors"
	"net/http"

	"github.com/Bendomey/goutilities/pkg/validatetoken"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/dgrijalva/jwt-go"
)

func VerifyAdminAuthMiddleware(appCtx pkg.AppContext) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authorizationToken := r.Header.Get("Authorization")

			if authorizationToken != "" {
				admin, adminError := adminFromJWT(authorizationToken, appCtx.Config.TokenSecrets.AdminSecret)

				if adminError != nil {
					http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
					return
				}

				// Attach admin to context
				ctx := lib.WithAdmin(r.Context(), admin)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func CheckForAdminAuthPresenceMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		admin, ok := lib.AdminFromContext(r.Context())
		if !ok || admin == nil {
			http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func adminFromJWT(unattendedToken string, secret string) (*lib.AdminFromToken, error) {
	//extract token
	token, extractTokenErr := ExtractAdminToken(unattendedToken)
	if extractTokenErr != nil {
		return nil, extractTokenErr
	}

	//extract token metadata
	rawToken, validateError := validatetoken.ValidateJWTToken(token, secret)
	if validateError != nil {
		return nil, errors.New("AuthorizationFailed")
	}

	claims, ok := rawToken.Claims.(jwt.MapClaims)
	var adminFromTokenImplementation lib.AdminFromToken
	if ok && rawToken.Valid {
		adminFromTokenImplementation.ID = claims["id"].(string)
	}

	return &adminFromTokenImplementation, nil
}
