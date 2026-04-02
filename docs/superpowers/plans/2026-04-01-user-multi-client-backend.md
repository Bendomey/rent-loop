# User Multi-Client — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract user identity into a `users` table so one email can belong to multiple clients, and restructure API routes to `/v1/admin/clients/{client_id}/...`.

**Architecture:** New `User` model holds identity (email, password, name, phone). `ClientUser` becomes a join table (user_id + client_id + role/status). JWT holds only `user_id`. `ValidateClientMembershipMiddleware` resolves `ClientUser` from the URL `client_id` param, injecting it into the same context key handlers already read — so handler code stays unchanged.

**Tech Stack:** Go, GORM, gormigrate, chi router, `github.com/Bendomey/goutilities` (hashpassword, signjwt, validatehash), `github.com/dgrijalva/jwt-go`

---

## File Map

**Create:**
- `services/main/internal/models/user.go`
- `services/main/init/migration/jobs/extract-users-from-client-users.go`
- `services/main/internal/repository/user.go`
- `services/main/internal/transformations/user.go`
- `services/main/internal/services/user.go`
- `services/main/internal/handlers/user.go`

**Modify:**
- `services/main/internal/models/client-user.go` — remove auth fields, add UserID FK
- `services/main/init/migration/main.go` — register User in AutoMigrate + new job
- `services/main/internal/lib/constants.go` — add UserFromToken context key
- `services/main/internal/middlewares/client-auth.go` — update JWT extraction, new membership middleware
- `services/main/internal/repository/client-user.go` — remove GetByEmail, update GetByIDWithPopulate
- `services/main/internal/repository/main.go` — add UserRepository
- `services/main/internal/transformations/client-user.go` — remove auth fields, add user_id
- `services/main/internal/services/client-user.go` — update CreateClientUser, remove auth/profile methods
- `services/main/internal/services/client-application.go` — create User before ClientUser in ApproveClientApplication
- `services/main/internal/services/main.go` — add UserService
- `services/main/internal/handlers/client-user.go` — remove auth/profile handlers, update CreateClientUser
- `services/main/internal/handlers/main.go` — add UserHandler
- `services/main/internal/router/client-user.go` — restructure all routes

---

## Task 1: User model + update ClientUser model

**Files:**
- Create: `services/main/internal/models/user.go`
- Modify: `services/main/internal/models/client-user.go`

- [ ] **Step 1: Create the User model**

```go
// services/main/internal/models/user.go
package models

import (
	"errors"

	"github.com/Bendomey/goutilities/pkg/hashpassword"
	"github.com/getsentry/raven-go"
	"gorm.io/gorm"
)

type User struct {
	BaseModelSoftDelete
	Name        string `gorm:"not null"`
	Email       string `gorm:"not null;uniqueIndex"`
	PhoneNumber string `gorm:"not null"`
	Password    string `gorm:"not null"`

	ClientUsers []ClientUser
}

func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	hashed, err := hashpassword.HashPassword(u.Password)
	u.Password = hashed
	if err != nil {
		raven.CaptureError(err, map[string]string{
			"function": "User.BeforeCreate",
			"action":   "hashing password",
		})
		err = errors.New("CannotHashUserPassword")
	}
	return
}
```

- [ ] **Step 2: Update ClientUser model — remove auth fields, add UserID**

Replace the full content of `services/main/internal/models/client-user.go`:

```go
package models

import (
	"errors"

	"gorm.io/gorm"
)

type ClientUser struct {
	BaseModelSoftDelete
	UserID string `gorm:"not null;index"`
	User   User

	ClientID string `gorm:"not null;index"`
	Client   Client

	Role string `json:"role" gorm:"not null;"` // OWNER | ADMIN | STAFF

	CreatedByID *string
	CreatedBy   *ClientUser

	Status string `gorm:"not null;index;default:'ClientUser.Status.Active'"` // ClientUser.Status.Active | ClientUser.Status.Inactive

	StatusUpdatedById *string
	StatusUpdatedBy   *ClientUser
}

func (cu *ClientUser) BeforeDelete(tx *gorm.DB) (err error) {
	if cu.CreatedByID == nil {
		err = errors.New("CannotDeleteSuperUserForClient")
	}
	return
}
```

- [ ] **Step 3: Verify the build compiles**

```bash
cd services/main && go build ./...
```

Expected: compile errors about missing fields on ClientUser (Name, Email, etc.) — that's expected, we'll fix them in later tasks. Zero model-level errors.

- [ ] **Step 4: Commit**

```bash
git add services/main/internal/models/user.go services/main/internal/models/client-user.go
git commit -m "feat: add User model, remove auth fields from ClientUser"
```

---

## Task 2: Migration job — extract users from client_users

**Files:**
- Create: `services/main/init/migration/jobs/extract-users-from-client-users.go`
- Modify: `services/main/init/migration/main.go`

- [ ] **Step 1: Create the migration job**

```go
// services/main/init/migration/jobs/extract-users-from-client-users.go
package jobs

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func ExtractUsersFromClientUsers() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604010001_EXTRACT_USERS_FROM_CLIENT_USERS",
		Migrate: func(db *gorm.DB) error {
			// 1. Create users table
			if err := db.AutoMigrate(&models.User{}); err != nil {
				return err
			}

			// 2. Add user_id column (nullable first, for backfill)
			if err := db.Exec(`ALTER TABLE client_users ADD COLUMN IF NOT EXISTS user_id UUID`).Error; err != nil {
				return err
			}

			// 3. Insert a user row for each unique email across all client_users
			if err := db.Exec(`
				INSERT INTO users (id, name, email, phone_number, password, created_at, updated_at)
				SELECT DISTINCT ON (email)
					uuid_generate_v4(), name, email, phone_number, password, NOW(), NOW()
				FROM client_users
				WHERE deleted_at IS NULL
				ON CONFLICT (email) DO NOTHING
			`).Error; err != nil {
				return err
			}

			// 4. Set user_id on each client_user row
			if err := db.Exec(`
				UPDATE client_users
				SET user_id = users.id
				FROM users
				WHERE client_users.email = users.email
				AND client_users.deleted_at IS NULL
			`).Error; err != nil {
				return err
			}

			// 5. Make user_id NOT NULL
			if err := db.Exec(`ALTER TABLE client_users ALTER COLUMN user_id SET NOT NULL`).Error; err != nil {
				return err
			}

			// 6. Add unique composite index (user_id, client_id)
			if err := db.Exec(`
				CREATE UNIQUE INDEX IF NOT EXISTS idx_client_users_user_client
				ON client_users (user_id, client_id)
				WHERE deleted_at IS NULL
			`).Error; err != nil {
				return err
			}

			// 7. Drop auth columns from client_users
			for _, col := range []string{"name", "email", "phone_number", "password"} {
				if err := DropColumnIfExists(db, &models.ClientUser{}, col); err != nil {
					return err
				}
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			for _, stmt := range []string{
				`ALTER TABLE client_users ADD COLUMN IF NOT EXISTS name VARCHAR NOT NULL DEFAULT ''`,
				`ALTER TABLE client_users ADD COLUMN IF NOT EXISTS email VARCHAR NOT NULL DEFAULT ''`,
				`ALTER TABLE client_users ADD COLUMN IF NOT EXISTS phone_number VARCHAR NOT NULL DEFAULT ''`,
				`ALTER TABLE client_users ADD COLUMN IF NOT EXISTS password VARCHAR NOT NULL DEFAULT ''`,
				`DROP INDEX IF EXISTS idx_client_users_user_client`,
				`ALTER TABLE client_users DROP COLUMN IF EXISTS user_id`,
			} {
				if err := db.Exec(stmt).Error; err != nil {
					return err
				}
			}
			return nil
		},
	}
}
```

