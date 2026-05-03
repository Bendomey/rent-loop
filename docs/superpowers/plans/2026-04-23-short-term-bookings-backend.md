# Short-Term Bookings — Backend Implementation Plan (Plan 1 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the booking engine, availability system, and all API endpoints (manager + public) to the Go backend.

**Architecture:** New `Booking` and `UnitDateBlock` models sit alongside the existing `Lease` model. `UnitDateBlock` is the single source of truth for availability — created automatically when a booking is confirmed or a lease is activated, and manually for maintenance/personal blocks. All new code follows the existing Handlers → Services → Repository → Models pattern.

**Tech Stack:** Go, chi router, GORM, PostgreSQL, gormigrate, go-nanoid, pq (PostgreSQL arrays)

**Design spec:** `docs/superpowers/specs/2026-04-22-short-term-bookings-design.md`

> **Note:** This is Plan 1 of 3. Plan 2 covers the Property Manager frontend. Plan 3 covers the Website frontend (public booking + tracking pages). This backend plan must be completed before the frontend plans.

---

## File Map

**New files:**
- `services/main/internal/models/booking.go`
- `services/main/internal/models/unit-date-block.go`
- `services/main/internal/repository/booking.go`
- `services/main/internal/repository/unit-date-block.go`
- `services/main/internal/services/booking.go`
- `services/main/internal/services/unit-date-block.go`
- `services/main/internal/transformations/booking.go`
- `services/main/internal/transformations/unit-date-block.go`
- `services/main/internal/handlers/booking.go`
- `services/main/init/migration/jobs/add-property-booking-fields.go`
- `services/main/init/migration/jobs/add-bookings-table.go`
- `services/main/init/migration/jobs/add-unit-date-blocks-table.go`
- `services/main/init/migration/jobs/backfill-unit-date-blocks-from-leases.go`

**Modified files:**
- `services/main/internal/models/property.go` — add `Modes`, `BookingRequiresUpfrontPayment`
- `services/main/internal/transformations/property.go` — expose new fields
- `services/main/internal/services/lease.go` — create `UnitDateBlock` on activation
- `services/main/internal/services/main.go` — wire `BookingService`, `UnitDateBlockService`
- `services/main/internal/repository/main.go` — wire new repositories
- `services/main/internal/handlers/main.go` — wire `BookingHandler`
- `services/main/internal/router/client-user.go` — add manager booking routes
- `services/main/internal/router/tenant-account.go` — add public booking routes
- `services/main/init/migration/main.go` — register models + migration jobs

---

## Task 1: Add Modes and BookingRequiresUpfrontPayment to Property model

**Files:**
- Modify: `services/main/internal/models/property.go`

- [ ] **Step 1: Open property.go and add the two new fields after `Status`**

```go
// After the existing imports, add "github.com/lib/pq" (already imported).
// Add these two fields after the Status field in the Property struct:

Modes                        pq.StringArray `gorm:"type:text[];default:'{}'"`           // "LEASE" | "BOOKING"
BookingRequiresUpfrontPayment bool          `gorm:"not null;default:false"`
```

The full struct after the edit:

```go
type Property struct {
	BaseModelSoftDelete
	ClientID string `gorm:"not null;index;"`
	Client   Client

	Name        string `gorm:"not null;"`
	Slug        string `gorm:"not null;index;"`
	Description *string
	Images      pq.StringArray `gorm:"type:text[]"`
	Tags        pq.StringArray `gorm:"type:text[]"`

	Latitude   float64 `gorm:"not null;"`
	Longitude  float64 `gorm:"not null;"`
	Address    string  `gorm:"not null;"`
	Country    string  `gorm:"not null;"`
	Region     string  `gorm:"not null;"`
	City       string  `gorm:"not null;"`
	GPSAddress *string

	Type   string `gorm:"not null;index;"` // SINGLE | MULTI
	Status string `gorm:"not null;index;"` // ACTIVE | MAINTENANCE | INACTIVE

	Modes                        pq.StringArray `gorm:"type:text[];default:'{}'"`
	BookingRequiresUpfrontPayment bool          `gorm:"not null;default:false"`

	CreatedByID string `gorm:"not null;"`
	CreatedBy   ClientUser

	Units []Unit
}
```

- [ ] **Step 2: Run `make lint-fix` from `services/main/` to ensure formatting**

```bash
cd services/main && make lint-fix
```

Expected: exits 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add services/main/internal/models/property.go
git commit -m "feat(models): add Modes and BookingRequiresUpfrontPayment to Property"
```

---

## Task 2: Create the Booking model

**Files:**
- Create: `services/main/internal/models/booking.go`

- [ ] **Step 1: Create the file**

```go
package models

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/getsentry/raven-go"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Booking statuses:
// PENDING    — created, awaiting manager confirmation
// CONFIRMED  — manager confirmed; UnitDateBlock created; CheckInCode generated
// CHECKED_IN — guest has checked in
// COMPLETED  — stay is over
// CANCELLED  — cancelled by manager at any point before completion

// Booking sources:
// MANAGER    — created by a client user on behalf of a guest
// GUEST_LINK — created by a guest through the public booking link

type Booking struct {
	BaseModelSoftDelete
	Code         string `gorm:"not null;uniqueIndex;"` // auto-generated e.g. "2604ABCXYZ1"
	TrackingCode string `gorm:"not null;uniqueIndex;"` // random nanoid, used in public tracking URL
	CheckInCode  string `gorm:""`                      // 5-digit numeric, generated on CONFIRMED

	UnitID     string `gorm:"not null;index;"`
	Unit       Unit
	PropertyID string `gorm:"not null;index;"`
	Property   Property
	TenantID   string `gorm:"not null;"`
	Tenant     Tenant

	CheckInDate  time.Time `gorm:"not null;"`
	CheckOutDate time.Time `gorm:"not null;"`

	Rate     int64  `gorm:"not null;"` // unit.RentFee × frequency count, in smallest currency unit
	Currency string `gorm:"not null;"`

	Status             string `gorm:"not null;default:'PENDING';index;"` // PENDING | CONFIRMED | CHECKED_IN | COMPLETED | CANCELLED
	CancellationReason string `gorm:""`
	Notes              string `gorm:""`

	BookingSource         string  `gorm:"not null;"` // MANAGER | GUEST_LINK
	RequiresUpfrontPayment bool   `gorm:"not null;default:false"`
	CreatedByClientUserID *string `gorm:"index;"`
	CreatedByClientUser   *ClientUser

	InvoiceID *string `gorm:"index;"`
	Invoice   *Invoice

	Meta datatypes.JSON `gorm:"type:jsonb;"`
}

func (b *Booking) BeforeCreate(tx *gorm.DB) error {
	// Generate booking code (same pattern as Lease)
	uniqueCode, genErr := lib.GenerateCode(tx, &Booking{})
	if genErr != nil {
		raven.CaptureError(genErr, map[string]string{
			"function": "BeforeCreateBookingHook",
			"action":   "Generating a unique code",
		})
		return genErr
	}
	b.Code = *uniqueCode

	// Generate a unique tracking code using nanoid (16 chars, alphanumeric)
	trackingCode, trackingErr := lib.GenerateTrackingCode(tx, &Booking{})
	if trackingErr != nil {
		raven.CaptureError(trackingErr, map[string]string{
			"function": "BeforeCreateBookingHook",
			"action":   "Generating a tracking code",
		})
		return trackingErr
	}
	b.TrackingCode = *trackingCode

	return nil
}
```

- [ ] **Step 2: Add `GenerateTrackingCode` to `services/main/internal/lib/code-generator.go`**

```go
// Add after the existing GenerateCode function:

func GenerateTrackingCode(db *gorm.DB, model any) (*string, error) {
	code, err := gonanoid.Generate("abcdefghijklmnopqrstuvwxyz0123456789", 16)
	if err != nil {
		return nil, err
	}

	codeExistsCount := int64(0)
	db.Model(model).Where("tracking_code = ?", code).Count(&codeExistsCount)
	if codeExistsCount > 0 {
		return GenerateTrackingCode(db, model)
	}

	return &code, nil
}

func GenerateCheckInCode() (string, error) {
	digits := "0123456789"
	code, err := gonanoid.Generate(digits, 5)
	if err != nil {
		return "", err
	}
	return code, nil
}
```

- [ ] **Step 3: Run `make lint-fix`**

```bash
cd services/main && make lint-fix
```

- [ ] **Step 4: Commit**

```bash
git add services/main/internal/models/booking.go \
        services/main/internal/lib/code-generator.go
git commit -m "feat(models): add Booking model with code and tracking code generation"
```

---

## Task 3: Create the UnitDateBlock model

**Files:**
- Create: `services/main/internal/models/unit-date-block.go`

- [ ] **Step 1: Create the file**

```go
package models

import "time"

// UnitDateBlock tracks all blocked date ranges per unit.
// BlockTypes:
//   BOOKING     — auto-created when a booking is CONFIRMED
//   LEASE       — auto-created when a lease is ACTIVATED
//   MAINTENANCE — manually created by a manager
//   PERSONAL    — manually created by a manager
//   OTHER       — manually created by a manager

