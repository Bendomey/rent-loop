# Notification System — Backend Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `notifications` and `notification_deliveries` tables, repository, service methods, and REST API endpoints so the system can persist, list, mark-read, and count unread in-app notifications for both tenant accounts and property manager client users.

**Architecture:** New `Notification` and `NotificationDelivery` GORM models backed by `NotificationRepository`. The existing `NotificationService` gains `CreateNotification`, `ListInApp`, `MarkAsRead`, `MarkAllAsRead`, and `GetUnreadCount` methods. Six new HTTP endpoints (3 tenant + 3 PM) are registered. No existing callers of `SendToTenantAccount` are changed — wiring notification creation to business events is a follow-on plan.

**Tech Stack:** Go 1.24, GORM with pgx/PostgreSQL, chi router, gorm.io/datatypes (JSONB), go-gormigrate (versioned migrations), asynq (Redis queue already in place)

## Global Constraints

- All JSON struct tags must be snake_case
- Handlers must never call repositories directly — always go through the service layer
- Every handler must have complete Swagger godoc annotations (`@Summary`, `@Tags`, `@Security`, `@Param`, `@Success`, `@Failure`, `@Router`)
- Run `make lint-fix` before each commit; run `make generate-docs` after adding Swagger annotations
- Never commit — leave all changes unstaged for the user to commit

---

## File Map

| Action  | Path |
|---------|------|
| Create  | `services/main/internal/models/notification.go` |
| Create  | `services/main/init/migration/jobs/add-notification-tables.go` |
| Modify  | `services/main/init/migration/main.go` |
| Create  | `services/main/internal/repository/notification.go` |
| Modify  | `services/main/internal/repository/main.go` |
| Modify  | `services/main/internal/services/notification.go` |
| Modify  | `services/main/internal/services/main.go` |
| Create  | `services/main/internal/transformations/notification.go` |
| Create  | `services/main/internal/transformations/notification_test.go` |
| Modify  | `services/main/internal/handlers/notification.go` |
| Modify  | `services/main/internal/router/tenant.go` |
| Modify  | `services/main/internal/router/client-user.go` |

---

### Task 1: Notification and NotificationDelivery models

**Files:**
- Create: `services/main/internal/models/notification.go`

**Interfaces:**
- Produces: `models.Notification`, `models.NotificationDelivery` — consumed by Tasks 2, 3, 5

- [ ] **Step 1: Create the model file**

```go
package models

import (
	"time"

	"github.com/gofrs/uuid"
	"gorm.io/datatypes"
)

// Notification is the source-of-truth record for every notification event.
// visibility = IN_APP  → shown in the user's notification centre.
// visibility = HIDDEN  → stored for audit/delivery tracking only; never returned to users.
type Notification struct {
	BaseModel
	OrganizationID string         `gorm:"not null;index"`
	RecipientID    string         `gorm:"not null;index"`
	RecipientType  string         `gorm:"not null"` // CLIENT_USER | TENANT_ACCOUNT
	Event          string         `gorm:"not null"`
	Category       *string
	Visibility     string         `gorm:"not null;default:'IN_APP'"` // IN_APP | HIDDEN
	Title          *string
	Body           *string        `gorm:"type:text"`
	Data           datatypes.JSON `gorm:"type:jsonb"`
	IsRead         bool           `gorm:"not null;default:false"`
	ReadAt         *time.Time
	Status         string `gorm:"not null;default:'PENDING'"` // PENDING | PROCESSING | COMPLETED | PARTIAL | FAILED
	ScheduledAt    *time.Time
	ExpiresAt      *time.Time
}

// NotificationDelivery tracks a single channel delivery attempt for a Notification.
type NotificationDelivery struct {
	BaseModel
	NotificationID    uuid.UUID    `gorm:"not null;index"`
	Notification      Notification `gorm:"foreignKey:NotificationID"`
	Channel           string       `gorm:"not null"` // EMAIL | SMS | PUSH
	Provider          *string
	RecipientAddress  *string
	ProviderMessageID *string
	Status            string  `gorm:"not null;default:'QUEUED'"` // QUEUED | PROCESSING | SENT | DELIVERED | FAILED | RETRYING
	Attempts          int     `gorm:"not null;default:0"`
	MaxAttempts       int     `gorm:"not null;default:5"`
	ErrorCode         *string
	ErrorMessage      *string    `gorm:"type:text"`
	QueuedAt          time.Time  `gorm:"not null;default:CURRENT_TIMESTAMP"`
	SentAt            *time.Time
	DeliveredAt       *time.Time
	FailedAt          *time.Time
	NextRetryAt       *time.Time
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd services/main && go build ./internal/models/...
```