- [ ] **Step 2: Register User in AutoMigrate and add the job**

In `services/main/init/migration/main.go`, add `&models.User{}` to the `db.AutoMigrate(...)` call and append the new job:

```go
// In updateMigration, add before &models.ClientUser{}:
&models.User{},

// In the second gormigrate.New(...) call, append as last item:
jobs.ExtractUsersFromClientUsers(),
```

- [ ] **Step 3: Verify build**

```bash
cd services/main && go build ./...
```

Expected: compiles cleanly (migration files only reference models/DB, no handler deps).

- [ ] **Step 4: Commit**

```bash
git add services/main/init/migration/jobs/extract-users-from-client-users.go services/main/init/migration/main.go
git commit -m "feat: add migration to extract users table from client_users"
```

---

## Task 3: Update context keys + middleware

**Files:**
- Modify: `services/main/internal/lib/constants.go`
- Modify: `services/main/internal/middlewares/client-auth.go`

**Strategy:** Add a new `userContextKey` holding `UserFromToken{ID}` (just user_id from JWT). Keep the existing `clientUserContextKey` holding `ClientUserFromToken{ID, ClientID}` — but now it gets populated by a new `ValidateClientMembershipMiddleware` (DB lookup) instead of from JWT claims. All downstream handlers continue calling `lib.ClientUserFromContext()` unchanged.

- [ ] **Step 1: Add UserFromToken and context helpers to lib/constants.go**

In `services/main/internal/lib/constants.go`, add after the existing `ClientUserFromToken` block:

```go
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
```

- [ ] **Step 2: Rewrite client-auth.go**

Replace the full content of `services/main/internal/middlewares/client-auth.go`:

```go
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
				Select("id", "client_id", "role").
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
```

- [ ] **Step 3: Build**

```bash
cd services/main && go build ./...
```

Expected: build errors in handlers that call `lib.ClientUserFromContext` and then try to use `.ClientID` — those are pre-existing references that will be resolved by the middleware injection. Zero new errors from this task.

- [ ] **Step 4: Commit**

```bash
git add services/main/internal/lib/constants.go services/main/internal/middlewares/client-auth.go
git commit -m "feat: add UserFromToken context, ValidateClientMembershipMiddleware"
```

---

## Task 4: UserRepository + update ClientUserRepository

**Files:**
- Create: `services/main/internal/repository/user.go`
- Modify: `services/main/internal/repository/client-user.go`
- Modify: `services/main/internal/repository/main.go`

- [ ] **Step 1: Create UserRepository**

```go
// services/main/internal/repository/user.go
package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	GetByID(ctx context.Context, id string) (*models.User, error)
	GetByIDWithClientUsers(ctx context.Context, id string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
}

type userRepository struct {
	DB *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db}
}

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	db := lib.ResolveDB(ctx, r.DB)
	return db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	result := r.DB.WithContext(ctx).Where("email = ?", email).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

func (r *userRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	var user models.User
	result := r.DB.WithContext(ctx).Where("id = ?", id).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

func (r *userRepository) GetByIDWithClientUsers(ctx context.Context, id string) (*models.User, error) {
	var user models.User
	result := r.DB.WithContext(ctx).
		Preload("ClientUsers").
		Preload("ClientUsers.Client").
		Where("id = ?", id).
		First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

func (r *userRepository) Update(ctx context.Context, user *models.User) error {
	return r.DB.WithContext(ctx).Save(user).Error
}
```

- [ ] **Step 2: Update ClientUserRepository — remove GetByEmail, update GetByIDWithPopulate**

In `services/main/internal/repository/client-user.go`:

Remove the entire `GetByEmail` method (lines 48–59).

Remove `GetByEmail` from the `ClientUserRepository` interface (line 15).

Update `GetByIDWithPopulate` — the WHERE clause no longer needs `client_id` since that is now enforced by middleware:

```go
func (r *clientUserRepository) GetByIDWithPopulate(
	ctx context.Context,
	query GetClientUserWithPopulateQuery,
) (*models.ClientUser, error) {
	var clientUser models.ClientUser

	db := r.DB.WithContext(ctx).Where("id = ?", query.ID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&clientUser)
	if result.Error != nil {
		return nil, result.Error
	}

	return &clientUser, nil
}
```

Also update the `GetClientUserWithPopulateQuery` struct — remove `ClientID` field:

```go
type GetClientUserWithPopulateQuery struct {
	ID       string
	Populate *[]string
}
```

- [ ] **Step 3: Add UserRepository to repository/main.go**

In `services/main/internal/repository/main.go`:

Add `UserRepository UserRepository` to the `Repository` struct.

In `NewRepository`, add:
```go
userRepository := NewUserRepository(db)
```

And in the return struct:
```go
UserRepository: userRepository,
```

- [ ] **Step 4: Build**

```bash
cd services/main && go build ./...
```

- [ ] **Step 5: Commit**

```bash
git add services/main/internal/repository/user.go services/main/internal/repository/client-user.go services/main/internal/repository/main.go
git commit -m "feat: add UserRepository, update ClientUserRepository"
```

---

## Task 5: Transformations

**Files:**
- Create: `services/main/internal/transformations/user.go`
- Modify: `services/main/internal/transformations/client-user.go`

- [ ] **Step 1: Create user transformation**

```go
// services/main/internal/transformations/user.go
package transformations

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

func DBUserToRest(u *models.User) interface{} {
	if u == nil || u.ID == uuid.Nil {
		return nil
	}

	clientUsers := make([]interface{}, 0, len(u.ClientUsers))
	for i := range u.ClientUsers {
		clientUsers = append(clientUsers, DBClientUserToRest(&u.ClientUsers[i]))
	}

	return map[string]interface{}{
		"id":           u.ID.String(),
		"name":         u.Name,
		"email":        u.Email,
		"phone_number": u.PhoneNumber,
		"created_at":   u.CreatedAt,
		"updated_at":   u.UpdatedAt,
		"client_users": clientUsers,
	}
}

func DBUserToRestWithToken(u *models.User, token string) interface{} {
	if u == nil {
		return nil
	}
	return map[string]interface{}{
		"user":  DBUserToRest(u),
		"token": token,
	}
}
```

- [ ] **Step 2: Update ClientUser transformation — remove auth fields, add user_id**

Replace the content of `services/main/internal/transformations/client-user.go`:

```go
package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputClientUser struct {
	ID                string            `json:"id"                   example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	UserID            string            `json:"user_id"              example:"e4ad26d4-d7e9-4599-a246-5e88abba6083"`
	ClientID          string            `json:"client_id"            example:"e4ad26d4-d7e9-4599-a246-5e88abba6083"`
	Client            OutputClient      `json:"client"`
	Role              string            `json:"role"                 example:"STAFF"`
	Status            string            `json:"status"               example:"ClientUser.Status.Active"`
	CreatedAt         time.Time         `json:"created_at"           example:"2023-01-01T00:00:00Z"`
	UpdatedAt         time.Time         `json:"updated_at"           example:"2023-01-01T00:00:00Z"`
	CreatedByID       string            `json:"created_by_id"        example:"0205126b-9bbb-4a98-960a-e87d8f095335"`
	StatusUpdatedByID string            `json:"status_updated_by_id" example:"0205126b-9bbb-4a98-960a-e87d8f095335"`
	StatusUpdatedBy   *OutputClientUser `json:"status_updated_by"`
}

func DBClientUserToRest(i *models.ClientUser) interface{} {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	return map[string]interface{}{
		"id":                   i.ID.String(),
		"user_id":              i.UserID,
		"client_id":            i.ClientID,
		"client":               DBClientToRestClient(&i.Client),
		"role":                 i.Role,
		"status":               i.Status,
		"created_at":           i.CreatedAt,
		"updated_at":           i.UpdatedAt,
		"created_by_id":        i.CreatedByID,
		"created_by":           DBClientUserToRest(i.CreatedBy),
		"status_updated_by_id": i.StatusUpdatedById,
		"status_updated_by":    DBClientUserToRest(i.StatusUpdatedBy),
	}
}

func DBClientUserToRestWithToken(i *models.ClientUser, token string) interface{} {
	if i == nil {
		return nil
	}
	return map[string]interface{}{
		"client_user": DBClientUserToRest(i),
		"token":       token,
	}
}
```

- [ ] **Step 3: Build**

```bash
cd services/main && go build ./...
```

- [ ] **Step 4: Commit**

```bash
git add services/main/internal/transformations/user.go services/main/internal/transformations/client-user.go
git commit -m "feat: add UserTransformation, update ClientUserTransformation"
```

---

## Task 6: UserService

**Files:**
- Create: `services/main/internal/services/user.go`

- [ ] **Step 1: Create UserService**

```go
// services/main/internal/services/user.go
package services

import (
	"context"
	"errors"
	"strings"

	"github.com/Bendomey/goutilities/pkg/hashpassword"
	"github.com/Bendomey/goutilities/pkg/signjwt"
	"github.com/Bendomey/goutilities/pkg/validatehash"
	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/dgrijalva/jwt-go"
	"gorm.io/gorm"
)

type UserService interface {
	InsertUser(ctx context.Context, user *models.User) error
	LoginUser(ctx context.Context, input LoginUserInput) (*LoginUserResponse, error)
	GetMe(ctx context.Context, userID string) (*models.User, error)
	UpdateMe(ctx context.Context, input UpdateUserMeInput) (*models.User, error)
	UpdatePassword(ctx context.Context, input UpdateUserPasswordInput) (*models.User, error)
	SendForgotPasswordResetLink(ctx context.Context, email string) (*models.User, error)
	ResetPassword(ctx context.Context, input ResetUserPasswordInput) (*models.User, error)
}

type userService struct {
	appCtx pkg.AppContext
	repo   repository.UserRepository
}

func NewUserService(appCtx pkg.AppContext, repo repository.UserRepository) UserService {
	return &userService{appCtx, repo}
}

func (s *userService) InsertUser(ctx context.Context, user *models.User) error {
	if err := s.repo.Create(ctx, user); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "InsertUser",
				"action":   "inserting user",
			},
		})
	}
	return nil
}

type LoginUserInput struct {
	Email    string
	Password string
}

type LoginUserResponse struct {
	User  models.User
	Token string
}

func (s *userService) LoginUser(ctx context.Context, input LoginUserInput) (*LoginUserResponse, error) {
	user, err := s.repo.GetByEmail(ctx, input.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("UserNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{"function": "LoginUser", "action": "fetching user by email"},
		})
	}

	isSame := validatehash.ValidateCipher(input.Password, user.Password)
	if !isSame {
		return nil, pkg.BadRequestError("PasswordIncorrect", nil)
	}

	// Preload client users + clients for the login response
	userWithClients, err := s.repo.GetByIDWithClientUsers(ctx, user.ID.String())
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{"function": "LoginUser", "action": "fetching user with clients"},
		})
	}

	token, err := signjwt.SignJWT(jwt.MapClaims{
		"id": user.ID,
	}, s.appCtx.Config.TokenSecrets.ClientUserSecret)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{"function": "LoginUser", "action": "signing token"},
		})
	}

	return &LoginUserResponse{User: *userWithClients, Token: token}, nil
}

func (s *userService) GetMe(ctx context.Context, userID string) (*models.User, error) {
	user, err := s.repo.GetByIDWithClientUsers(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("UserNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{"function": "GetMe", "action": "fetching user with clients"},
		})
	}
	return user, nil
}

type UpdateUserMeInput struct {
	UserID      string
	Name        lib.Optional[string]
	PhoneNumber lib.Optional[string]
	Email       lib.Optional[string]
}

func (s *userService) UpdateMe(ctx context.Context, input UpdateUserMeInput) (*models.User, error) {
	user, err := s.repo.GetByID(ctx, input.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("UserNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{"function": "UpdateMe", "action": "fetching user by ID"},
		})
	}

	if input.Name.IsSet && input.Name.Value != nil {
		user.Name = *input.Name.Value
	}
	if input.PhoneNumber.IsSet && input.PhoneNumber.Value != nil {
		user.PhoneNumber = *input.PhoneNumber.Value
	}
	if input.Email.IsSet && input.Email.Value != nil {
		newEmail := *input.Email.Value
		existing, emailErr := s.repo.GetByEmail(ctx, newEmail)
		if emailErr != nil && !errors.Is(emailErr, gorm.ErrRecordNotFound) {
			return nil, pkg.InternalServerError(emailErr.Error(), &pkg.RentLoopErrorParams{
				Err: emailErr,
				Metadata: map[string]string{"function": "UpdateMe", "action": "checking email uniqueness"},
			})
		}
		if existing != nil && existing.ID != user.ID {
			return nil, errors.New("email already in use")
		}
		user.Email = newEmail
	}

	if err := s.repo.Update(ctx, user); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{"function": "UpdateMe", "action": "updating user"},
		})
	}
	return user, nil
}

type UpdateUserPasswordInput struct {
	UserID      string
	OldPassword string
	NewPassword string
}