type UnitDateBlock struct {
	BaseModelSoftDelete

	UnitID string `gorm:"not null;index;"`
	Unit   Unit

	StartDate time.Time `gorm:"not null;type:date;"`
	EndDate   time.Time `gorm:"not null;type:date;"`

	BlockType string `gorm:"not null;"` // BOOKING | LEASE | MAINTENANCE | PERSONAL | OTHER

	BookingID *string `gorm:"index;"`
	Booking   *Booking

	LeaseID *string `gorm:"index;"`
	Lease   *Lease

	Reason string `gorm:""`

	CreatedByClientUserID *string `gorm:"index;"`
	CreatedByClientUser   *ClientUser
}
```

- [ ] **Step 2: Run `make lint-fix`**

```bash
cd services/main && make lint-fix
```

- [ ] **Step 3: Commit**

```bash
git add services/main/internal/models/unit-date-block.go
git commit -m "feat(models): add UnitDateBlock model"
```

---

## Task 4: Register new models in AutoMigrate

**Files:**
- Modify: `services/main/init/migration/main.go`

- [ ] **Step 1: Add `Booking` and `UnitDateBlock` to the `updateMigration` function's `AutoMigrate` call**

In `updateMigration`, after `&models.Lease{},` add:

```go
&models.Booking{},
&models.UnitDateBlock{},
```

- [ ] **Step 2: Run `make lint-fix`**

```bash
cd services/main && make lint-fix
```

- [ ] **Step 3: Commit**

```bash
git add services/main/init/migration/main.go
git commit -m "feat(migrations): register Booking and UnitDateBlock in AutoMigrate"
```

---

## Task 5: Write migration jobs for the new columns and tables

**Files:**
- Create: `services/main/init/migration/jobs/add-property-booking-fields.go`
- Create: `services/main/init/migration/jobs/add-bookings-table.go`
- Create: `services/main/init/migration/jobs/add-unit-date-blocks-table.go`
- Create: `services/main/init/migration/jobs/backfill-unit-date-blocks-from-leases.go`
- Modify: `services/main/init/migration/main.go`

- [ ] **Step 1: Create `add-property-booking-fields.go`**

```go
package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddPropertyBookingFields() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604230001_ADD_PROPERTY_BOOKING_FIELDS",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS modes text[] NOT NULL DEFAULT '{}'`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS booking_requires_upfront_payment boolean NOT NULL DEFAULT false`).Error; err != nil {
				return err
			}
			// Backfill all existing properties to LEASE mode
			return db.Exec(`UPDATE properties SET modes = '{"LEASE"}' WHERE deleted_at IS NULL AND (modes IS NULL OR array_length(modes, 1) IS NULL)`).Error
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(`ALTER TABLE properties DROP COLUMN IF EXISTS modes`).Error; err != nil {
				return err
			}
			return db.Exec(`ALTER TABLE properties DROP COLUMN IF EXISTS booking_requires_upfront_payment`).Error
		},
	}
}
```

- [ ] **Step 2: Create `add-bookings-table.go`**

```go
package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddBookingsTable() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604230002_ADD_BOOKINGS_TABLE",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`
				CREATE TABLE IF NOT EXISTS bookings (
					id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
					created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
					deleted_at TIMESTAMPTZ,
					code VARCHAR NOT NULL UNIQUE,
					tracking_code VARCHAR NOT NULL UNIQUE,
					check_in_code VARCHAR NOT NULL DEFAULT '',
					unit_id UUID NOT NULL REFERENCES units(id),
					property_id UUID NOT NULL REFERENCES properties(id),
					tenant_id UUID NOT NULL REFERENCES tenants(id),
					check_in_date DATE NOT NULL,
					check_out_date DATE NOT NULL,
					rate BIGINT NOT NULL,
					currency VARCHAR NOT NULL,
					status VARCHAR NOT NULL DEFAULT 'PENDING',
					cancellation_reason TEXT NOT NULL DEFAULT '',
					notes TEXT NOT NULL DEFAULT '',
					booking_source VARCHAR NOT NULL,
					requires_upfront_payment BOOLEAN NOT NULL DEFAULT false,
					created_by_client_user_id UUID REFERENCES client_users(id),
					invoice_id UUID REFERENCES invoices(id),
					meta JSONB
				)
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`DROP TABLE IF EXISTS bookings`).Error
		},
	}
}
```

- [ ] **Step 3: Create `add-unit-date-blocks-table.go`**

```go
package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddUnitDateBlocksTable() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604230003_ADD_UNIT_DATE_BLOCKS_TABLE",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`
				CREATE TABLE IF NOT EXISTS unit_date_blocks (
					id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
					created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
					deleted_at TIMESTAMPTZ,
					unit_id UUID NOT NULL REFERENCES units(id),
					start_date DATE NOT NULL,
					end_date DATE NOT NULL,
					block_type VARCHAR NOT NULL,
					booking_id UUID REFERENCES bookings(id),
					lease_id UUID REFERENCES leases(id),
					reason TEXT NOT NULL DEFAULT '',
					created_by_client_user_id UUID REFERENCES client_users(id)
				)
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`DROP TABLE IF EXISTS unit_date_blocks`).Error
		},
	}
}
```

- [ ] **Step 4: Create `backfill-unit-date-blocks-from-leases.go`**

```go
package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// BackfillUnitDateBlocksFromLeases creates UnitDateBlock rows for all
// active and pending leases so the availability calendar starts accurate.
// EndDate is calculated from MoveInDate + (StayDuration × StayDurationFrequency).
// Open-ended leases (no duration) get EndDate = '2099-01-01'.
func BackfillUnitDateBlocksFromLeases() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604230004_BACKFILL_UNIT_DATE_BLOCKS_FROM_LEASES",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`
				INSERT INTO unit_date_blocks (
					unit_id, start_date, end_date, block_type, lease_id, reason
				)
				SELECT
					l.unit_id,
					l.move_in_date::date AS start_date,
					CASE
						WHEN l.stay_duration IS NULL OR l.stay_duration = 0 OR l.stay_duration_frequency = ''
							THEN '2099-01-01'::date
						WHEN lower(l.stay_duration_frequency) IN ('hours', 'hour')
							THEN (l.move_in_date + (l.stay_duration || ' hours')::interval)::date
						WHEN lower(l.stay_duration_frequency) IN ('days', 'day')
							THEN (l.move_in_date + (l.stay_duration || ' days')::interval)::date
						WHEN lower(l.stay_duration_frequency) IN ('months', 'month')
							THEN (l.move_in_date + (l.stay_duration || ' months')::interval)::date
						ELSE '2099-01-01'::date
					END AS end_date,
					'LEASE' AS block_type,
					l.id AS lease_id,
					'Active lease (backfill)' AS reason
				FROM leases l
				WHERE l.deleted_at IS NULL
				  AND l.status IN ('Lease.Status.Pending', 'Lease.Status.Active')
				  AND l.move_in_date IS NOT NULL
				ON CONFLICT DO NOTHING
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`DELETE FROM unit_date_blocks WHERE block_type = 'LEASE' AND reason = 'Active lease (backfill)'`).Error
		},
	}
}
```

- [ ] **Step 5: Register all four migration jobs in `init/migration/main.go`**

Append after the last existing job (`jobs.AddTenantApplicationPropertyId()`):

```go
jobs.AddPropertyBookingFields(),
jobs.AddBookingsTable(),
jobs.AddUnitDateBlocksTable(),
jobs.BackfillUnitDateBlocksFromLeases(),
```

- [ ] **Step 6: Run `make lint-fix`**

```bash
cd services/main && make lint-fix
```

- [ ] **Step 7: Apply migrations to dev DB**

```bash
cd services/main && make update-db
```

Expected: no error output. Check DB to verify tables exist:
```sql
\dt bookings
\dt unit_date_blocks
\d properties  -- should show modes and booking_requires_upfront_payment columns
```

- [ ] **Step 8: Commit**

```bash
git add services/main/init/migration/jobs/add-property-booking-fields.go \
        services/main/init/migration/jobs/add-bookings-table.go \
        services/main/init/migration/jobs/add-unit-date-blocks-table.go \
        services/main/init/migration/jobs/backfill-unit-date-blocks-from-leases.go \
        services/main/init/migration/main.go
git commit -m "feat(migrations): add bookings, unit_date_blocks tables; backfill from leases"
```

---

## Task 6: Create BookingRepository

**Files:**
- Create: `services/main/internal/repository/booking.go`
- Modify: `services/main/internal/repository/main.go`

- [ ] **Step 1: Create `repository/booking.go`**

```go
package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type BookingRepository interface {
	Create(ctx context.Context, booking *models.Booking) error
	Update(ctx context.Context, booking *models.Booking) error
	GetByID(ctx context.Context, id string, populate []string) (*models.Booking, error)
	GetByTrackingCode(ctx context.Context, trackingCode string, populate []string) (*models.Booking, error)
	List(ctx context.Context, filter ListBookingsFilter) (*[]models.Booking, error)
	Count(ctx context.Context, filter ListBookingsFilter) (int64, error)
	HasOverlappingBlock(ctx context.Context, unitID string, startDate, endDate interface{}) (bool, error)
}

type bookingRepository struct {
	DB *gorm.DB
}

func NewBookingRepository(db *gorm.DB) BookingRepository {
	return &bookingRepository{DB: db}
}

type ListBookingsFilter struct {
	PropertyID *string
	UnitID     *string
	Status     *string
	lib.FilterQuery
}

func (r *bookingRepository) Create(ctx context.Context, booking *models.Booking) error {
	db := lib.ResolveDB(ctx, r.DB)
	return db.WithContext(ctx).Create(booking).Error
}