Expected: no output (success)

- [ ] **Step 3: Commit**

```bash
git add services/main/internal/models/notification.go
git commit -m "feat(notification): add Notification and NotificationDelivery models"
```

---

### Task 2: Migration

**Files:**
- Create: `services/main/init/migration/jobs/add-notification-tables.go`
- Modify: `services/main/init/migration/main.go`

**Interfaces:**
- Consumes: `models.Notification`, `models.NotificationDelivery` from Task 1
- Produces: `notifications` and `notification_deliveries` tables + performance indexes

- [ ] **Step 1: Create the migration job file**

`services/main/init/migration/jobs/add-notification-tables.go`:

```go
package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddNotificationTables() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202406300001_ADD_NOTIFICATION_TABLES",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`
				CREATE INDEX IF NOT EXISTS idx_notifications_recipient
				ON notifications (recipient_id, recipient_type, visibility, is_read, created_at DESC)
			`).Error; err != nil {
				return err
			}
			return db.Exec(`
				CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification
				ON notification_deliveries (notification_id, channel, status)
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			db.Exec(`DROP INDEX IF EXISTS idx_notifications_recipient`)
			return db.Exec(`DROP INDEX IF EXISTS idx_notification_deliveries_notification`).Error
		},
	}
}
```

- [ ] **Step 2: Add models to AutoMigrate**

In `services/main/init/migration/main.go`, inside the `updateMigration` function's `db.AutoMigrate(...)` call, add after `&models.ExchangeRate{}`:

```go
		&models.Notification{},
		&models.NotificationDelivery{},
```

- [ ] **Step 3: Register the migration in the versioned list**

In `services/main/init/migration/main.go`, add at the end of the second `gormigrate.New(...)` slice (after `jobs.FixLADLeaseIDPartialUniqueIndex()`):

```go
		jobs.AddNotificationTables(),
```

- [ ] **Step 4: Verify it compiles**

```bash
cd services/main && go build ./init/...
```

Expected: no output

- [ ] **Step 5: Run migration**

```bash
cd services/main && make update-db
```

Expected: logs showing `notifications` and `notification_deliveries` tables created, migration `202406300001_ADD_NOTIFICATION_TABLES` applied

- [ ] **Step 6: Commit**

```bash
git add services/main/init/migration/jobs/add-notification-tables.go \
        services/main/init/migration/main.go
git commit -m "feat(notification): add notifications and notification_deliveries migrations"
```

---

### Task 3: NotificationRepository

**Files:**
- Create: `services/main/internal/repository/notification.go`

**Interfaces:**
- Consumes: `models.Notification`, `models.NotificationDelivery` from Task 1
- Produces:
  - `NotificationRepository` interface with `Create`, `CreateDelivery`, `UpdateDelivery`, `ListInApp`, `MarkAsRead`, `MarkAllAsRead`, `GetUnreadCount`
  - Consumed by Task 4 (wire) and Task 5 (service)

- [ ] **Step 1: Create the repository file**

```go
package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type NotificationRepository interface {
	// Create persists a new Notification record.
	Create(ctx context.Context, n *models.Notification) error
	// CreateDelivery persists a new NotificationDelivery record.
	CreateDelivery(ctx context.Context, d *models.NotificationDelivery) error
	// UpdateDelivery saves delivery status changes (status, attempts, sent_at, etc.).
	UpdateDelivery(ctx context.Context, d *models.NotificationDelivery) error
	// ListInApp returns IN_APP notifications for a recipient, newest first, paginated.
	ListInApp(ctx context.Context, recipientID, recipientType string, page, pageSize int) ([]*models.Notification, int64, error)
	// MarkAsRead sets is_read=true and read_at=NOW() for one notification, verifying ownership.
	// Returns gorm.ErrRecordNotFound if the notification does not belong to the recipient.
	MarkAsRead(ctx context.Context, id, recipientID string) error
	// MarkAllAsRead marks every unread IN_APP notification as read for a recipient.
	MarkAllAsRead(ctx context.Context, recipientID, recipientType string) error
	// GetUnreadCount returns the count of unread IN_APP notifications for a recipient.
	GetUnreadCount(ctx context.Context, recipientID, recipientType string) (int64, error)
}

type notificationRepository struct {
	DB *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{DB: db}
}