func (s *userService) UpdatePassword(ctx context.Context, input UpdateUserPasswordInput) (*models.User, error) {
	user, err := s.repo.GetByID(ctx, input.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("UserNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{"function": "UpdatePassword", "action": "fetching user"},
		})
	}

	if !validatehash.ValidateCipher(input.OldPassword, user.Password) {
		return nil, pkg.BadRequestError("PasswordIncorrect", nil)
	}
	if validatehash.ValidateCipher(input.NewPassword, user.Password) {
		return nil, pkg.BadRequestError("PasswordRepeated", nil)
	}

	hashed, err := hashpassword.HashPassword(input.NewPassword)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{"function": "UpdatePassword", "action": "hashing password"},
		})
	}
	user.Password = hashed

	if err := s.repo.Update(ctx, user); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{"function": "UpdatePassword", "action": "saving user"},
		})
	}

	r := strings.NewReplacer("{{name}}", user.Name)
	message := r.Replace(lib.CLIENT_USER_PASSWORD_UPDATED_BODY)
	smsMessage := r.Replace(lib.CLIENT_USER_PASSWORD_UPDATED_SMS_BODY)

	go pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
		Recipient: user.Email,
		Subject:   lib.CLIENT_USER_PASSWORD_UPDATED_SUBJECT,
		TextBody:  message,
	})
	go s.appCtx.Clients.GatekeeperAPI.SendSMS(context.Background(), gatekeeper.SendSMSInput{
		Recipient: user.PhoneNumber,
		Message:   smsMessage,
	})

	return user, nil
}

func (s *userService) SendForgotPasswordResetLink(ctx context.Context, email string) (*models.User, error) {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("UserNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{"function": "SendForgotPasswordResetLink", "action": "fetching user by email"},
		})
	}

	token, err := signjwt.SignJWT(jwt.MapClaims{
		"id": user.ID,
	}, s.appCtx.Config.TokenSecrets.ClientUserSecret)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{"function": "SendForgotPasswordResetLink", "action": "signing token"},
		})
	}

	r := strings.NewReplacer("{{name}}", user.Name, "{{reset_token}}", token)
	message := r.Replace(lib.CLIENT_USER_PASSWORD_RESET_BODY)

	go pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
		Recipient: user.Email,
		Subject:   lib.CLIENT_USER_PASSWORD_RESET_SUBJECT,
		TextBody:  message,
	})

	return user, nil
}

type ResetUserPasswordInput struct {
	UserID      string
	NewPassword string
}

func (s *userService) ResetPassword(ctx context.Context, input ResetUserPasswordInput) (*models.User, error) {
	user, err := s.repo.GetByID(ctx, input.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("UserNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{"function": "ResetPassword", "action": "fetching user"},
		})
	}

	hashed, err := hashpassword.HashPassword(input.NewPassword)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{"function": "ResetPassword", "action": "hashing password"},
		})
	}
	user.Password = hashed

	if err := s.repo.Update(ctx, user); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{"function": "ResetPassword", "action": "saving user"},
		})
	}
	return user, nil
}
```

- [ ] **Step 2: Build**

```bash
cd services/main && go build ./...
```

- [ ] **Step 3: Commit**

```bash
git add services/main/internal/services/user.go
git commit -m "feat: add UserService (login, me, update, password, forgot/reset)"
```

---

## Task 7: Update ClientUserService + ClientApplicationService

**Files:**
- Modify: `services/main/internal/services/client-user.go`
- Modify: `services/main/internal/services/client-application.go`

- [ ] **Step 1: Update ClientUserService**

In `services/main/internal/services/client-user.go`:

1. Add `userRepo repository.UserRepository` field to `clientUserService` struct.

2. Update `NewClientUserService` signature and body:
```go
func NewClientUserService(
	appCtx pkg.AppContext,
	repo repository.ClientUserRepository,
	clientRepo repository.ClientRepository,
	userRepo repository.UserRepository,
) ClientUserService {
	return &clientUserService{appCtx, repo, clientRepo, userRepo}
}
```

3. Remove from the `ClientUserService` interface and delete the method bodies for:
   - `AuthenticateClientUser`
   - `SendForgotPasswordResetLink`
   - `ResetPassword`
   - `UpdateClientUser` (name/email/phone — moves to UserService)
   - `UpateClientUserPassword`

4. Update `CreateClientUserInput` — remove `Email`, `Name`, `Phone` — add `UserID`:
```go
type CreateClientUserInput struct {
	ClientID    string
	UserID      string
	Role        string
	CreatedByID string
}
```

5. Rewrite `CreateClientUser`:
```go
func (s *clientUserService) CreateClientUser(
	ctx context.Context,
	input CreateClientUserInput,
) (*models.ClientUser, error) {
	clientUser := models.ClientUser{
		UserID:      input.UserID,
		ClientID:    input.ClientID,
		Role:        input.Role,
		CreatedByID: &input.CreatedByID,
	}

	if err := s.InsertClientUser(ctx, &clientUser); err != nil {
		return nil, err
	}

	return &clientUser, nil
}
```

> Note: The handler will be responsible for finding or creating the User before calling CreateClientUser. See Task 8.

6. Keep `InsertClientUser`, `GetClientUser`, `GetClientUserByQuery`, `ListClientUsers`, `CountClientUsers`, `GetClientUserWithPopulate`, `ActivateClientUser`, `DeactivateClientUser` — these are unchanged in logic, but any that use `clientUser.Email` / `.Name` / `.PhoneNumber` for notifications need to preload the user. Update `ActivateClientUser` and `DeactivateClientUser` to preload `User` before sending email/SMS:

```go
// In ActivateClientUser, after fetching clientUserToBeActivated, add:
if err := s.repo.GetByID...; // already fetched

// Load User for notification fields
var user models.User
if err := s.appCtx.DB.Where("id = ?", clientUserToBeActivated.UserID).First(&user).Error; err == nil {
    r := strings.NewReplacer("{{name}}", user.Name)
    message := r.Replace(lib.CLIENT_USER_ACTIVATED_BODY)
    smsMessage := r.Replace(lib.CLIENT_USER_ACTIVATED_SMS_BODY)

    go pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
        Recipient: user.Email,
        Subject:   lib.CLIENT_USER_ACTIVATED_SUBJECT,
        TextBody:  message,
    })
    go s.appCtx.Clients.GatekeeperAPI.SendSMS(context.Background(), gatekeeper.SendSMSInput{
        Recipient: user.PhoneNumber,
        Message:   smsMessage,
    })
}
```

Apply the same pattern to `DeactivateClientUser`.

- [ ] **Step 2: Update ClientApplicationService — create User before ClientUser**

In `services/main/internal/services/client-application.go`:

1. Add `userService UserService` to `ClientApplicationServiceDeps` struct and `clientApplicationService` struct.

2. In `ApproveClientApplication`, replace the owner ClientUser creation block (around line 311–331):

```go
// generate password
password, err := gonanoid.Generate("abcdefghijklmnopqrstuvwxyz1234567890", 10)
if err != nil {
    return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
        Err: err,
        Metadata: map[string]string{
            "function": "ApproveClientApplication",
            "action":   "generating random password for OWNER",
        },
    })
}

ownerUser := models.User{
    Name:        clientApplication.ContactName,
    PhoneNumber: clientApplication.ContactPhoneNumber,
    Email:       clientApplication.ContactEmail,
    Password:    password,
}

if err := s.userService.InsertUser(transCtx, &ownerUser); err != nil {
    return nil, err
}