func (r *bookingRepository) Update(ctx context.Context, booking *models.Booking) error {
	db := lib.ResolveDB(ctx, r.DB)
	return db.WithContext(ctx).Save(booking).Error
}

func (r *bookingRepository) GetByID(ctx context.Context, id string, populate []string) (*models.Booking, error) {
	var booking models.Booking
	db := r.DB.WithContext(ctx).Where("id = ?", id)
	for _, field := range populate {
		db = db.Preload(field)
	}
	if err := db.First(&booking).Error; err != nil {
		return nil, err
	}
	return &booking, nil
}

func (r *bookingRepository) GetByTrackingCode(ctx context.Context, trackingCode string, populate []string) (*models.Booking, error) {
	var booking models.Booking
	db := r.DB.WithContext(ctx).Where("tracking_code = ?", trackingCode)
	for _, field := range populate {
		db = db.Preload(field)
	}
	if err := db.First(&booking).Error; err != nil {
		return nil, err
	}
	return &booking, nil
}

func (r *bookingRepository) List(ctx context.Context, filter ListBookingsFilter) (*[]models.Booking, error) {
	var bookings []models.Booking
	db := r.DB.WithContext(ctx).Where("bookings.deleted_at IS NULL")

	if filter.PropertyID != nil {
		db = db.Where("property_id = ?", *filter.PropertyID)
	}
	if filter.UnitID != nil {
		db = db.Where("unit_id = ?", *filter.UnitID)
	}
	if filter.Status != nil {
		db = db.Where("status = ?", *filter.Status)
	}

	offset := (filter.Page - 1) * filter.PageSize
	db = db.Order(filter.OrderBy + " " + filter.Order).Offset(offset).Limit(filter.PageSize)

	if filter.Populate != nil {
		for _, field := range *filter.Populate {
			db = db.Preload(field)
		}
	}

	if err := db.Find(&bookings).Error; err != nil {
		return nil, err
	}
	return &bookings, nil
}