func (r *notificationRepository) Create(ctx context.Context, n *models.Notification) error {
	return r.DB.WithContext(ctx).Create(n).Error
}

func (r *notificationRepository) CreateDelivery(ctx context.Context, d *models.NotificationDelivery) error {
	return r.DB.WithContext(ctx).Create(d).Error
}

func (r *notificationRepository) UpdateDelivery(ctx context.Context, d *models.NotificationDelivery) error {
	return r.DB.WithContext(ctx).Save(d).Error
}

func (r *notificationRepository) ListInApp(
	ctx context.Context,
	recipientID, recipientType string,
	page, pageSize int,
) ([]*models.Notification, int64, error) {
	var notifications []*models.Notification
	var total int64

	query := r.DB.WithContext(ctx).
		Model(&models.Notification{}).
		Where("recipient_id = ? AND recipient_type = ? AND visibility = 'IN_APP'", recipientID, recipientType)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&notifications).Error; err != nil {
		return nil, 0, err
	}

	return notifications, total, nil
}

func (r *notificationRepository) MarkAsRead(ctx context.Context, id, recipientID string) error {
	result := r.DB.WithContext(ctx).
		Model(&models.Notification{}).
		Where("id = ? AND recipient_id = ?", id, recipientID).
		Updates(map[string]any{
			"is_read": true,
			"read_at": gorm.Expr("NOW()"),
		})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *notificationRepository) MarkAllAsRead(ctx context.Context, recipientID, recipientType string) error {
	return r.DB.WithContext(ctx).
		Model(&models.Notification{}).
		Where("recipient_id = ? AND recipient_type = ? AND visibility = 'IN_APP' AND is_read = false", recipientID, recipientType).
		Updates(map[string]any{
			"is_read": true,
			"read_at": gorm.Expr("NOW()"),
		}).Error
}

