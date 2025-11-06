package middlewares

import (
	"errors"
	"net/http"

	"github.com/Bendomey/goutilities/pkg/validatetoken"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/dgrijalva/jwt-go"
)

func InjectClientUserAuthMiddleware(appCtx pkg.AppContext) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authorizationToken := r.Header.Get("Authorization")

			if authorizationToken != "" {
				client, clientError := clientFromJWT(authorizationToken, appCtx.Config.TokenSecrets.ClientUserSecret)

				if clientError != nil {
					http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
					return
				}

				ctx := lib.WithClientUser(r.Context(), client)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func CheckForClientUserAuthPresenceMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		client, ok := lib.ClientUserFromContext(r.Context())
		if !ok || client == nil {
			http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func clientFromJWT(unattendedToken string, secret string) (*lib.ClientUserFromToken, error) {
	token, extractTokenErr := ExtractToken(unattendedToken)

	if extractTokenErr != nil {
		return nil, extractTokenErr
	}

	rawToken, validateError := validatetoken.ValidateJWTToken(token, secret)
	if validateError != nil {
		return nil, errors.New("AuthorizationFailed")
	}

	claims, ok := rawToken.Claims.(jwt.MapClaims)
	var clientFromTokenImplementation lib.ClientUserFromToken

	if ok && rawToken.Valid {
		clientFromTokenImplementation.ID = claims["id"].(string)
		clientFromTokenImplementation.ClientID = claims["client_id"].(string)
	}

	return &clientFromTokenImplementation, nil
}

func ValidateRoleClientUserMiddleware(appCtx pkg.AppContext, allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			clientCtx, ok := lib.ClientUserFromContext(r.Context())
			if !ok || clientCtx == nil {
				http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
				return
			}

			// TODO: Add a cache layer here later
			var clientUser models.ClientUser
			result := appCtx.DB.Select("id", "role").Where("id = ?", clientCtx.ID).First(&clientUser)
			if result.Error != nil {
				http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
				return
			}

			hasAllowedRole := false
			for _, role := range allowedRoles {
				if clientUser.Role == role {
					hasAllowedRole = true
					break
				}
			}

			if !hasAllowedRole {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