func (r *bookingRepository) Count(ctx context.Context, filter ListBookingsFilter) (int64, error) {
	var count int64
	db := r.DB.WithContext(ctx).Model(&models.Booking{}).Where("deleted_at IS NULL")
	if filter.PropertyID != nil {
		db = db.Where("property_id = ?", *filter.PropertyID)
	}
	if filter.UnitID != nil {
		db = db.Where("unit_id = ?", *filter.UnitID)
	}
	if filter.Status != nil {
		db = db.Where("status = ?", *filter.Status)
	}
	if err := db.Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// HasOverlappingBlock checks if any UnitDateBlock (or confirmed booking) overlaps
// with [startDate, checkOutDate) for the given unit.
func (r *bookingRepository) HasOverlappingBlock(ctx context.Context, unitID string, startDate, endDate interface{}) (bool, error) {
	var count int64
	err := r.DB.WithContext(ctx).
		Model(&models.UnitDateBlock{}).
		Where("unit_id = ? AND deleted_at IS NULL AND start_date < ? AND end_date > ?", unitID, endDate, startDate).
		Count(&count).Error
	return count > 0, err
}
```

- [ ] **Step 2: Add `BookingRepository` to `repository/main.go`**

In the `Repository` struct, add:
```go
BookingRepository BookingRepository
```

In `NewRepository`, add:
```go
bookingRepository := NewBookingRepository(db)
```

And in the return value:
```go
BookingRepository: bookingRepository,
```

- [ ] **Step 3: Run `make lint-fix`**

```bash
cd services/main && make lint-fix
```

- [ ] **Step 4: Commit**

```bash
git add services/main/internal/repository/booking.go \
        services/main/internal/repository/main.go
git commit -m "feat(repository): add BookingRepository"
```

---

## Task 7: Create UnitDateBlockRepository

**Files:**
- Create: `services/main/internal/repository/unit-date-block.go`
- Modify: `services/main/internal/repository/main.go`

- [ ] **Step 1: Create `repository/unit-date-block.go`**

```go
package repository

import (
	"context"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type UnitDateBlockRepository interface {
	Create(ctx context.Context, block *models.UnitDateBlock) error
	Delete(ctx context.Context, id string) error
	ListByUnit(ctx context.Context, unitID string, from, to time.Time) (*[]models.UnitDateBlock, error)
	GetByID(ctx context.Context, id string) (*models.UnitDateBlock, error)
}

type unitDateBlockRepository struct {
	DB *gorm.DB
}

func NewUnitDateBlockRepository(db *gorm.DB) UnitDateBlockRepository {
	return &unitDateBlockRepository{DB: db}
}

func (r *unitDateBlockRepository) Create(ctx context.Context, block *models.UnitDateBlock) error {
	db := lib.ResolveDB(ctx, r.DB)
	return db.WithContext(ctx).Create(block).Error
}

func (r *unitDateBlockRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Where("id = ?", id).Delete(&models.UnitDateBlock{}).Error
}

func (r *unitDateBlockRepository) GetByID(ctx context.Context, id string) (*models.UnitDateBlock, error) {
	var block models.UnitDateBlock
	if err := r.DB.WithContext(ctx).Where("id = ?", id).First(&block).Error; err != nil {
		return nil, err
	}
	return &block, nil
}

func (r *unitDateBlockRepository) ListByUnit(ctx context.Context, unitID string, from, to time.Time) (*[]models.UnitDateBlock, error) {
	var blocks []models.UnitDateBlock
	err := r.DB.WithContext(ctx).
		Where("unit_id = ? AND deleted_at IS NULL AND start_date < ? AND end_date > ?", unitID, to, from).
		Find(&blocks).Error
	return &blocks, err
}
```

- [ ] **Step 2: Add `UnitDateBlockRepository` to `repository/main.go`**

In the `Repository` struct:
```go
UnitDateBlockRepository UnitDateBlockRepository
```

In `NewRepository`:
```go
unitDateBlockRepository := NewUnitDateBlockRepository(db)
```

Return value:
```go
UnitDateBlockRepository: unitDateBlockRepository,
```

- [ ] **Step 3: Run `make lint-fix`**

```bash
cd services/main && make lint-fix
```

- [ ] **Step 4: Commit**

```bash
git add services/main/internal/repository/unit-date-block.go \
        services/main/internal/repository/main.go
git commit -m "feat(repository): add UnitDateBlockRepository"
```

---

## Task 8: Create Booking and UnitDateBlock Transformations

**Files:**
- Create: `services/main/internal/transformations/booking.go`
- Create: `services/main/internal/transformations/unit-date-block.go`

- [ ] **Step 1: Create `transformations/booking.go`**

```go
package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

type OutputBooking struct {
	ID           string `json:"id"`
	Code         string `json:"code"`
	TrackingCode string `json:"tracking_code"`
	CheckInCode  string `json:"check_in_code,omitempty"` // only populated for confirmed+ bookings

	UnitID     string          `json:"unit_id"`
	Unit       *AdminOutputUnit `json:"unit,omitempty"`
	PropertyID string          `json:"property_id"`
	TenantID   string          `json:"tenant_id"`
	Tenant     *OutputAdminTenant `json:"tenant,omitempty"`

	CheckInDate  time.Time `json:"check_in_date"`
	CheckOutDate time.Time `json:"check_out_date"`

	Rate     int64  `json:"rate"`
	Currency string `json:"currency"`

	Status             string `json:"status"`
	CancellationReason string `json:"cancellation_reason,omitempty"`
	Notes              string `json:"notes,omitempty"`

	BookingSource          string  `json:"booking_source"`
	RequiresUpfrontPayment bool    `json:"requires_upfront_payment"`
	CreatedByClientUserID  *string `json:"created_by_client_user_id,omitempty"`

	InvoiceID *string         `json:"invoice_id,omitempty"`
	Invoice   *OutputInvoice  `json:"invoice,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// OutputPublicBooking is a reduced view for the public tracking page.
// It omits internal IDs and only shows the check-in code when the booking is confirmed.
type OutputPublicBooking struct {
	Code         string    `json:"code"`
	TrackingCode string    `json:"tracking_code"`
	CheckInCode  string    `json:"check_in_code,omitempty"`
	CheckInDate  time.Time `json:"check_in_date"`
	CheckOutDate time.Time `json:"check_out_date"`
	Rate         int64     `json:"rate"`
	Currency     string    `json:"currency"`
	Status       string    `json:"status"`
	UnitName     string    `json:"unit_name"`
	PropertyName string    `json:"property_name"`
	CreatedAt    time.Time `json:"created_at"`
}

func TransformBooking(booking *models.Booking) OutputBooking {
	out := OutputBooking{
		ID:                     booking.ID.String(),
		Code:                   booking.Code,
		TrackingCode:           booking.TrackingCode,
		UnitID:                 booking.UnitID,
		PropertyID:             booking.PropertyID,
		TenantID:               booking.TenantID,
		CheckInDate:            booking.CheckInDate,
		CheckOutDate:           booking.CheckOutDate,
		Rate:                   booking.Rate,
		Currency:               booking.Currency,
		Status:                 booking.Status,
		CancellationReason:     booking.CancellationReason,
		Notes:                  booking.Notes,
		BookingSource:          booking.BookingSource,
		RequiresUpfrontPayment: booking.RequiresUpfrontPayment,
		CreatedByClientUserID:  booking.CreatedByClientUserID,
		InvoiceID:              booking.InvoiceID,
		CreatedAt:              booking.CreatedAt,
		UpdatedAt:              booking.UpdatedAt,
	}

	// Only expose check-in code once confirmed
	if booking.Status == "CONFIRMED" || booking.Status == "CHECKED_IN" || booking.Status == "COMPLETED" {
		out.CheckInCode = booking.CheckInCode
	}

	if booking.Unit.ID.String() != "00000000-0000-0000-0000-000000000000" {
		unit := TransformUnit(booking.Unit)
		out.Unit = &unit
	}
	if booking.Tenant.ID.String() != "00000000-0000-0000-0000-000000000000" {
		tenant := TransformTenant(booking.Tenant)
		out.Tenant = &tenant
	}

	return out
}

func TransformPublicBooking(booking *models.Booking) OutputPublicBooking {
	out := OutputPublicBooking{
		Code:         booking.Code,
		TrackingCode: booking.TrackingCode,
		CheckInDate:  booking.CheckInDate,
		CheckOutDate: booking.CheckOutDate,
		Rate:         booking.Rate,
		Currency:     booking.Currency,
		Status:       booking.Status,
		CreatedAt:    booking.CreatedAt,
	}
	if booking.Status == "CONFIRMED" || booking.Status == "CHECKED_IN" || booking.Status == "COMPLETED" {
		out.CheckInCode = booking.CheckInCode
	}
	if booking.Unit.ID.String() != "00000000-0000-0000-0000-000000000000" {
		out.UnitName = booking.Unit.Name
	}
	if booking.Property.ID.String() != "00000000-0000-0000-0000-000000000000" {
		out.PropertyName = booking.Property.Name
	}
	return out
}
```

- [ ] **Step 2: Check that `TransformUnit` and `TransformTenant` exist in the transformations package**

```bash
grep -l "func TransformUnit\|func TransformTenant" /Users/domeybenjamin/Kodes/personal/rent-loop/services/main/internal/transformations/
```

If they don't exist under those exact names, find the correct function names and update the calls in `TransformBooking` accordingly.

- [ ] **Step 3: Create `transformations/unit-date-block.go`**

```go
package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

type OutputUnitDateBlock struct {
	ID        string    `json:"id"`
	UnitID    string    `json:"unit_id"`
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
	BlockType string    `json:"block_type"`
	BookingID *string   `json:"booking_id,omitempty"`
	LeaseID   *string   `json:"lease_id,omitempty"`
	Reason    string    `json:"reason,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

func TransformUnitDateBlock(block *models.UnitDateBlock) OutputUnitDateBlock {
	return OutputUnitDateBlock{
		ID:        block.ID.String(),
		UnitID:    block.UnitID,
		StartDate: block.StartDate,
		EndDate:   block.EndDate,
		BlockType: block.BlockType,
		BookingID: block.BookingID,
		LeaseID:   block.LeaseID,
		Reason:    block.Reason,
		CreatedAt: block.CreatedAt,
	}
}
```

- [ ] **Step 4: Run `make lint-fix`**

```bash
cd services/main && make lint-fix
```

- [ ] **Step 5: Commit**

```bash
git add services/main/internal/transformations/booking.go \
        services/main/internal/transformations/unit-date-block.go
git commit -m "feat(transformations): add OutputBooking and OutputUnitDateBlock DTOs"
```

---

## Task 9: Create UnitDateBlockService

**Files:**
- Create: `services/main/internal/services/unit-date-block.go`

- [ ] **Step 1: Create the file**

```go
package services

import (
	"context"
	"errors"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type UnitDateBlockService interface {
	GetAvailability(ctx context.Context, unitID string, from, to time.Time) ([]models.UnitDateBlock, error)
	CreateManualBlock(ctx context.Context, input CreateManualBlockInput) (*models.UnitDateBlock, error)
	CreateSystemBlock(ctx context.Context, input CreateSystemBlockInput) (*models.UnitDateBlock, error)
	DeleteBlock(ctx context.Context, id string, requestingClientUserID string) error
}

type unitDateBlockService struct {
	appCtx pkg.AppContext
	repo   repository.UnitDateBlockRepository
}

func NewUnitDateBlockService(appCtx pkg.AppContext, repo repository.UnitDateBlockRepository) UnitDateBlockService {
	return &unitDateBlockService{appCtx: appCtx, repo: repo}
}

type CreateManualBlockInput struct {
	UnitID                string
	StartDate             time.Time
	EndDate               time.Time
	BlockType             string // MAINTENANCE | PERSONAL | OTHER
	Reason                string
	CreatedByClientUserID string
}

type CreateSystemBlockInput struct {
	UnitID    string
	StartDate time.Time
	EndDate   time.Time
	BlockType string // BOOKING | LEASE
	BookingID *string
	LeaseID   *string
	Reason    string
}

func (s *unitDateBlockService) GetAvailability(ctx context.Context, unitID string, from, to time.Time) ([]models.UnitDateBlock, error) {
	blocks, err := s.repo.ListByUnit(ctx, unitID, from, to)
	if err != nil {
		return nil, err
	}
	return *blocks, nil
}

func (s *unitDateBlockService) CreateManualBlock(ctx context.Context, input CreateManualBlockInput) (*models.UnitDateBlock, error) {
	if input.EndDate.Before(input.StartDate) || input.EndDate.Equal(input.StartDate) {
		return nil, errors.New("end_date must be after start_date")
	}

	block := &models.UnitDateBlock{
		UnitID:                input.UnitID,
		StartDate:             input.StartDate,
		EndDate:               input.EndDate,
		BlockType:             input.BlockType,
		Reason:                input.Reason,
		CreatedByClientUserID: &input.CreatedByClientUserID,
	}

	if err := s.repo.Create(ctx, block); err != nil {
		return nil, err
	}
	return block, nil
}

func (s *unitDateBlockService) CreateSystemBlock(ctx context.Context, input CreateSystemBlockInput) (*models.UnitDateBlock, error) {
	block := &models.UnitDateBlock{
		UnitID:    input.UnitID,
		StartDate: input.StartDate,
		EndDate:   input.EndDate,
		BlockType: input.BlockType,
		BookingID: input.BookingID,
		LeaseID:   input.LeaseID,
		Reason:    input.Reason,
	}
	if err := s.repo.Create(ctx, block); err != nil {
		return nil, err
	}
	return block, nil
}

func (s *unitDateBlockService) DeleteBlock(ctx context.Context, id string, requestingClientUserID string) error {
	block, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return errors.New("block not found")
	}
	// Prevent deleting system-created BOOKING and LEASE blocks directly —
	// those are cleaned up when the booking/lease is cancelled.
	if block.BlockType == "BOOKING" || block.BlockType == "LEASE" {
		return errors.New("cannot delete system-managed blocks directly; cancel the booking or lease instead")
	}
	return s.repo.Delete(ctx, id)
}
```

- [ ] **Step 2: Run `make lint-fix`**

```bash
cd services/main && make lint-fix
```

- [ ] **Step 3: Commit**

```bash
git add services/main/internal/services/unit-date-block.go
git commit -m "feat(services): add UnitDateBlockService"
```

---

## Task 10: Create BookingService

**Files:**
- Create: `services/main/internal/services/booking.go`

- [ ] **Step 1: Create the file**

```go
package services

import (
	"context"
	"errors"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type BookingService interface {
	CreateBooking(ctx context.Context, input CreateBookingInput) (*models.Booking, error)
	GetBooking(ctx context.Context, id string, populate []string) (*models.Booking, error)
	ListBookings(ctx context.Context, filter repository.ListBookingsFilter) ([]models.Booking, error)
	CountBookings(ctx context.Context, filter repository.ListBookingsFilter) (int64, error)
	ConfirmBooking(ctx context.Context, input ConfirmBookingInput) (*models.Booking, error)
	CheckInBooking(ctx context.Context, id string, clientUserID string) (*models.Booking, error)
	CompleteBooking(ctx context.Context, id string, clientUserID string) (*models.Booking, error)
	CancelBooking(ctx context.Context, input CancelBookingInput) (*models.Booking, error)
	GetBookingByTrackingCode(ctx context.Context, trackingCode string) (*models.Booking, error)
}

type bookingService struct {
	appCtx               pkg.AppContext
	repo                 repository.BookingRepository
	unitDateBlockService UnitDateBlockService
	tenantService        TenantService
	invoiceService       InvoiceService
}

type BookingServiceDeps struct {
	AppCtx               pkg.AppContext
	Repo                 repository.BookingRepository
	UnitDateBlockService UnitDateBlockService
	TenantService        TenantService
	InvoiceService       InvoiceService
}

func NewBookingService(deps BookingServiceDeps) BookingService {
	return &bookingService{
		appCtx:               deps.AppCtx,
		repo:                 deps.Repo,
		unitDateBlockService: deps.UnitDateBlockService,
		tenantService:        deps.TenantService,
		invoiceService:       deps.InvoiceService,
	}
}

type CreateBookingInput struct {
	UnitID                 string
	PropertyID             string
	CheckInDate            time.Time
	CheckOutDate           time.Time
	Rate                   int64
	Currency               string
	BookingSource          string // MANAGER | GUEST_LINK
	RequiresUpfrontPayment bool
	CreatedByClientUserID  *string
	Notes                  string
	// Guest info — used to find or create a Tenant record
	GuestFirstName string
	GuestLastName  string
	GuestPhone     string
	GuestEmail     string
	GuestIDNumber  string
}

type ConfirmBookingInput struct {
	BookingID    string
	ClientUserID string
}

type CancelBookingInput struct {
	BookingID          string
	ClientUserID       string
	CancellationReason string
}

func (s *bookingService) CreateBooking(ctx context.Context, input CreateBookingInput) (*models.Booking, error) {
	if !input.CheckOutDate.After(input.CheckInDate) {
		return nil, errors.New("check_out_date must be after check_in_date")
	}

	// Find or create tenant (guest — subset of fields)
	tenant, err := s.tenantService.FindOrCreateLightTenant(ctx, FindOrCreateLightTenantInput{
		FirstName: input.GuestFirstName,
		LastName:  input.GuestLastName,
		Phone:     input.GuestPhone,
		Email:     input.GuestEmail,
		IDNumber:  input.GuestIDNumber,
	})
	if err != nil {
		return nil, err
	}

	booking := &models.Booking{
		UnitID:                 input.UnitID,
		PropertyID:             input.PropertyID,
		TenantID:               tenant.ID.String(),
		CheckInDate:            input.CheckInDate,
		CheckOutDate:           input.CheckOutDate,
		Rate:                   input.Rate,
		Currency:               input.Currency,
		Status:                 "PENDING",
		BookingSource:          input.BookingSource,
		RequiresUpfrontPayment: input.RequiresUpfrontPayment,
		CreatedByClientUserID:  input.CreatedByClientUserID,
		Notes:                  input.Notes,
	}

	if err := s.repo.Create(ctx, booking); err != nil {
		return nil, err
	}

	// Send tracking link to guest async (fire-and-forget)
	go s.sendBookingCreatedNotification(booking, tenant)

	return booking, nil
}

func (s *bookingService) ConfirmBooking(ctx context.Context, input ConfirmBookingInput) (*models.Booking, error) {
	booking, err := s.repo.GetByID(ctx, input.BookingID, []string{"Tenant", "Unit", "Property"})
	if err != nil {
		return nil, errors.New("booking not found")
	}
	if booking.Status != "PENDING" {
		return nil, errors.New("only PENDING bookings can be confirmed")
	}

	// Double-booking check
	hasOverlap, err := s.repo.HasOverlappingBlock(ctx, booking.UnitID, booking.CheckInDate, booking.CheckOutDate)
	if err != nil {
		return nil, err
	}
	if hasOverlap {
		return nil, errors.New("dates are no longer available: overlapping block exists")
	}

	// Generate 5-digit check-in code
	checkInCode, codeErr := lib.GenerateCheckInCode()
	if codeErr != nil {
		return nil, codeErr
	}

	booking.Status = "CONFIRMED"
	booking.CheckInCode = checkInCode

	if err := s.repo.Update(ctx, booking); err != nil {
		return nil, err
	}

	// Create UnitDateBlock to lock the dates
	bookingID := booking.ID.String()
	go s.unitDateBlockService.CreateSystemBlock(context.Background(), CreateSystemBlockInput{
		UnitID:    booking.UnitID,
		StartDate: booking.CheckInDate,
		EndDate:   booking.CheckOutDate,
		BlockType: "BOOKING",
		BookingID: &bookingID,
		Reason:    "Confirmed booking",
	})

	// Notify guest async
	go s.sendBookingConfirmedNotification(booking)

	return booking, nil
}

func (s *bookingService) CheckInBooking(ctx context.Context, id string, clientUserID string) (*models.Booking, error) {
	booking, err := s.repo.GetByID(ctx, id, nil)
	if err != nil {
		return nil, errors.New("booking not found")
	}
	if booking.Status != "CONFIRMED" {
		return nil, errors.New("only CONFIRMED bookings can be checked in")
	}
	booking.Status = "CHECKED_IN"
	if err := s.repo.Update(ctx, booking); err != nil {
		return nil, err
	}
	return booking, nil
}

func (s *bookingService) CompleteBooking(ctx context.Context, id string, clientUserID string) (*models.Booking, error) {
	booking, err := s.repo.GetByID(ctx, id, nil)
	if err != nil {
		return nil, errors.New("booking not found")
	}
	if booking.Status != "CHECKED_IN" {
		return nil, errors.New("only CHECKED_IN bookings can be completed")
	}
	booking.Status = "COMPLETED"
	if err := s.repo.Update(ctx, booking); err != nil {
		return nil, err
	}
	return booking, nil
}

func (s *bookingService) CancelBooking(ctx context.Context, input CancelBookingInput) (*models.Booking, error) {
	booking, err := s.repo.GetByID(ctx, input.BookingID, []string{"Tenant"})
	if err != nil {
		return nil, errors.New("booking not found")
	}
	if booking.Status == "COMPLETED" {
		return nil, errors.New("completed bookings cannot be cancelled")
	}

	booking.Status = "CANCELLED"
	booking.CancellationReason = input.CancellationReason
	if err := s.repo.Update(ctx, booking); err != nil {
		return nil, err
	}

	// Remove the UnitDateBlock if it existed (booking was confirmed)
	// Done async since it's not critical path
	go s.removeBookingDateBlock(context.Background(), booking.ID.String())

	go s.sendBookingCancelledNotification(booking)

	return booking, nil
}

func (s *bookingService) GetBooking(ctx context.Context, id string, populate []string) (*models.Booking, error) {
	return s.repo.GetByID(ctx, id, populate)
}

func (s *bookingService) ListBookings(ctx context.Context, filter repository.ListBookingsFilter) ([]models.Booking, error) {
	bookings, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, err
	}
	return *bookings, nil
}

func (s *bookingService) CountBookings(ctx context.Context, filter repository.ListBookingsFilter) (int64, error) {
	return s.repo.Count(ctx, filter)
}

func (s *bookingService) GetBookingByTrackingCode(ctx context.Context, trackingCode string) (*models.Booking, error) {
	return s.repo.GetByTrackingCode(ctx, trackingCode, []string{"Unit", "Property", "Tenant"})
}

// removeBookingDateBlock soft-deletes the UnitDateBlock associated with a booking.
func (s *bookingService) removeBookingDateBlock(ctx context.Context, bookingID string) {
	var block models.UnitDateBlock
	// We use the appCtx DB directly here since this is a background goroutine.
	s.appCtx.DB.Where("booking_id = ? AND deleted_at IS NULL", bookingID).Delete(&block)
}

func (s *bookingService) sendBookingCreatedNotification(booking *models.Booking, tenant *models.Tenant) {
	trackingURL := s.appCtx.Config.WebsiteURL + "/bookings/track/" + booking.TrackingCode
	_ = trackingURL // TODO: wire into pkg.SendEmail / pkg.SendSMS in the same pattern as lease notifications
}

func (s *bookingService) sendBookingConfirmedNotification(booking *models.Booking) {
	// TODO: wire into pkg.SendEmail / pkg.SendSMS
}

func (s *bookingService) sendBookingCancelledNotification(booking *models.Booking) {
	// TODO: wire into pkg.SendEmail / pkg.SendSMS
}
```

- [ ] **Step 2: Add `FindOrCreateLightTenant` to TenantService**

Open `services/main/internal/services/tenant.go`. Add to the `TenantService` interface and implement:

```go
// In TenantService interface:
FindOrCreateLightTenant(ctx context.Context, input FindOrCreateLightTenantInput) (*models.Tenant, error)

// Input struct (add near other input types in tenant.go):
type FindOrCreateLightTenantInput struct {
	FirstName string
	LastName  string
	Phone     string
	Email     string
	IDNumber  string
}

// Implementation (add to tenantService struct methods):
func (s *tenantService) FindOrCreateLightTenant(ctx context.Context, input FindOrCreateLightTenantInput) (*models.Tenant, error) {
	// Try to find existing tenant by phone
	existing, err := s.repo.GetByPhone(ctx, input.Phone)
	if err == nil && existing != nil {
		return existing, nil
	}

	// Create new light tenant
	tenant := &models.Tenant{
		FirstName: input.FirstName,
		LastName:  input.LastName,
		Phone:     input.Phone,
		Email:     &input.Email,
		IDNumber:  &input.IDNumber,
	}
	if createErr := s.repo.Create(ctx, tenant); createErr != nil {
		return nil, createErr
	}
	return tenant, nil
}
```

Verify that `TenantRepository` has `GetByPhone` and `Create` methods. If `GetByPhone` doesn't exist, add it to the interface and the repository implementation.

- [ ] **Step 3: Run `make lint-fix`**

```bash
cd services/main && make lint-fix
```

- [ ] **Step 4: Commit**

```bash
git add services/main/internal/services/booking.go \
        services/main/internal/services/tenant.go
git commit -m "feat(services): add BookingService and FindOrCreateLightTenant"
```

---

## Task 11: Update LeaseService to create UnitDateBlock on activation

**Files:**
- Modify: `services/main/internal/services/lease.go`

- [ ] **Step 1: Add `UnitDateBlockService` dependency to `leaseService`**

In `lease.go`, add to the `leaseService` struct:
```go
unitDateBlockService UnitDateBlockService
```

Update `NewLeaseService`:
```go
func NewLeaseService(
	appCtx pkg.AppContext,
	repo repository.LeaseRepository,
	invoiceService InvoiceService,
	notificationService NotificationService,
	unitDateBlockService UnitDateBlockService,
) LeaseService {
	return &leaseService{
		appCtx:              appCtx,
		repo:                repo,
		invoiceService:      invoiceService,
		notificationService: notificationService,
		unitDateBlockService: unitDateBlockService,
	}
}
```

- [ ] **Step 2: In `ActivateLease`, after the status is set to Active, create a UnitDateBlock**

Find the `ActivateLease` function. After the point where the lease status becomes `Active` and the DB update succeeds, add:

```go
// Create a UnitDateBlock so the availability calendar reflects this lease
go func() {
	leaseID := lease.ID.String()

	// Calculate end date
	var endDate time.Time
	if lease.StayDuration > 0 && lease.StayDurationFrequency != "" {
		switch strings.ToLower(lease.StayDurationFrequency) {
		case "hours", "hour":
			endDate = lease.MoveInDate.Add(time.Duration(lease.StayDuration) * time.Hour)
		case "days", "day":
			endDate = lease.MoveInDate.AddDate(0, 0, int(lease.StayDuration))
		case "months", "month":
			endDate = lease.MoveInDate.AddDate(0, int(lease.StayDuration), 0)
		default:
			endDate = time.Date(2099, 1, 1, 0, 0, 0, 0, time.UTC)
		}
	} else {
		endDate = time.Date(2099, 1, 1, 0, 0, 0, 0, time.UTC)
	}

	_ = s.unitDateBlockService.CreateSystemBlock(context.Background(), CreateSystemBlockInput{
		UnitID:    lease.UnitId,
		StartDate: lease.MoveInDate,
		EndDate:   endDate,
		BlockType: "LEASE",
		LeaseID:   &leaseID,
		Reason:    "Active lease",
	})
}()
```

- [ ] **Step 3: Update `services/main.go` to pass `unitDateBlockService` to `NewLeaseService`**

In `services/main.go`, the `NewLeaseService` call becomes:

```go
leaseService := NewLeaseService(
	params.AppCtx,
	params.Repository.LeaseRepository,
	invoiceService,
	notificationService,
	unitDateBlockService, // add this
)
```

Note: `unitDateBlockService` must be instantiated before `leaseService`. Move the `unitDateBlockService` init above the `leaseService` init in `NewServices`.

- [ ] **Step 4: Run `make lint-fix`**

```bash
cd services/main && make lint-fix
```

- [ ] **Step 5: Commit**

```bash
git add services/main/internal/services/lease.go \
        services/main/internal/services/main.go
git commit -m "feat(services): create UnitDateBlock when a lease is activated"
```

---

## Task 12: Wire BookingService and UnitDateBlockService into services/main.go

**Files:**
- Modify: `services/main/internal/services/main.go`

- [ ] **Step 1: Add both services to the `Services` struct**

```go
BookingService       BookingService
UnitDateBlockService UnitDateBlockService
```

- [ ] **Step 2: Instantiate and wire in `NewServices`**

Add before `leaseService`:

```go
unitDateBlockService := NewUnitDateBlockService(
	params.AppCtx,
	params.Repository.UnitDateBlockRepository,
)

bookingService := NewBookingService(BookingServiceDeps{
	AppCtx:               params.AppCtx,
	Repo:                 params.Repository.BookingRepository,
	UnitDateBlockService: unitDateBlockService,
	TenantService:        tenantService,
	InvoiceService:       invoiceService,
})
```

Add to the return:

```go
BookingService:       bookingService,
UnitDateBlockService: unitDateBlockService,
```

- [ ] **Step 3: Run `make lint-fix`**

```bash
cd services/main && make lint-fix
```

- [ ] **Step 4: Commit**

```bash
git add services/main/internal/services/main.go
git commit -m "feat(services): wire BookingService and UnitDateBlockService"
```

---

## Task 13: Create BookingHandler

**Files:**
- Create: `services/main/internal/handlers/booking.go`
- Modify: `services/main/internal/handlers/main.go`

- [ ] **Step 1: Create `handlers/booking.go`**

> **Pattern note (read before implementing):**
> - Success response: `json.NewEncoder(w).Encode(map[string]any{"data": ...})` — no `w.WriteHeader(200)` needed (default)
> - Created (201): `w.WriteHeader(http.StatusCreated)` then `json.NewEncoder(w).Encode(...)`
> - Conflict (409): `w.WriteHeader(http.StatusConflict)` then `json.NewEncoder(w).Encode(...)`
> - Error response: `HandleErrorResponse(w, err)` — uses `pkg.IRentLoopError` if available, else 400
> - Client user from context: `lib.ClientUserFromContext(r.Context())` returns `(*lib.ClientUserFromToken, bool)`

```go
package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type BookingHandler struct {
	appCtx               pkg.AppContext
	bookingService       services.BookingService
	unitDateBlockService services.UnitDateBlockService
}

func NewBookingHandler(appCtx pkg.AppContext, svcs services.Services) BookingHandler {
	return BookingHandler{
		appCtx:               appCtx,
		bookingService:       svcs.BookingService,
		unitDateBlockService: svcs.UnitDateBlockService,
	}
}

// ---- Request bodies ----

type CreateBookingRequest struct {
	UnitID         string    `json:"unit_id"          validate:"required,uuid4"`
	CheckInDate    time.Time `json:"check_in_date"    validate:"required"`
	CheckOutDate   time.Time `json:"check_out_date"   validate:"required"`
	Rate           int64     `json:"rate"             validate:"required,gt=0"`
	Currency       string    `json:"currency"         validate:"required"`
	Notes          string    `json:"notes"`
	GuestFirstName string    `json:"guest_first_name" validate:"required"`
	GuestLastName  string    `json:"guest_last_name"  validate:"required"`
	GuestPhone     string    `json:"guest_phone"      validate:"required"`
	GuestEmail     string    `json:"guest_email"      validate:"required,email"`
	GuestIDNumber  string    `json:"guest_id_number"  validate:"required"`
}

type CancelBookingRequest struct {
	Reason string `json:"reason" validate:"required"`
}

type CreateDateBlockRequest struct {
	StartDate time.Time `json:"start_date" validate:"required"`
	EndDate   time.Time `json:"end_date"   validate:"required"`
	BlockType string    `json:"block_type" validate:"required,oneof=MAINTENANCE PERSONAL OTHER"`
	Reason    string    `json:"reason"`
}

type PublicCreateBookingRequest struct {
	CheckInDate  time.Time `json:"check_in_date"  validate:"required"`
	CheckOutDate time.Time `json:"check_out_date" validate:"required"`
	Rate         int64     `json:"rate"           validate:"required,gt=0"`
	Currency     string    `json:"currency"       validate:"required"`
	FirstName    string    `json:"first_name"     validate:"required"`
	LastName     string    `json:"last_name"      validate:"required"`
	Phone        string    `json:"phone"          validate:"required"`
	Email        string    `json:"email"          validate:"required,email"`
	IDNumber     string    `json:"id_number"      validate:"required"`
}

// ---- Manager handlers ----

// CreateBooking godoc
//
//	@Summary		Create a booking (manager)
//	@Tags			Booking
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string								true	"Property ID"
//	@Param			body		body		CreateBookingRequest				true	"Create booking request"
//	@Success		201			{object}	object{data=transformations.OutputBooking}
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/bookings [post]
func (h *BookingHandler) CreateBooking(w http.ResponseWriter, r *http.Request) {
	propertyID := chi.URLParam(r, "property_id")

	clientUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreateBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	// Load property to copy RequiresUpfrontPayment
	var propRow struct {
		BookingRequiresUpfrontPayment bool `gorm:"column:booking_requires_upfront_payment"`
	}
	if err := h.appCtx.DB.Table("properties").
		Select("booking_requires_upfront_payment").
		Where("id = ? AND deleted_at IS NULL", propertyID).
		First(&propRow).Error; err != nil {
		http.Error(w, "property not found", http.StatusNotFound)
		return
	}

	clientUserID := clientUser.ID
	booking, err := h.bookingService.CreateBooking(r.Context(), services.CreateBookingInput{
		UnitID:                 body.UnitID,
		PropertyID:             propertyID,
		CheckInDate:            body.CheckInDate,
		CheckOutDate:           body.CheckOutDate,
		Rate:                   body.Rate,
		Currency:               body.Currency,
		BookingSource:          "MANAGER",
		RequiresUpfrontPayment: propRow.BookingRequiresUpfrontPayment,
		CreatedByClientUserID:  &clientUserID,
		Notes:                  body.Notes,
		GuestFirstName:         body.GuestFirstName,
		GuestLastName:          body.GuestLastName,
		GuestPhone:             body.GuestPhone,
		GuestEmail:             body.GuestEmail,
		GuestIDNumber:          body.GuestIDNumber,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{"data": transformations.TransformBooking(booking)})
}

// ListBookings godoc
//
//	@Summary		List bookings for a property
//	@Tags			Booking
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path	string	true	"Property ID"
//	@Param			status		query	string	false	"Filter by status"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/bookings [get]
func (h *BookingHandler) ListBookings(w http.ResponseWriter, r *http.Request) {
	propertyID := chi.URLParam(r, "property_id")
	filterQuery, err := lib.GenerateQuery(r.URL.Query())
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	filter := repository.ListBookingsFilter{PropertyID: &propertyID, FilterQuery: *filterQuery}
	if s := r.URL.Query().Get("status"); s != "" {
		filter.Status = &s
	}

	bookings, err := h.bookingService.ListBookings(r.Context(), filter)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}
	count, _ := h.bookingService.CountBookings(r.Context(), filter)

	rows := make([]interface{}, len(bookings))
	for i, b := range bookings {
		out := transformations.TransformBooking(&b)
		rows[i] = out
	}
	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, count))
}

// GetBooking godoc
//
//	@Summary		Get a booking by ID
//	@Tags			Booking
//	@Security		BearerAuth
//	@Produce		json
//	@Param			booking_id	path	string	true	"Booking ID"
//	@Router			/api/v1/admin/clients/{client_id}/bookings/{booking_id} [get]
func (h *BookingHandler) GetBooking(w http.ResponseWriter, r *http.Request) {
	bookingID := chi.URLParam(r, "booking_id")
	booking, err := h.bookingService.GetBooking(r.Context(), bookingID, []string{"Tenant", "Unit", "Property", "Invoice"})
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]any{"errors": map[string]string{"message": "booking not found"}})
		return
	}
	json.NewEncoder(w).Encode(map[string]any{"data": transformations.TransformBooking(booking)})
}