func (r *notificationRepository) GetUnreadCount(ctx context.Context, recipientID, recipientType string) (int64, error) {
	var count int64
	err := r.DB.WithContext(ctx).
		Model(&models.Notification{}).
		Where("recipient_id = ? AND recipient_type = ? AND visibility = 'IN_APP' AND is_read = false", recipientID, recipientType).
		Count(&count).Error
	return count, err
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd services/main && go build ./internal/repository/...
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add services/main/internal/repository/notification.go
git commit -m "feat(notification): add NotificationRepository"
```

---

### Task 4: Wire NotificationRepository into Repository struct

**Files:**
- Modify: `services/main/internal/repository/main.go`

**Interfaces:**
- Consumes: `NotificationRepository` from Task 3
- Produces: `Repository.NotificationRepository` — consumed by Task 5

- [ ] **Step 1: Add NotificationRepository field to the Repository struct**

In `services/main/internal/repository/main.go`, add to the `Repository` struct (after `LeaseAgreementDocumentRepository LeaseAgreementDocumentRepository`):

```go
	NotificationRepository NotificationRepository
```

- [ ] **Step 2: Initialize and wire in NewRepository**

After `leaseAgreementDocumentRepository := NewLeaseAgreementDocumentRepository(db)`, add:

```go
	notificationRepository := NewNotificationRepository(db)
```

Add to the returned `Repository{}` struct (after `LeaseAgreementDocumentRepository: leaseAgreementDocumentRepository`):

```go
	NotificationRepository: notificationRepository,
```

- [ ] **Step 3: Verify**

```bash
cd services/main && go build ./internal/repository/...
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
git add services/main/internal/repository/main.go
git commit -m "feat(notification): wire NotificationRepository into Repository"
```

---

### Task 5: Extend NotificationService with persistence methods

**Files:**
- Modify: `services/main/internal/services/notification.go`
- Modify: `services/main/internal/services/main.go`

**Interfaces:**
- Consumes: `NotificationRepository` from Task 3/4
- Produces (new interface methods on `NotificationService`):
  - `CreateNotification(ctx, CreateNotificationInput) (*models.Notification, error)`
  - `ListInApp(ctx, recipientID, recipientType string, page, pageSize int) ([]*models.Notification, int64, error)`
  - `MarkAsRead(ctx, notificationID, recipientID string) error`
  - `MarkAllAsRead(ctx, recipientID, recipientType string) error`
  - `GetUnreadCount(ctx, recipientID, recipientType string) (int64, error)`
  - Consumed by Task 7 (handlers)

- [ ] **Step 1: Add new interface methods to NotificationService**

In `services/main/internal/services/notification.go`, extend the `NotificationService` interface:

```go
type NotificationService interface {
	// RegisterToken upserts an FCM device token for the given tenant account.
	RegisterToken(ctx context.Context, input RegisterFcmTokenInput) error
	// DeleteToken removes a specific FCM token, verifying it belongs to the given tenant account.
	DeleteToken(ctx context.Context, tenantAccountID, token string) error
	// SendToTenantAccount fans out a push notification to all tokens for the account.
	// Invalid tokens reported by FCM are automatically deleted.
	SendToTenantAccount(ctx context.Context, tenantAccountID, title, body string, data map[string]string) error

	// CreateNotification persists a new notification record and returns it.
	CreateNotification(ctx context.Context, input CreateNotificationInput) (*models.Notification, error)
	// ListInApp returns paginated IN_APP notifications for a recipient, newest first.
	ListInApp(ctx context.Context, recipientID, recipientType string, page, pageSize int) ([]*models.Notification, int64, error)
	// MarkAsRead marks one notification as read, verifying ownership by recipientID.
	MarkAsRead(ctx context.Context, notificationID, recipientID string) error
	// MarkAllAsRead marks all unread IN_APP notifications as read for a recipient.
	MarkAllAsRead(ctx context.Context, recipientID, recipientType string) error
	// GetUnreadCount returns the count of unread IN_APP notifications for a recipient.
	GetUnreadCount(ctx context.Context, recipientID, recipientType string) (int64, error)
}
```

- [ ] **Step 2: Add CreateNotificationInput type**

```go
type CreateNotificationInput struct {
	OrganizationID string
	RecipientID    string
	RecipientType  string  // "CLIENT_USER" | "TENANT_ACCOUNT"
	Event          string
	Category       *string
	Visibility     string // "IN_APP" | "HIDDEN"
	Title          string
	Body           string
	Data           map[string]any
}
```

- [ ] **Step 3: Add notificationRepo to notificationService struct and update constructor**

Replace the existing `notificationService` struct and `NewNotificationService`:

```go
type notificationService struct {
	appCtx           pkg.AppContext
	fcmTokenRepo     repository.FcmTokenRepository
	notificationRepo repository.NotificationRepository
}

func NewNotificationService(
	appCtx pkg.AppContext,
	fcmTokenRepo repository.FcmTokenRepository,
	notificationRepo repository.NotificationRepository,
) NotificationService {
	return &notificationService{
		appCtx:           appCtx,
		fcmTokenRepo:     fcmTokenRepo,
		notificationRepo: notificationRepo,
	}
}
```

- [ ] **Step 4: Implement the five new methods**

Add these methods after the existing `SendToTenantAccount` implementation:

```go
func (s *notificationService) CreateNotification(
	ctx context.Context,
	input CreateNotificationInput,
) (*models.Notification, error) {
	var dataJSON datatypes.JSON
	if input.Data != nil {
		raw, err := json.Marshal(input.Data)
		if err != nil {
			return nil, pkg.InternalServerError("failed to marshal notification data", &pkg.RentLoopErrorParams{Err: err})
		}
		dataJSON = datatypes.JSON(raw)
	}

	n := &models.Notification{
		OrganizationID: input.OrganizationID,
		RecipientID:    input.RecipientID,
		RecipientType:  input.RecipientType,
		Event:          input.Event,
		Category:       input.Category,
		Visibility:     input.Visibility,
		Title:          &input.Title,
		Body:           &input.Body,
		Data:           dataJSON,
		Status:         "PENDING",
	}

	if err := s.notificationRepo.Create(ctx, n); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return n, nil
}

func (s *notificationService) ListInApp(
	ctx context.Context,
	recipientID, recipientType string,
	page, pageSize int,
) ([]*models.Notification, int64, error) {
	notifications, total, err := s.notificationRepo.ListInApp(ctx, recipientID, recipientType, page, pageSize)
	if err != nil {
		return nil, 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return notifications, total, nil
}

func (s *notificationService) MarkAsRead(ctx context.Context, notificationID, recipientID string) error {
	err := s.notificationRepo.MarkAsRead(ctx, notificationID, recipientID)
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return pkg.NotFoundError("notification not found", &pkg.RentLoopErrorParams{Err: err})
	}
	return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
}

func (s *notificationService) MarkAllAsRead(ctx context.Context, recipientID, recipientType string) error {
	if err := s.notificationRepo.MarkAllAsRead(ctx, recipientID, recipientType); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return nil
}

func (s *notificationService) GetUnreadCount(ctx context.Context, recipientID, recipientType string) (int64, error) {
	count, err := s.notificationRepo.GetUnreadCount(ctx, recipientID, recipientType)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return count, nil
}
```

Add these imports to `notification.go` (alongside existing imports):
```go
"encoding/json"
"errors"

"gorm.io/datatypes"
"gorm.io/gorm"
```

- [ ] **Step 5: Update NewNotificationService call in services/main.go**

In `services/main/internal/services/main.go`, replace the current `notificationService` instantiation:

```go
notificationService := NewNotificationService(
    params.AppCtx,
    params.Repository.FcmTokenRepository,
    params.Repository.NotificationRepository,
)
```

- [ ] **Step 6: Verify full build**

```bash
cd services/main && go build ./internal/services/...
```

Expected: no output

- [ ] **Step 7: Commit**

```bash
git add services/main/internal/services/notification.go \
        services/main/internal/services/main.go
git commit -m "feat(notification): extend NotificationService with create/list/mark-read/unread-count"
```

---

### Task 6: Notification transformation

**Files:**
- Create: `services/main/internal/transformations/notification.go`
- Create: `services/main/internal/transformations/notification_test.go`

**Interfaces:**
- Consumes: `models.Notification` from Task 1
- Produces: `DBNotificationToRest(*models.Notification) any` — consumed by Task 7 (handlers)

- [ ] **Step 1: Write the failing test**

`services/main/internal/transformations/notification_test.go`:

```go
package transformations_test

import (
	"testing"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/gofrs/uuid"
)

func TestDBNotificationToRest_nil(t *testing.T) {
	result := transformations.DBNotificationToRest(nil)
	if result != nil {
		t.Errorf("expected nil for nil input, got %v", result)
	}
}

func TestDBNotificationToRest_fields(t *testing.T) {
	id, _ := uuid.NewV4()
	title := "Invoice Due"
	body := "Your invoice INV-2041 is due tomorrow"
	now := time.Now()

	n := &models.Notification{
		BaseModel:      models.BaseModel{ID: id, CreatedAt: now, UpdatedAt: now},
		OrganizationID: "org-123",
		RecipientID:    "user-456",
		RecipientType:  "TENANT_ACCOUNT",
		Event:          "INVOICE_REMINDER",
		Visibility:     "IN_APP",
		Title:          &title,
		Body:           &body,
		IsRead:         false,
		Status:         "PENDING",
	}

	result := transformations.DBNotificationToRest(n)
	if result == nil {
		t.Fatal("expected non-nil result")
	}

	m := result.(map[string]any)
	if m["id"] != id.String() {
		t.Errorf("id: got %v, want %v", m["id"], id.String())
	}
	if m["event"] != "INVOICE_REMINDER" {
		t.Errorf("event: got %v, want INVOICE_REMINDER", m["event"])
	}
	if m["visibility"] != "IN_APP" {
		t.Errorf("visibility: got %v, want IN_APP", m["visibility"])
	}
	if m["is_read"] != false {
		t.Errorf("is_read: got %v, want false", m["is_read"])
	}
	if m["organization_id"] != "org-123" {
		t.Errorf("organization_id: got %v, want org-123", m["organization_id"])
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd services/main && go test ./internal/transformations/... -run TestDBNotificationToRest -v
```

Expected: FAIL — `undefined: transformations.DBNotificationToRest`

- [ ] **Step 3: Implement the transformation**

`services/main/internal/transformations/notification.go`:

```go
package transformations

import "github.com/Bendomey/rent-loop/services/main/internal/models"

func DBNotificationToRest(n *models.Notification) any {
	if n == nil {
		return nil
	}
	return map[string]any{
		"id":              n.ID.String(),
		"organization_id": n.OrganizationID,
		"recipient_id":   n.RecipientID,
		"recipient_type": n.RecipientType,
		"event":          n.Event,
		"category":       n.Category,
		"visibility":     n.Visibility,
		"title":          n.Title,
		"body":           n.Body,
		"data":           n.Data,
		"is_read":        n.IsRead,
		"read_at":        n.ReadAt,
		"status":         n.Status,
		"scheduled_at":   n.ScheduledAt,
		"expires_at":     n.ExpiresAt,
		"created_at":     n.CreatedAt,
		"updated_at":     n.UpdatedAt,
	}
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd services/main && go test ./internal/transformations/... -run TestDBNotificationToRest -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/main/internal/transformations/notification.go \
        services/main/internal/transformations/notification_test.go
git commit -m "feat(notification): add DBNotificationToRest transformation with tests"
```

---

### Task 7: Notification HTTP handlers

**Files:**
- Modify: `services/main/internal/handlers/notification.go`

**Interfaces:**
- Consumes:
  - `services.NotificationService` methods: `ListInApp`, `MarkAsRead`, `MarkAllAsRead`, `GetUnreadCount` from Task 5
  - `transformations.DBNotificationToRest` from Task 6
  - `lib.GenerateQuery`, `lib.ReturnListResponse` (already imported)
  - `lib.TenantAccountFromContext`, `lib.ClientUserFromContext` (already imported)
- Produces:
  - `TenantListNotifications` — `GET /v1/tenant-accounts/notifications`
  - `TenantMarkNotificationRead` — `POST /v1/tenant-accounts/notifications/{notification_id}/read`
  - `TenantMarkAllRead` — `POST /v1/tenant-accounts/notifications/read-all`
  - `TenantGetUnreadCount` — `GET /v1/tenant-accounts/notifications/unread-count`
  - `PMListNotifications` — `GET /v1/notifications`
  - `PMMarkNotificationRead` — `POST /v1/notifications/{notification_id}/read`
  - `PMMarkAllRead` — `POST /v1/notifications/read-all`
  - `PMGetUnreadCount` — `GET /v1/notifications/unread-count`
  - Consumed by Task 8 (routes)

- [ ] **Step 1: Add required imports to notification.go**

Add to the existing import block in `services/main/internal/handlers/notification.go`:

```go
"github.com/Bendomey/rent-loop/services/main/internal/transformations"
"github.com/go-chi/chi/v5"
log "github.com/sirupsen/logrus"
```

- [ ] **Step 2: Add all eight handlers after the existing RegisterFcmToken handler**

```go
// TenantListNotifications godoc
//
//	@Summary		List in-app notifications (Tenant)
//	@Description	Returns paginated in-app notifications for the authenticated tenant account, newest first.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			page		query	int	false	"Page number (default 1)"
//	@Param			page_size	query	int	false	"Page size (default 20, max 50)"
//	@Success		200	{object}	object{data=object{rows=[]object,meta=object}}
//	@Failure		401	{object}	lib.HTTPError	"Unauthorized"
//	@Failure		500	{object}	string			"Unexpected error"
//	@Router			/api/v1/tenant-accounts/notifications [get]
func (h *NotificationHandler) TenantListNotifications(w http.ResponseWriter, r *http.Request) {
	tenantAccount, _ := lib.TenantAccountFromContext(r.Context())
	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		http.Error(w, filterErr.Error(), http.StatusBadRequest)
		return
	}

	notifications, total, err := h.service.ListInApp(r.Context(), tenantAccount.ID, "TENANT_ACCOUNT", filterQuery.Page, filterQuery.PageSize)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	rows := make([]any, len(notifications))
	for i, n := range notifications {
		rows[i] = transformations.DBNotificationToRest(n)
	}

	w.WriteHeader(http.StatusOK)
	if encodeErr := json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, total)); encodeErr != nil {
		log.Error(encodeErr.Error())
	}
}

// TenantMarkNotificationRead godoc
//
//	@Summary		Mark notification as read (Tenant)
//	@Description	Marks a single in-app notification as read for the authenticated tenant account.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			notification_id	path	string	true	"Notification ID (UUID)"
//	@Success		204	{object}	nil				"No Content"
//	@Failure		401	{object}	lib.HTTPError	"Unauthorized"
//	@Failure		404	{object}	lib.HTTPError	"Not found"
//	@Failure		500	{object}	string			"Unexpected error"
//	@Router			/api/v1/tenant-accounts/notifications/{notification_id}/read [post]
func (h *NotificationHandler) TenantMarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	tenantAccount, _ := lib.TenantAccountFromContext(r.Context())
	notificationID := chi.URLParam(r, "notification_id")

	if err := h.service.MarkAsRead(r.Context(), notificationID, tenantAccount.ID); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// TenantMarkAllRead godoc
//
//	@Summary		Mark all notifications as read (Tenant)
//	@Description	Marks all unread in-app notifications as read for the authenticated tenant account.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		204	{object}	nil				"No Content"
//	@Failure		401	{object}	lib.HTTPError	"Unauthorized"
//	@Failure		500	{object}	string			"Unexpected error"
//	@Router			/api/v1/tenant-accounts/notifications/read-all [post]
func (h *NotificationHandler) TenantMarkAllRead(w http.ResponseWriter, r *http.Request) {
	tenantAccount, _ := lib.TenantAccountFromContext(r.Context())

	if err := h.service.MarkAllAsRead(r.Context(), tenantAccount.ID, "TENANT_ACCOUNT"); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// TenantGetUnreadCount godoc
//
//	@Summary		Get unread notification count (Tenant)
//	@Description	Returns the count of unread in-app notifications for the authenticated tenant account.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	object{data=object{count=integer}}	"Unread count"
//	@Failure		401	{object}	lib.HTTPError						"Unauthorized"
//	@Failure		500	{object}	string								"Unexpected error"
//	@Router			/api/v1/tenant-accounts/notifications/unread-count [get]
func (h *NotificationHandler) TenantGetUnreadCount(w http.ResponseWriter, r *http.Request) {
	tenantAccount, _ := lib.TenantAccountFromContext(r.Context())

	count, err := h.service.GetUnreadCount(r.Context(), tenantAccount.ID, "TENANT_ACCOUNT")
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	if encodeErr := json.NewEncoder(w).Encode(map[string]any{
		"data": map[string]any{"count": count},
	}); encodeErr != nil {
		log.Error(encodeErr.Error())
	}
}

// PMListNotifications godoc
//
//	@Summary		List in-app notifications (Property Manager)
//	@Description	Returns paginated in-app notifications for the authenticated client user, newest first.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			page		query	int	false	"Page number (default 1)"
//	@Param			page_size	query	int	false	"Page size (default 20, max 50)"
//	@Success		200	{object}	object{data=object{rows=[]object,meta=object}}
//	@Failure		401	{object}	lib.HTTPError	"Unauthorized"
//	@Failure		500	{object}	string			"Unexpected error"
//	@Router			/api/v1/notifications [get]
func (h *NotificationHandler) PMListNotifications(w http.ResponseWriter, r *http.Request) {
	clientUser, _ := lib.ClientUserFromContext(r.Context())
	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		http.Error(w, filterErr.Error(), http.StatusBadRequest)
		return
	}

	notifications, total, err := h.service.ListInApp(r.Context(), clientUser.ID, "CLIENT_USER", filterQuery.Page, filterQuery.PageSize)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	rows := make([]any, len(notifications))
	for i, n := range notifications {
		rows[i] = transformations.DBNotificationToRest(n)
	}

	w.WriteHeader(http.StatusOK)
	if encodeErr := json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, total)); encodeErr != nil {
		log.Error(encodeErr.Error())
	}
}