ownerClientUser := models.ClientUser{
    UserID:   ownerUser.ID.String(),
    ClientID: client.ID.String(),
    Role:     "OWNER",
}

if err := s.clientUserService.InsertClientUser(transCtx, &ownerClientUser); err != nil {
    return nil, err
}
```

- [ ] **Step 3: Update services/main.go — pass userRepo to NewClientUserService and ClientApplicationService**

In `services/main/internal/services/main.go`:

```go
clientUserService := NewClientUserService(
    params.AppCtx,
    params.Repository.ClientUserRepository,
    params.Repository.ClientRepository,
    params.Repository.UserRepository,  // ← add
)

userService := NewUserService(params.AppCtx, params.Repository.UserRepository)

clientApplicationService := NewClientApplicationService(ClientApplicationServiceDeps{
    AppCtx:            params.AppCtx,
    Repo:              params.Repository.ClientApplicationRepository,
    ClientService:     clientService,
    ClientUserService: clientUserService,
    UserService:       userService,  // ← add
})
```

Add `UserService UserService` to the `Services` struct and return it.

- [ ] **Step 4: Build**

```bash
cd services/main && go build ./...
```

- [ ] **Step 5: Commit**

```bash
git add services/main/internal/services/client-user.go services/main/internal/services/client-application.go services/main/internal/services/main.go
git commit -m "feat: update ClientUserService and ClientApplicationService for User model"
```

---

## Task 8: UserHandler

**Files:**
- Create: `services/main/internal/handlers/user.go`

- [ ] **Step 1: Create UserHandler**

```go
// services/main/internal/handlers/user.go
package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type UserHandler struct {
	appCtx  pkg.AppContext
	service services.UserService
}

func NewUserHandler(appCtx pkg.AppContext, service services.UserService) UserHandler {
	return UserHandler{appCtx, service}
}

type LoginUserRequest struct {
	Email    string `json:"email"    validate:"required,email" example:"user@example.com"`
	Password string `json:"password" validate:"required"       example:"secret123"`
}