// ConfirmBooking godoc
//
//	@Summary		Confirm a pending booking
//	@Tags			Booking
//	@Security		BearerAuth
//	@Produce		json
//	@Param			booking_id	path	string	true	"Booking ID"
//	@Router			/api/v1/admin/clients/{client_id}/bookings/{booking_id}/confirm [put]
func (h *BookingHandler) ConfirmBooking(w http.ResponseWriter, r *http.Request) {
	bookingID := chi.URLParam(r, "booking_id")
	clientUser, _ := lib.ClientUserFromContext(r.Context())

	booking, err := h.bookingService.ConfirmBooking(r.Context(), services.ConfirmBookingInput{
		BookingID:    bookingID,
		ClientUserID: clientUser.ID,
	})
	if err != nil {
		if err.Error() == "dates are no longer available: overlapping block exists" {
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]any{"errors": map[string]string{"message": err.Error()}})
			return
		}
		HandleErrorResponse(w, err)
		return
	}
	json.NewEncoder(w).Encode(map[string]any{"data": transformations.TransformBooking(booking)})
}

// CheckInBooking godoc
//
//	@Summary		Mark a booking as checked in
//	@Tags			Booking
//	@Security		BearerAuth
//	@Produce		json
//	@Router			/api/v1/admin/clients/{client_id}/bookings/{booking_id}/check-in [put]
func (h *BookingHandler) CheckInBooking(w http.ResponseWriter, r *http.Request) {
	bookingID := chi.URLParam(r, "booking_id")
	clientUser, _ := lib.ClientUserFromContext(r.Context())
	booking, err := h.bookingService.CheckInBooking(r.Context(), bookingID, clientUser.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}
	json.NewEncoder(w).Encode(map[string]any{"data": transformations.TransformBooking(booking)})
}

