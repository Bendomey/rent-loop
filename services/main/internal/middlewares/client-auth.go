package middlewares

import (
	"errors"
	"net/http"
	"slices"

	"github.com/Bendomey/goutilities/pkg/validatetoken"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/dgrijalva/jwt-go"
	"github.com/go-chi/chi/v5"
)

func InjectClientUserAuthMiddleware(appCtx pkg.AppContext) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authorizationToken := r.Header.Get("Authorization")

			if authorizationToken != "" {
				user, err := userFromJWT(authorizationToken, appCtx.Config.TokenSecrets.ClientUserSecret)
				if err != nil {
					http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
					return
				}
				ctx := lib.WithUser(r.Context(), user)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func CheckForClientUserAuthPresenceMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := lib.UserFromContext(r.Context())
		if !ok || user == nil {
			http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ValidateClientMembershipMiddleware resolves the ClientUser for (userID, clientID from URL)
// and injects it as ClientUserFromToken so all downstream handlers work unchanged.
func ValidateClientMembershipMiddleware(appCtx pkg.AppContext) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userCtx, ok := lib.UserFromContext(r.Context())
			if !ok || userCtx == nil {
				http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
				return
			}

			clientID := chi.URLParam(r, "client_id")

			var clientUser models.ClientUser
			result := appCtx.DB.
				Select("client_users.id", "client_users.client_id", "client_users.role").
				Joins("JOIN users ON users.id = client_users.user_id").
				Where("client_users.client_id = ? AND users.id = ? AND client_users.deleted_at IS NULL", clientID, userCtx.ID).
				First(&clientUser)
			if result.Error != nil {
				http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
				return
			}

			ctx := lib.WithClientUser(r.Context(), &lib.ClientUserFromToken{
				ID:       clientUser.ID.String(),
				ClientID: clientUser.ClientID,
			})
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func userFromJWT(unattendedToken string, secret string) (*lib.UserFromToken, error) {
	token, err := ExtractToken(unattendedToken)
	if err != nil {
		return nil, err
	}

	rawToken, err := validatetoken.ValidateJWTToken(token, secret)
	if err != nil {
		return nil, errors.New("AuthorizationFailed")
	}

	claims, ok := rawToken.Claims.(jwt.MapClaims)
	if !ok || !rawToken.Valid {
		return nil, errors.New("AuthorizationFailed")
	}

	return &lib.UserFromToken{
		ID: claims["id"].(string),
	}, nil
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

func ValidateRoleClientUserPropertyMiddleware(
	appCtx pkg.AppContext,
	allowedRoles ...string,
) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			clientCtx, ok := lib.ClientUserFromContext(r.Context())
			if !ok || clientCtx == nil {
				http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
				return
			}

			propertyID := chi.URLParam(r, "property_id")

			// TODO: Add a cache layer here later
			var clientUserProperty models.ClientUserProperty
			result := appCtx.DB.Select("id", "role").
				Where("client_user_id = ? AND property_id = ?", clientCtx.ID, propertyID).
				First(&clientUserProperty)
			if result.Error != nil {
				http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
				return
			}

			hasAllowedRole := slices.Contains(allowedRoles, clientUserProperty.Role)

			if !hasAllowedRole {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