// Login godoc
//
//	@Summary		Login user
//	@Description	Authenticate a user and return a JWT plus all client memberships
//	@Tags			Users
//	@Accept			json
//	@Produce		json
//	@Param			body	body		LoginUserRequest	true	"Login request"
//	@Success		200		{object}	object{data=transformations.OutputClientUser}
//	@Failure		400		{object}	lib.HTTPError
//	@Failure		404		{object}	lib.HTTPError
//	@Failure		422		{object}	lib.HTTPError
//	@Router			/api/v1/admin/users/login [post]
func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var body LoginUserRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	result, err := h.service.LoginUser(r.Context(), services.LoginUserInput{
		Email:    body.Email,
		Password: body.Password,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	if encErr := json.NewEncoder(w).Encode(map[string]interface{}{
		"data": transformations.DBUserToRestWithToken(&result.User, result.Token),
	}); encErr != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

// GetMe godoc
//
//	@Summary		Get current user
//	@Description	Returns the authenticated user with all client memberships
//	@Tags			Users
//	@Security		BearerAuth
//	@Produce		json
//	@Success		200	{object}	object{data=object}
//	@Failure		401	{object}	string
//	@Router			/api/v1/admin/users/me [get]
func (h *UserHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := lib.UserFromContext(r.Context())
	if !ok || userCtx == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := h.service.GetMe(r.Context(), userCtx.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	if encErr := json.NewEncoder(w).Encode(map[string]interface{}{
		"data": transformations.DBUserToRest(user),
	}); encErr != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

type UpdateMeRequest struct {
	Name        *lib.Optional[string] `json:"name"         swaggertype:"string"`
	PhoneNumber *lib.Optional[string] `json:"phone_number" swaggertype:"string"`
	Email       *lib.Optional[string] `json:"email"        swaggertype:"string"`
}

// UpdateMe godoc
//
//	@Summary		Update current user
//	@Description	Update name, email, or phone_number for the authenticated user
//	@Tags			Users
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body		UpdateMeRequest	true	"Update user request"
//	@Success		200		{object}	object{data=object}
//	@Failure		400		{object}	lib.HTTPError
//	@Failure		401		{object}	string
//	@Router			/api/v1/admin/users/me [patch]
func (h *UserHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := lib.UserFromContext(r.Context())
	if !ok || userCtx == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body UpdateMeRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	input := services.UpdateUserMeInput{UserID: userCtx.ID}
	if body.Name != nil {
		input.Name = *body.Name
	}
	if body.PhoneNumber != nil {
		input.PhoneNumber = *body.PhoneNumber
	}
	if body.Email != nil {
		input.Email = *body.Email
	}

	user, err := h.service.UpdateMe(r.Context(), input)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	if encErr := json.NewEncoder(w).Encode(map[string]interface{}{
		"data": transformations.DBUserToRest(user),
	}); encErr != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

type UpdatePasswordRequest struct {
	OldPassword string `json:"old_password" validate:"required" example:"oldpass"`
	NewPassword string `json:"new_password" validate:"required" example:"newpass"`
}

// UpdatePassword godoc
//
//	@Summary		Update password
//	@Tags			Users
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body		UpdatePasswordRequest	true	"Update password request"
//	@Success		204		{object}	nil
//	@Failure		400		{object}	lib.HTTPError
//	@Failure		401		{object}	string
//	@Router			/api/v1/admin/users/me/password [patch]
func (h *UserHandler) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := lib.UserFromContext(r.Context())
	if !ok || userCtx == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body UpdatePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	_, err := h.service.UpdatePassword(r.Context(), services.UpdateUserPasswordInput{
		UserID:      userCtx.ID,
		OldPassword: body.OldPassword,
		NewPassword: body.NewPassword,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email" example:"user@example.com"`
}

// ForgotPassword godoc
//
//	@Summary		Send password reset link
//	@Tags			Users
//	@Accept			json
//	@Produce		json
//	@Param			body	body		ForgotPasswordRequest	true	"Forgot password request"
//	@Success		204		{object}	nil
//	@Failure		404		{object}	lib.HTTPError
//	@Router			/api/v1/admin/users/forgot-password [post]
func (h *UserHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var body ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	_, err := h.service.SendForgotPasswordResetLink(r.Context(), body.Email)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type ResetPasswordRequest struct {
	NewPassword string `json:"new_password" validate:"required" example:"newpass"`
}

// ResetPassword godoc
//
//	@Summary		Reset password using token
//	@Tags			Users
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body		ResetPasswordRequest	true	"Reset password request"
//	@Success		204		{object}	nil
//	@Failure		400		{object}	lib.HTTPError
//	@Router			/api/v1/admin/users/reset-password [post]
func (h *UserHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := lib.UserFromContext(r.Context())
	if !ok || userCtx == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	_, err := h.service.ResetPassword(r.Context(), services.ResetUserPasswordInput{
		UserID:      userCtx.ID,
		NewPassword: body.NewPassword,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
```

- [ ] **Step 2: Build**

```bash
cd services/main && go build ./...
```

- [ ] **Step 3: Commit**

```bash
git add services/main/internal/handlers/user.go
git commit -m "feat: add UserHandler (login, me, update, password, forgot/reset)"
```

---

## Task 9: Update ClientUserHandler + handlers/main.go

**Files:**
- Modify: `services/main/internal/handlers/client-user.go`
- Modify: `services/main/internal/handlers/main.go`

- [ ] **Step 1: Update ClientUserHandler**

In `services/main/internal/handlers/client-user.go`:

1. Remove handler methods: `AuthenticateClientUser`, `SendForgotPasswordResetLink`, `ResetClientUserPassword`, `GetMe`, `UpdateClientUserSelf`, `UpdateClientUserPassword`. These are now on `UserHandler`.

2. Update `CreateClientUser` — the handler now needs to find or create a User, then create the ClientUser. It needs access to `UserService`:

Add `userService services.UserService` field to `ClientUserHandler` struct and update `NewClientUserHandler`:

```go
type ClientUserHandler struct {
	service     services.ClientUserService
	userService services.UserService
	appCtx      pkg.AppContext
}

func NewClientUserHandler(
	appCtx pkg.AppContext,
	service services.ClientUserService,
	userService services.UserService,
) ClientUserHandler {
	return ClientUserHandler{service, userService, appCtx}
}
```

3. Rewrite `CreateClientUser`:

```go
func (h *ClientUserHandler) CreateClientUser(w http.ResponseWriter, r *http.Request) {
	currentClientUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreateClientUserRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	// Find existing user or create a new one
	existingUser, getUserErr := h.userService.GetUserByEmail(r.Context(), body.Email)
	var userID string
	if getUserErr != nil {
		// Create new User with auto-generated password
		password, genErr := gonanoid.Generate("abcdefghijklmnopqrstuvwxyz1234567890", 10)
		if genErr != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		newUser := models.User{
			Name:        body.Name,
			Email:       body.Email,
			PhoneNumber: body.Phone,
			Password:    password,
		}
		if insertErr := h.userService.InsertUser(r.Context(), &newUser); insertErr != nil {
			HandleErrorResponse(w, insertErr)
			return
		}
		userID = newUser.ID.String()
		// Send welcome email with credentials
		// (email logic retained from original CreateClientUser)
		go pkg.SendEmail(h.appCtx.Config, pkg.SendEmailInput{
			Recipient: body.Email,
			Subject:   lib.CLIENT_USER_ADDED_SUBJECT,
			TextBody:  strings.NewReplacer("{{name}}", body.Name, "{{email}}", body.Email, "{{password}}", password).Replace(lib.CLIENT_USER_ADDED_BODY),
		})
		go h.appCtx.Clients.GatekeeperAPI.SendSMS(context.Background(), gatekeeper.SendSMSInput{
			Recipient: body.Phone,
			Message:   strings.NewReplacer("{{name}}", body.Name, "{{email}}", body.Email, "{{password}}", password).Replace(lib.CLIENT_USER_ADDED_SMS_BODY),
		})
	} else {
		userID = existingUser.ID.String()
	}

	clientUser, err := h.service.CreateClientUser(r.Context(), services.CreateClientUserInput{
		ClientID:    currentClientUser.ClientID,
		UserID:      userID,
		Role:        body.Role,
		CreatedByID: currentClientUser.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	if encErr := json.NewEncoder(w).Encode(map[string]interface{}{
		"data": transformations.DBClientUserToRest(clientUser),
	}); encErr != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
```

> `GetUserByEmail` needs to be added to `UserService` interface: `GetUserByEmail(ctx context.Context, email string) (*models.User, error)`. Add it in `services/user.go` as a thin wrapper around `repo.GetByEmail`.

- [ ] **Step 2: Add UserHandler to handlers/main.go**

In `services/main/internal/handlers/main.go`:

1. Add `UserHandler UserHandler` to `Handlers` struct.
2. Add `userHandler := NewUserHandler(appCtx, services.UserService)` in `NewHandlers`.
3. Update `NewClientUserHandler` call: `clientUserHandler := NewClientUserHandler(appCtx, services.ClientUserService, services.UserService)`.
4. Add `UserHandler: userHandler` to the return struct.

- [ ] **Step 3: Build**

```bash
cd services/main && go build ./...
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add services/main/internal/handlers/client-user.go services/main/internal/handlers/main.go
git commit -m "feat: update ClientUserHandler, add UserHandler wiring"
```

---

## Task 10: Update router

**Files:**
- Modify: `services/main/internal/router/client-user.go`

- [ ] **Step 1: Restructure the router**

Replace the full content of `services/main/internal/router/client-user.go`:

```go
package router

import (
	"github.com/Bendomey/rent-loop/services/main/internal/handlers"
	"github.com/Bendomey/rent-loop/services/main/internal/middlewares"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

func NewClientUserRouter(appCtx pkg.AppContext, handlers handlers.Handlers) func(r chi.Router) {
	return func(r chi.Router) {
		r.Use(middlewares.InjectUserAuthMiddleware(appCtx))

		// unprotected routes
		r.Group(func(r chi.Router) {
			r.Post("/v1/waitlist", handlers.WaitlistHandler.CreateWaitlistEntry)
			r.Post("/v1/admin/clients/apply", handlers.ClientApplicationHandler.CreateClientApplication)

			// User auth (formerly client-users/*)
			r.Post("/v1/admin/users/login", handlers.UserHandler.Login)
			r.Post("/v1/admin/users/forgot-password", handlers.UserHandler.ForgotPassword)

			// public unit lookup
			r.Get("/v1/units/{unit_id}", handlers.UnitHandler.FetchClientUnit)

			// signing (token-based)
			r.Get("/v1/signing/{token}/verify", handlers.SigningHandler.VerifyToken)
			r.Post("/v1/signing/{token}/sign", handlers.SigningHandler.SignDocument)

			// tenant application (public)
			r.Post("/v1/tenant-applications", handlers.TenantApplicationHandler.CreateTenantApplication)
			r.Patch("/v1/tenant-applications/{tenant_application_id}", handlers.TenantApplicationHandler.UpdateTenantApplication)
			r.Get("/v1/tenant-applications/{tenant_application_id}", handlers.TenantApplicationHandler.GetTenantApplication)

			r.Patch("/v1/documents/{document_id}", handlers.DocumentHandler.UpdateDocument)
		})

		// user-scoped protected routes (JWT required, no client_id)
		r.Group(func(r chi.Router) {
			r.Use(middlewares.CheckForUserAuthPresenceMiddleware)

			r.Route("/v1/admin/users", func(r chi.Router) {
				r.Get("/me", handlers.UserHandler.GetMe)
				r.Patch("/me", handlers.UserHandler.UpdateMe)
				r.Patch("/me/password", handlers.UserHandler.UpdatePassword)
				r.Get("/reset-password", handlers.ClientUserHandler.GetResetPasswordPage) // serves reset page
				r.Post("/reset-password", handlers.UserHandler.ResetPassword)
			})
		})

		// client-scoped protected routes (JWT + client_id in URL)
		r.Route("/v1/admin/clients/{client_id}", func(r chi.Router) {
			r.Use(middlewares.CheckForUserAuthPresenceMiddleware)
			r.Use(middlewares.ValidateClientMembershipMiddleware(appCtx))

			// analytics
			r.Get("/analytics/token", handlers.AnalyticsHandler.GetToken)

			// clients
			r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
				Patch("/", handlers.ClientHandler.UpdateClient)

			// client users
			r.Route("/client-users", func(r chi.Router) {
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Post("/", handlers.ClientUserHandler.CreateClientUser)
				r.Get("/", handlers.ClientUserHandler.ListClientUsers)
				r.Route("/{client_user_id}", func(r chi.Router) {
					r.Get("/", handlers.ClientUserHandler.GetClientUserWithPopulate)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Patch("/", handlers.ClientUserHandler.UpdateClientUserByID)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Post("/properties:link", handlers.ClientUserPropertyHandler.LinkClientUserToProperties)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Delete("/properties:unlink", handlers.ClientUserPropertyHandler.UnlinkClientUserFromProperties)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Post("/activate", handlers.ClientUserHandler.ActivateClientUser)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Post("/deactivate", handlers.ClientUserHandler.DeactivateClientUser)
				})
			})

			// properties
			r.Route("/properties", func(r chi.Router) {
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Post("/", handlers.PropertyHandler.CreateProperty)
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Get("/", handlers.PropertyHandler.ListProperties)
				r.Get("/me", handlers.ClientUserPropertyHandler.ListClientUserProperties)
				r.Get("/slug/{slug}", handlers.PropertyHandler.GetPropertyBySlug)

				r.Route("/{property_id}", func(r chi.Router) {
					r.Get("/leases", handlers.LeaseHandler.ListLeasesByProperty)
					r.Get("/tenants", handlers.TenantHandler.ListTenantsByProperty)
					r.Get("/", handlers.PropertyHandler.GetPropertyById)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Patch("/", handlers.PropertyHandler.UpdateProperty)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Delete("/", handlers.PropertyHandler.DeleteProperty)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Post("/client-users:link", handlers.ClientUserPropertyHandler.LinkPropertyToClientUsers)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Delete("/client-users:unlink", handlers.ClientUserPropertyHandler.UnlinkPropertyFromClientUsers)

					r.Route("/blocks", func(r chi.Router) {
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/", handlers.PropertyBlockHandler.CreatePropertyBlock)
						r.Get("/", handlers.PropertyBlockHandler.ListPropertyBlocks)
						r.Route("/{block_id}", func(r chi.Router) {
							r.Get("/", handlers.PropertyBlockHandler.GetPropertyBlock)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/", handlers.PropertyBlockHandler.UpdatePropertyBlock)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Delete("/", handlers.PropertyBlockHandler.DeletePropertyBlock)
							r.Route("/units", func(r chi.Router) {
								r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
									Post("/", handlers.UnitHandler.CreateUnit)
							})
						})
					})

					r.Route("/units", func(r chi.Router) {
						r.Get("/", handlers.UnitHandler.ListUnits)
						r.Route("/{unit_id}", func(r chi.Router) {
							r.Get("/", handlers.UnitHandler.GetUnit)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/", handlers.UnitHandler.UpdateUnit)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Delete("/", handlers.UnitHandler.DeleteUnit)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/status:draft", handlers.UnitHandler.UpdateUnitToDraftStatus)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/status:maintenance", handlers.UnitHandler.UpdateUnitToMaintenanceStatus)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/status:available", handlers.UnitHandler.UpdateUnitToAvailableStatus)
						})
					})

					r.Route("/expenses", func(r chi.Router) {
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/", handlers.ExpenseHandler.AddExpense)
						r.Get("/", handlers.ExpenseHandler.ListPropertyExpenses)
						r.Route("/{expense_id}", func(r chi.Router) {
							r.Get("/", handlers.ExpenseHandler.GetExpense)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Delete("/", handlers.ExpenseHandler.DeleteExpense)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Post("/generate:invoice", handlers.ExpenseHandler.GenerateExpenseInvoice)
						})
					})

					r.Route("/announcements", func(r chi.Router) {
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/", handlers.AnnouncementHandler.CreateAnnouncement)
						r.Get("/", handlers.AnnouncementHandler.ListAnnouncements)
						r.Route("/{announcement_id}", func(r chi.Router) {
							r.Get("/", handlers.AnnouncementHandler.GetAnnouncementById)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/", handlers.AnnouncementHandler.UpdateAnnouncement)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Delete("/", handlers.AnnouncementHandler.DeleteAnnouncement)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Post("/publish", handlers.AnnouncementHandler.PublishAnnouncement)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Post("/schedule", handlers.AnnouncementHandler.ScheduleAnnouncement)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Delete("/schedule", handlers.AnnouncementHandler.CancelScheduleAnnouncement)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/expiry", handlers.AnnouncementHandler.ExtendAnnouncementExpiry)
						})
					})

					r.Route("/tenant-applications", func(r chi.Router) {
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/invite", handlers.TenantApplicationHandler.SendTenantInvite)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/", handlers.TenantApplicationHandler.AdminCreateTenantApplication)
						r.Get("/", handlers.TenantApplicationHandler.ListTenantApplications)
						r.Get("/{tenant_application_id}", handlers.TenantApplicationHandler.AdminGetTenantApplication)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Patch("/{tenant_application_id}", handlers.TenantApplicationHandler.AdminUpdateTenantApplication)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Delete("/{tenant_application_id}", handlers.TenantApplicationHandler.DeleteTenantApplication)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Patch("/{tenant_application_id}/cancel", handlers.TenantApplicationHandler.CancelTenantApplication)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/{tenant_application_id}/invoice:generate", handlers.TenantApplicationHandler.GenerateInvoice)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/{tenant_application_id}/invoice/{invoice_id}/pay", handlers.TenantApplicationHandler.PayInvoice)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Patch("/{tenant_application_id}/approve", handlers.TenantApplicationHandler.ApproveTenantApplication)
					})

					r.Route("/signing", func(r chi.Router) {
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/", handlers.SigningHandler.SignDocumentPM)
					})

					r.Route("/signing-tokens", func(r chi.Router) {
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/", handlers.SigningHandler.GenerateToken)
						r.Get("/", handlers.SigningHandler.ListSigningTokens)
						r.Route("/{signing_token_id}", func(r chi.Router) {
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/", handlers.SigningHandler.UpdateToken)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Post("/resend", handlers.SigningHandler.ResendToken)
						})
					})

					r.Route("/leases/{lease_id}", func(r chi.Router) {
						r.Get("/", handlers.LeaseHandler.GetLeaseByID)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Patch("/", handlers.LeaseHandler.UpdateLease)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Patch("/status:active", handlers.LeaseHandler.ActivateLease)
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Patch("/status:cancelled", handlers.LeaseHandler.CancelLease)
						r.Route("/checklists", func(r chi.Router) {
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Post("/", handlers.LeaseChecklistHandler.CreateLeaseChecklist)
							r.Get("/", handlers.LeaseChecklistHandler.ListLeaseChecklists)
							r.Route("/{checklist_id}", func(r chi.Router) {
								r.Get("/", handlers.LeaseChecklistHandler.GetLeaseCheckList)
								r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
									Patch("/", handlers.LeaseChecklistHandler.UpdateLeaseChecklist)
								r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
									Delete("/", handlers.LeaseChecklistHandler.DeleteLeaseChecklist)
								r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
									Post("/submit", handlers.LeaseChecklistHandler.SubmitLeaseChecklist)
								r.Get("/comparison", handlers.LeaseChecklistHandler.GetChecklistComparison)
								r.Route("/items", func(r chi.Router) {
									r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
										Post("/", handlers.LeaseChecklistHandler.CreateLeaseChecklistItem)
									r.Route("/{item_id}", func(r chi.Router) {
										r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
											Patch("/", handlers.LeaseChecklistHandler.UpdateLeaseChecklistItem)
										r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
											Delete("/", handlers.LeaseChecklistHandler.DeleteLeaseChecklistItem)
									})
								})
							})
						})
						r.Route("/expenses", func(r chi.Router) {
							r.Get("/", handlers.ExpenseHandler.ListLeaseExpenses)
						})
					})

					r.Route("/tenants/{tenant_id}", func(r chi.Router) {
						r.Get("/", handlers.TenantHandler.GetTenantByID)
						r.Get("/leases", handlers.LeaseHandler.ListLeasesByTenant)
					})

					r.Route("/maintenance-requests", func(r chi.Router) {
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Post("/", handlers.MaintenanceRequestHandler.Create)
						r.Get("/", handlers.MaintenanceRequestHandler.List)
						r.Route("/{maintenance_request_id}", func(r chi.Router) {
							r.Get("/", handlers.MaintenanceRequestHandler.Get)
							r.Patch("/", handlers.MaintenanceRequestHandler.Update)
							r.Post("/assign-worker", handlers.MaintenanceRequestHandler.AssignWorker)
							r.Post("/assign-manager", handlers.MaintenanceRequestHandler.AssignManager)
							r.Patch("/status", handlers.MaintenanceRequestHandler.UpdateStatus)
							r.Get("/activity_logs", handlers.MaintenanceRequestHandler.ListActivityLogs)
							r.Route("/comments", func(r chi.Router) {
								r.Post("/", handlers.MaintenanceRequestHandler.CreateComment)
								r.Get("/", handlers.MaintenanceRequestHandler.ListComments)
								r.Route("/{comment_id}", func(r chi.Router) {
									r.Patch("/", handlers.MaintenanceRequestHandler.UpdateComment)
									r.Delete("/", handlers.MaintenanceRequestHandler.DeleteComment)
								})
							})
							r.Route("/expenses", func(r chi.Router) {
								r.Get("/", handlers.ExpenseHandler.ListMRExpenses)
							})
						})
					})

					r.Route("/invoices", func(r chi.Router) {
						r.Get("/", handlers.InvoiceHandler.ListInvoices)
						r.Route("/{invoice_id}", func(r chi.Router) {
							r.Get("/", handlers.InvoiceHandler.GetInvoiceByID)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/", handlers.InvoiceHandler.UpdateInvoice)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Patch("/void", handlers.InvoiceHandler.VoidInvoice)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Delete("/", handlers.InvoiceHandler.DeleteInvoice)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Post("/line-items", handlers.InvoiceHandler.AddLineItem)
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Delete("/line-items/{line_item_id}", handlers.InvoiceHandler.RemoveLineItem)
							r.Get("/line-items", handlers.InvoiceHandler.GetLineItems)
						})
					})

					r.Route("/payments/{payment_id}", func(r chi.Router) {
						r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
							Patch("/verify", handlers.PaymentHandler.VerifyPayment)
					})
				})
			})

			// global (client-scoped, not property-scoped)
			r.Route("/announcements", func(r chi.Router) {
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Post("/", handlers.AnnouncementHandler.CreateAnnouncement)
				r.Get("/", handlers.AnnouncementHandler.ListAnnouncements)
				r.Route("/{announcement_id}", func(r chi.Router) {
					r.Get("/", handlers.AnnouncementHandler.GetAnnouncementById)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Patch("/", handlers.AnnouncementHandler.UpdateAnnouncement)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Delete("/", handlers.AnnouncementHandler.DeleteAnnouncement)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Post("/publish", handlers.AnnouncementHandler.PublishAnnouncement)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Post("/schedule", handlers.AnnouncementHandler.ScheduleAnnouncement)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Delete("/schedule", handlers.AnnouncementHandler.CancelScheduleAnnouncement)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Patch("/expiry", handlers.AnnouncementHandler.ExtendAnnouncementExpiry)
				})
			})

			r.Route("/documents", func(r chi.Router) {
				r.Post("/", handlers.DocumentHandler.CreateDocument)
				r.Get("/", handlers.DocumentHandler.ListDocuments)
				r.Route("/{document_id}", func(r chi.Router) {
					r.Get("/", handlers.DocumentHandler.GetDocumentById)
					r.Patch("/", handlers.DocumentHandler.AdminUpdateDocument)
					r.Delete("/", handlers.DocumentHandler.DeleteDocument)
				})
			})

			r.Route("/client-user-properties", func(r chi.Router) {
				r.Get("/", handlers.ClientUserPropertyHandler.ListAllClientUserProperties)
				r.Get("/{client_user_property_id}", handlers.ClientUserPropertyHandler.FetchClientUserPropertyWithPopulate)
			})

			r.Route("/checklist-templates", func(r chi.Router) {
				r.Get("/", handlers.ChecklistTemplateHandler.ListChecklistTemplates)
				r.Get("/{template_id}", handlers.ChecklistTemplateHandler.GetChecklistTemplate)
			})

			r.Route("/payment-accounts", func(r chi.Router) {
				r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
					Post("/", handlers.PaymentAccountHandler.CreatePaymentAccount)
				r.Get("/", handlers.PaymentAccountHandler.ListPaymentAccounts)
				r.Route("/{payment_account_id}", func(r chi.Router) {
					r.Get("/", handlers.PaymentAccountHandler.GetPaymentAccountById)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Patch("/", handlers.PaymentAccountHandler.UpdatePaymentAccount)
					r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
						Delete("/", handlers.PaymentAccountHandler.DeletePaymentAccount)
				})
			})
		})
	}
}
```

- [ ] **Step 2: Build**

```bash
cd services/main && go build ./...
```

Expected: clean build.

- [ ] **Step 3: Run the migration against a test DB to verify it applies cleanly**

```bash
cd services/main && make setup-db
```

Expected: `[Migration] Done` with no errors.

- [ ] **Step 4: Commit**

```bash
git add services/main/internal/router/client-user.go
git commit -m "feat: restructure routes — /users/* for identity, /clients/{id}/* for all resources"
```

---

## Task 11: Update Swagger docs

- [ ] **Step 1: Regenerate**

```bash
cd services/main && make generate-docs
```

- [ ] **Step 2: Commit**

```bash
git add services/main/docs/
git commit -m "docs: regenerate swagger after user/client-user route restructure"
```