// CompleteBooking godoc
//
//	@Summary		Mark a booking as completed
//	@Tags			Booking
//	@Security		BearerAuth
//	@Produce		json
//	@Router			/api/v1/admin/clients/{client_id}/bookings/{booking_id}/complete [put]
func (h *BookingHandler) CompleteBooking(w http.ResponseWriter, r *http.Request) {
	bookingID := chi.URLParam(r, "booking_id")
	clientUser, _ := lib.ClientUserFromContext(r.Context())
	booking, err := h.bookingService.CompleteBooking(r.Context(), bookingID, clientUser.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}
	json.NewEncoder(w).Encode(map[string]any{"data": transformations.TransformBooking(booking)})
}

// CancelBooking godoc
//
//	@Summary		Cancel a booking
//	@Tags			Booking
//	@Security		BearerAuth
//	@Accept			json
//	@Produce		json
//	@Router			/api/v1/admin/clients/{client_id}/bookings/{booking_id}/cancel [put]
func (h *BookingHandler) CancelBooking(w http.ResponseWriter, r *http.Request) {
	bookingID := chi.URLParam(r, "booking_id")
	clientUser, _ := lib.ClientUserFromContext(r.Context())

	var body CancelBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	booking, err := h.bookingService.CancelBooking(r.Context(), services.CancelBookingInput{
		BookingID:          bookingID,
		ClientUserID:       clientUser.ID,
		CancellationReason: body.Reason,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}
	json.NewEncoder(w).Encode(map[string]any{"data": transformations.TransformBooking(booking)})
}

// GetAvailability godoc
//
//	@Summary		Get availability for a unit (manager)
//	@Tags			Booking
//	@Security		BearerAuth
//	@Produce		json
//	@Param			unit_id	path	string	true	"Unit ID"
//	@Param			from	query	string	true	"Start date RFC3339"
//	@Param			to		query	string	true	"End date RFC3339"
//	@Router			/api/v1/admin/clients/{client_id}/units/{unit_id}/availability [get]
func (h *BookingHandler) GetAvailability(w http.ResponseWriter, r *http.Request) {
	unitID := chi.URLParam(r, "unit_id")
	from, err := time.Parse(time.RFC3339, r.URL.Query().Get("from"))
	if err != nil {
		http.Error(w, "invalid 'from' date", http.StatusBadRequest)
		return
	}
	to, err := time.Parse(time.RFC3339, r.URL.Query().Get("to"))
	if err != nil {
		http.Error(w, "invalid 'to' date", http.StatusBadRequest)
		return
	}

	blocks, err := h.unitDateBlockService.GetAvailability(r.Context(), unitID, from, to)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	out := make([]transformations.OutputUnitDateBlock, len(blocks))
	for i, b := range blocks {
		out[i] = transformations.TransformUnitDateBlock(&b)
	}
	json.NewEncoder(w).Encode(map[string]any{"data": out})
}

// CreateDateBlock godoc
//
//	@Summary		Create a manual date block for a unit
//	@Tags			Booking
//	@Security		BearerAuth
//	@Accept			json
//	@Produce		json
//	@Router			/api/v1/admin/clients/{client_id}/units/{unit_id}/date-blocks [post]
func (h *BookingHandler) CreateDateBlock(w http.ResponseWriter, r *http.Request) {
	unitID := chi.URLParam(r, "unit_id")
	clientUser, _ := lib.ClientUserFromContext(r.Context())

	var body CreateDateBlockRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	block, err := h.unitDateBlockService.CreateManualBlock(r.Context(), services.CreateManualBlockInput{
		UnitID:                unitID,
		StartDate:             body.StartDate,
		EndDate:               body.EndDate,
		BlockType:             body.BlockType,
		Reason:                body.Reason,
		CreatedByClientUserID: clientUser.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{"data": transformations.TransformUnitDateBlock(block)})
}

// DeleteDateBlock godoc
//
//	@Summary		Delete a manual date block
//	@Tags			Booking
//	@Security		BearerAuth
//	@Produce		json
//	@Router			/api/v1/admin/clients/{client_id}/date-blocks/{block_id} [delete]
func (h *BookingHandler) DeleteDateBlock(w http.ResponseWriter, r *http.Request) {
	blockID := chi.URLParam(r, "block_id")
	clientUser, _ := lib.ClientUserFromContext(r.Context())
	if err := h.unitDateBlockService.DeleteBlock(r.Context(), blockID, clientUser.ID); err != nil {
		HandleErrorResponse(w, err)
		return
	}
	json.NewEncoder(w).Encode(map[string]any{"message": "block deleted"})
}

// ---- Public handlers (no auth) ----

// PublicGetAvailability godoc
//
//	@Summary		Get availability for a unit (public)
//	@Tags			Public
//	@Produce		json
//	@Param			unit_slug	path	string	true	"Unit Slug"
//	@Router			/api/v1/public/units/{unit_slug}/availability [get]
func (h *BookingHandler) PublicGetAvailability(w http.ResponseWriter, r *http.Request) {
	unitSlug := chi.URLParam(r, "unit_slug")

	var unit struct {
		ID string
	}
	if err := h.appCtx.DB.Table("units").Select("id").
		Where("slug = ? AND deleted_at IS NULL", unitSlug).First(&unit).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]any{"errors": map[string]string{"message": "unit not found"}})
		return
	}

	from, _ := time.Parse(time.RFC3339, r.URL.Query().Get("from"))
	to, _ := time.Parse(time.RFC3339, r.URL.Query().Get("to"))
	if from.IsZero() {
		from = time.Now()
	}
	if to.IsZero() {
		to = from.AddDate(0, 3, 0)
	}

	blocks, err := h.unitDateBlockService.GetAvailability(r.Context(), unit.ID, from, to)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	out := make([]transformations.OutputUnitDateBlock, len(blocks))
	for i, b := range blocks {
		out[i] = transformations.TransformUnitDateBlock(&b)
	}
	json.NewEncoder(w).Encode(map[string]any{"data": out})
}