// PMMarkNotificationRead godoc
//
//	@Summary		Mark notification as read (Property Manager)
//	@Description	Marks a single in-app notification as read for the authenticated client user.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			notification_id	path	string	true	"Notification ID (UUID)"
//	@Success		204	{object}	nil				"No Content"
//	@Failure		401	{object}	lib.HTTPError	"Unauthorized"
//	@Failure		404	{object}	lib.HTTPError	"Not found"
//	@Failure		500	{object}	string			"Unexpected error"
//	@Router			/api/v1/notifications/{notification_id}/read [post]
func (h *NotificationHandler) PMMarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	clientUser, _ := lib.ClientUserFromContext(r.Context())
	notificationID := chi.URLParam(r, "notification_id")

	if err := h.service.MarkAsRead(r.Context(), notificationID, clientUser.ID); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// PMMarkAllRead godoc
//
//	@Summary		Mark all notifications as read (Property Manager)
//	@Description	Marks all unread in-app notifications as read for the authenticated client user.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		204	{object}	nil				"No Content"
//	@Failure		401	{object}	lib.HTTPError	"Unauthorized"
//	@Failure		500	{object}	string			"Unexpected error"
//	@Router			/api/v1/notifications/read-all [post]
func (h *NotificationHandler) PMMarkAllRead(w http.ResponseWriter, r *http.Request) {
	clientUser, _ := lib.ClientUserFromContext(r.Context())

	if err := h.service.MarkAllAsRead(r.Context(), clientUser.ID, "CLIENT_USER"); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// PMGetUnreadCount godoc
//
//	@Summary		Get unread notification count (Property Manager)
//	@Description	Returns the count of unread in-app notifications for the authenticated client user.
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	object{data=object{count=integer}}	"Unread count"
//	@Failure		401	{object}	lib.HTTPError						"Unauthorized"
//	@Failure		500	{object}	string								"Unexpected error"
//	@Router			/api/v1/notifications/unread-count [get]
func (h *NotificationHandler) PMGetUnreadCount(w http.ResponseWriter, r *http.Request) {
	clientUser, _ := lib.ClientUserFromContext(r.Context())

	count, err := h.service.GetUnreadCount(r.Context(), clientUser.ID, "CLIENT_USER")
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	if encodeErr := json.NewEncoder(w).Encode(map[string]any{
		"data": map[string]any{"count": count},
	}); encodeErr != nil {
		log.Error(encodeErr.Error())
	}
}
```

- [ ] **Step 3: Verify it compiles**

```bash
cd services/main && go build ./internal/handlers/...
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
git add services/main/internal/handlers/notification.go
git commit -m "feat(notification): add tenant and PM notification handlers"
```

---

### Task 8: Wire routes

**Files:**
- Modify: `services/main/internal/router/tenant.go`
- Modify: `services/main/internal/router/client-user.go`

**Interfaces:**
- Consumes: handlers from Task 7
- Produces: 8 HTTP routes registered on the chi mux

- [ ] **Step 1: Add tenant notification routes**

In `services/main/internal/router/tenant.go`, inside the protected tenant routes group (after the FCM token DELETE route on line 58), add:

```go
			// tenant notifications — unread-count must be before {notification_id} to avoid chi param collision
			r.Get("/v1/tenant-accounts/notifications/unread-count", handlers.NotificationHandler.TenantGetUnreadCount)
			r.Post("/v1/tenant-accounts/notifications/read-all", handlers.NotificationHandler.TenantMarkAllRead)
			r.Get("/v1/tenant-accounts/notifications", handlers.NotificationHandler.TenantListNotifications)
			r.Post("/v1/tenant-accounts/notifications/{notification_id}/read", handlers.NotificationHandler.TenantMarkNotificationRead)
```

- [ ] **Step 2: Add PM (client user) notification routes**

In `services/main/internal/router/client-user.go`, inside the protected client user routes group, add:

```go
			// property manager notifications — static paths before parameterised ones
			r.Get("/v1/notifications/unread-count", handlers.NotificationHandler.PMGetUnreadCount)
			r.Post("/v1/notifications/read-all", handlers.NotificationHandler.PMMarkAllRead)
			r.Get("/v1/notifications", handlers.NotificationHandler.PMListNotifications)
			r.Post("/v1/notifications/{notification_id}/read", handlers.NotificationHandler.PMMarkNotificationRead)
```

- [ ] **Step 3: Verify full build**

```bash
cd services/main && go build ./...
```

Expected: no output

- [ ] **Step 4: Regenerate Swagger docs**

```bash
cd services/main && make generate-docs
```

Expected: `docs/swagger.json` and `docs/swagger.yaml` updated with the new routes

- [ ] **Step 5: Run lint**

```bash
cd services/main && make lint-fix
```

Expected: no errors, auto-fixes applied (if any)

- [ ] **Step 6: Commit**

```bash
git add services/main/internal/router/tenant.go \
        services/main/internal/router/client-user.go \
        services/main/docs/
git commit -m "feat(notification): register tenant and PM notification routes, regenerate Swagger docs"
```

---

## Spec Coverage

| Spec Requirement | Covered By |
|---|---|
| `notifications` table with all spec columns | Task 1 (model) + Task 2 (migration) |
| `notification_deliveries` table | Task 1 + Task 2 |
| `visibility` = IN_APP / HIDDEN | Notification model field + ListInApp filters to IN_APP |
| `is_read` / `read_at` tracking | `MarkAsRead` repo + handler |
| Unread count | `GetUnreadCount` |
| Mark all as read ("Read all") | `MarkAllAsRead` |
| Recipient type scoping | `recipient_id` + `recipient_type` in all queries |
| `organization_id` present | Model field — callers supply it via `CreateNotification` |
| Per-channel `NotificationDelivery` tracking | `CreateDelivery` + `UpdateDelivery` |
| Performance indexes | `idx_notifications_recipient`, `idx_notification_deliveries_notification` |

**Not in this plan (follow-on):**
- Wiring `CreateNotification` into business events (payment, lease, maintenance, etc.)
- Email / SMS / PUSH delivery workers updating delivery status
- Frontend PM portal notification bell and list UI (see `2026-06-30-notification-frontend-pm-portal.md`)
