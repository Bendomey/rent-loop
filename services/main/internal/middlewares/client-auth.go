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

func InjectUserAuthMiddleware(appCtx pkg.AppContext) func(http.Handler) http.Handler {
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

func CheckForUserAuthPresenceMiddleware(next http.Handler) http.Handler {
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
				Select("client_users.id", "client_users.client_id", "client_users.role", "client_users.status").
				Joins("JOIN users ON users.id = client_users.user_id").
				Where("client_users.client_id = ? AND users.id = ? AND client_users.deleted_at IS NULL", clientID, userCtx.ID).
				First(&clientUser)
			if result.Error != nil {
				http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
				return
			}

			if clientUser.Status != "ClientUser.Status.Active" {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}

			ctx := lib.WithClientUser(r.Context(), &lib.ClientUserFromToken{
				ID:       clientUser.ID.String(),
				ClientID: clientUser.ClientID,
				Role:     clientUser.Role,
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

	idVal, found := claims["id"]
	if !found {
		return nil, errors.New("AuthorizationFailed")
	}
	id, ok := idVal.(string)
	if !ok {
		return nil, errors.New("AuthorizationFailed")
	}

	return &lib.UserFromToken{
		ID: id,
	}, nil
}

func ValidateRoleClientUserMiddleware(_ pkg.AppContext, allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			clientCtx, ok := lib.ClientUserFromContext(r.Context())
			if !ok || clientCtx == nil {
				http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
				return
			}

			if !slices.Contains(allowedRoles, clientCtx.Role) {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// ValidatePropertyAccessMiddleware ensures the current client user has access to the
// property_id in the URL. Only OWNER implicitly has MANAGER-level access to all properties
// in their client. ADMIN and STAFF must be explicitly assigned via client_user_properties.
// The resolved property role is stored in context so downstream role checks need no extra DB call.
func ValidatePropertyAccessMiddleware(appCtx pkg.AppContext) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			clientCtx, ok := lib.ClientUserFromContext(r.Context())
			if !ok || clientCtx == nil {
				http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
				return
			}

			// Only OWNER has universal access to all client properties
			if clientCtx.Role == "OWNER" {
				ctx := lib.WithClientUserProperty(r.Context(), &lib.ClientUserPropertyFromToken{
					Role: "MANAGER",
				})
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			// non-OWNERs must be explicitly assigned to this property
			propertyID := chi.URLParam(r, "property_id")
			var cup models.ClientUserProperty
			result := appCtx.DB.Select("id", "role").
				Where("client_user_id = ? AND property_id = ? AND deleted_at IS NULL", clientCtx.ID, propertyID).
				First(&cup)
			if result.Error != nil {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}

			ctx := lib.WithClientUserProperty(r.Context(), &lib.ClientUserPropertyFromToken{
				Role: cup.Role,
			})
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func ValidateRoleClientUserPropertyMiddleware(
	_ pkg.AppContext,
	allowedRoles ...string,
) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cupCtx, ok := lib.ClientUserPropertyFromContext(r.Context())
			if !ok || cupCtx == nil {
				http.Error(w, "AuthorizationFailed", http.StatusUnauthorized)
				return
			}

			if !slices.Contains(allowedRoles, cupCtx.Role) {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