// PublicCreateBooking godoc
//
//	@Summary		Create a booking as a guest (public)
//	@Tags			Public
//	@Accept			json
//	@Produce		json
//	@Param			unit_slug	path	string	true	"Unit Slug"
//	@Router			/api/v1/public/units/{unit_slug}/bookings [post]
func (h *BookingHandler) PublicCreateBooking(w http.ResponseWriter, r *http.Request) {
	unitSlug := chi.URLParam(r, "unit_slug")

	var unit struct {
		ID         string
		PropertyID string `gorm:"column:property_id"`
	}
	if err := h.appCtx.DB.Table("units").Select("id, property_id").
		Where("slug = ? AND deleted_at IS NULL", unitSlug).First(&unit).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]any{"errors": map[string]string{"message": "unit not found"}})
		return
	}

	var propRow struct {
		BookingRequiresUpfrontPayment bool `gorm:"column:booking_requires_upfront_payment"`
	}
	h.appCtx.DB.Table("properties").Select("booking_requires_upfront_payment").
		Where("id = ?", unit.PropertyID).First(&propRow)

	var body PublicCreateBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	booking, err := h.bookingService.CreateBooking(r.Context(), services.CreateBookingInput{
		UnitID:                 unit.ID,
		PropertyID:             unit.PropertyID,
		CheckInDate:            body.CheckInDate,
		CheckOutDate:           body.CheckOutDate,
		Rate:                   body.Rate,
		Currency:               body.Currency,
		BookingSource:          "GUEST_LINK",
		RequiresUpfrontPayment: propRow.BookingRequiresUpfrontPayment,
		GuestFirstName:         body.FirstName,
		GuestLastName:          body.LastName,
		GuestPhone:             body.Phone,
		GuestEmail:             body.Email,
		GuestIDNumber:          body.IDNumber,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{"data": transformations.TransformPublicBooking(booking)})
}

// PublicGetBookingTracking godoc
//
//	@Summary		Get booking status by tracking code (phone-verified)
//	@Tags			Public
//	@Produce		json
//	@Param			tracking_code	path	string	true	"Tracking Code"
//	@Param			phone			query	string	true	"Guest phone number"
//	@Router			/api/v1/public/bookings/track/{tracking_code} [get]
func (h *BookingHandler) PublicGetBookingTracking(w http.ResponseWriter, r *http.Request) {
	trackingCode := chi.URLParam(r, "tracking_code")
	phone := r.URL.Query().Get("phone")

	booking, err := h.bookingService.GetBookingByTrackingCode(r.Context(), trackingCode)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]any{"errors": map[string]string{"message": "booking not found"}})
		return
	}

	// Verify phone matches — protects guest data
	if booking.Tenant.Phone != phone {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]any{"errors": map[string]string{"message": "phone number does not match this booking"}})
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": transformations.TransformPublicBooking(booking)})
}
```

- [ ] **Step 2: Add `BookingHandler` to `handlers/main.go`**

In `Handlers` struct:
```go
BookingHandler BookingHandler
```

In `NewHandlers`, add:
```go
bookingHandler := NewBookingHandler(appCtx, services)
```

In the return:
```go
BookingHandler: bookingHandler,
```

- [ ] **Step 3: Run `make lint-fix`**

```bash
cd services/main && make lint-fix
```

- [ ] **Step 4: Commit**

```bash
git add services/main/internal/handlers/booking.go \
        services/main/internal/handlers/main.go
git commit -m "feat(handlers): add BookingHandler with manager and public endpoints"
```

---

## Task 14: Register routes

**Files:**
- Modify: `services/main/internal/router/client-user.go`

- [ ] **Step 1: Add manager booking routes to `client-user.go`**

Inside the protected routes group (`r.Use(middlewares.CheckForUserAuthPresenceMiddleware)`), within the `r.Route("/v1/admin/clients/{client_id}", ...)` block, add:

```go
// Booking routes (property-scoped)
r.Route("/v1/admin/clients/{client_id}/properties/{property_id}/bookings", func(r chi.Router) {
	r.Use(middlewares.ValidateClientMembershipMiddleware(appCtx))
	r.Post("/", handlers.BookingHandler.CreateBooking)
	r.Get("/", handlers.BookingHandler.ListBookings)
})

// Booking lifecycle routes (not property-scoped)
r.Route("/v1/admin/clients/{client_id}/bookings/{booking_id}", func(r chi.Router) {
	r.Use(middlewares.ValidateClientMembershipMiddleware(appCtx))
	r.Get("/", handlers.BookingHandler.GetBooking)
	r.Put("/confirm", handlers.BookingHandler.ConfirmBooking)
	r.Put("/check-in", handlers.BookingHandler.CheckInBooking)
	r.Put("/complete", handlers.BookingHandler.CompleteBooking)
	r.Put("/cancel", handlers.BookingHandler.CancelBooking)
})

// Unit availability and date block routes
r.Route("/v1/admin/clients/{client_id}/units/{unit_id}", func(r chi.Router) {
	r.Use(middlewares.ValidateClientMembershipMiddleware(appCtx))
	r.Get("/availability", handlers.BookingHandler.GetAvailability)
	r.Post("/date-blocks", handlers.BookingHandler.CreateDateBlock)
})

r.Route("/v1/admin/clients/{client_id}/date-blocks/{block_id}", func(r chi.Router) {
	r.Use(middlewares.ValidateClientMembershipMiddleware(appCtx))
	r.Delete("/", handlers.BookingHandler.DeleteDateBlock)
})
```

- [ ] **Step 2: Add public booking routes**

In `client-user.go` inside the unprotected group (before the `CheckForUserAuthPresenceMiddleware` block):

```go
// Public booking routes (no auth)
r.Get("/v1/public/units/{unit_slug}/availability", handlers.BookingHandler.PublicGetAvailability)
r.Post("/v1/public/units/{unit_slug}/bookings", handlers.BookingHandler.PublicCreateBooking)
r.Get("/v1/public/bookings/track/{tracking_code}", handlers.BookingHandler.PublicGetBookingTracking)
```

- [ ] **Step 3: Run `make lint-fix`**

```bash
cd services/main && make lint-fix
```

- [ ] **Step 4: Commit**

```bash
git add services/main/internal/router/client-user.go
git commit -m "feat(router): register booking and availability routes"
```

---

## Task 15: Update Property transformation to expose Modes

**Files:**
- Modify: `services/main/internal/transformations/property.go`

- [ ] **Step 1: Open `transformations/property.go` and find the output struct for properties**

Add the new fields to the output struct:
```go
Modes                        []string `json:"modes"`
BookingRequiresUpfrontPayment bool    `json:"booking_requires_upfront_payment"`
```

And in the transformation function, populate them:
```go
Modes:                        property.Modes,
BookingRequiresUpfrontPayment: property.BookingRequiresUpfrontPayment,
```

- [ ] **Step 2: Run `make lint-fix`**

```bash
cd services/main && make lint-fix
```

- [ ] **Step 3: Commit**

```bash
git add services/main/internal/transformations/property.go
git commit -m "feat(transformations): expose modes and booking_requires_upfront_payment on Property"
```

---

## Task 16: Build and smoke test

- [ ] **Step 1: Start the dev server**

```bash
cd services/main && make run-dev
```

Expected: server starts on port 5003, no compile errors.

- [ ] **Step 2: Verify new tables exist in DB**

```bash
psql $DATABASE_URL -c "\dt bookings; \dt unit_date_blocks;"
```

Expected: both tables listed.

- [ ] **Step 3: Swagger docs are accessible**

Visit `http://localhost:5003/swagger/index.html` and search for "Booking". Confirm the new endpoints appear.

- [ ] **Step 4: Create a test booking via API**

```bash
# 1. Login as a client user to get a JWT
curl -s -X POST http://localhost:5003/api/v1/admin/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' | jq .

# 2. Create a booking (replace TOKEN, CLIENT_ID, PROPERTY_ID with real values)
curl -s -X POST http://localhost:5003/api/v1/admin/clients/CLIENT_ID/properties/PROPERTY_ID/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "unit_id": "UNIT_ID",
    "check_in_date": "2026-05-01T00:00:00Z",
    "check_out_date": "2026-05-05T00:00:00Z",
    "rate": 40000,
    "currency": "GHS",
    "guest_first_name": "Jane",
    "guest_last_name": "Doe",
    "guest_phone": "0241234567",
    "guest_email": "jane@example.com",
    "guest_id_number": "GHA123456"
  }' | jq .
```

Expected: `201 Created` with booking object in `data`.

- [ ] **Step 5: Confirm the booking**

```bash
curl -s -X PUT http://localhost:5003/api/v1/admin/clients/CLIENT_ID/bookings/BOOKING_ID/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" | jq .
```

Expected: `200 OK`, status `CONFIRMED`, `check_in_code` is a 5-digit string.

- [ ] **Step 6: Try to confirm a second booking for the same dates (double-booking test)**

Create another booking with the same unit_id and dates, then try to confirm it.
Expected: `409 Conflict` with "overlapping block" message.

- [ ] **Step 7: Test public availability endpoint**

```bash
curl -s "http://localhost:5003/api/v1/public/units/UNIT_SLUG/availability?from=2026-05-01T00:00:00Z&to=2026-06-01T00:00:00Z" | jq .
```

Expected: array of blocks including the confirmed booking's block.

- [ ] **Step 8: Regenerate Swagger docs**

```bash
cd services/main && make generate-docs
```

- [ ] **Step 9: Final commit**

```bash
git add services/main/docs/
git commit -m "docs: regenerate Swagger docs for booking endpoints"
```

---

## Verification Checklist

- [ ] `make run-dev` compiles and starts without errors
- [ ] `make update-db` applies all 4 new migrations cleanly
- [ ] Existing properties in DB have `modes = '{"LEASE"}'` after migration
- [ ] Active/pending leases have corresponding rows in `unit_date_blocks`
- [ ] `POST .../bookings` → 201, returns booking with status PENDING
- [ ] `PUT .../confirm` → 200, status CONFIRMED, check_in_code populated, UnitDateBlock row created
- [ ] Second confirm on same dates → 409 Conflict
- [ ] `PUT .../cancel` → 200, status CANCELLED, UnitDateBlock soft-deleted
- [ ] `GET .../availability` returns blocks including the booking block
- [ ] `GET /api/v1/public/units/:slug/availability` works without auth
- [ ] `POST /api/v1/public/units/:slug/bookings` works without auth
- [ ] Swagger docs include all new endpoints
