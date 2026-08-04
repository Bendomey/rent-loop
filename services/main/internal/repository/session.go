package repository

import (
	"context"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type SessionRepository interface {
	Create(ctx context.Context, session *models.Session) error
	GetByID(ctx context.Context, id string) (*models.Session, error)
	// ListActiveForUser returns every session that can still be refreshed,
	// most recently used first. One row per sign-in — no chain reconstruction.
	ListActiveForUser(ctx context.Context, userID string) ([]models.Session, error)
	Update(ctx context.Context, session *models.Session) error
	// TouchActivity advances the columns that move on every refresh, without
	// rewriting the whole row.
	TouchActivity(ctx context.Context, id string, activity SessionActivity) error
	Revoke(ctx context.Context, id string, reason string, revokedAt time.Time) error
	// RevokeAllForUserExcept ends every other session for a user, returning how
	// many it ended. Passing an empty exceptID revokes all of them.
	RevokeAllForUserExcept(
		ctx context.Context,
		userID string,
		exceptID string,
		reason string,
		revokedAt time.Time,
	) (int64, error)
}

// SessionActivity is the per-refresh update: last seen time, sliding expiry,
// where the request came from, and — when the client resent its metadata —
// the place it reports being in.
type SessionActivity struct {
	LastUsedAt time.Time
	ExpiresAt  time.Time
	IPAddress  *string
	UserAgent  *string

	// Location fields are only set when the refresh carried metadata. Nil
	// means "client said nothing this time", which must leave the previously
	// recorded place alone rather than clearing it.
	Timezone        *string
	LocationCity    *string
	LocationCountry *string
	LocationSource  *string
}

type sessionRepository struct {
	DB *gorm.DB
}

func NewSessionRepository(db *gorm.DB) SessionRepository {
	return &sessionRepository{db}
}

func (r *sessionRepository) Create(ctx context.Context, session *models.Session) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Create(session).Error
}

func (r *sessionRepository) GetByID(ctx context.Context, id string) (*models.Session, error) {
	var session models.Session
	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).Where("id = ?", id).First(&session)
	if result.Error != nil {
		return nil, result.Error
	}
	return &session, nil
}

func (r *sessionRepository) ListActiveForUser(
	ctx context.Context,
	userID string,
) ([]models.Session, error) {
	var sessions []models.Session
	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Where("user_id = ? AND revoked_at IS NULL AND expires_at > ?", userID, time.Now()).
		Order("last_used_at DESC").
		Find(&sessions)
	if result.Error != nil {
		return nil, result.Error
	}
	return sessions, nil
}

func (r *sessionRepository) Update(ctx context.Context, session *models.Session) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Save(session).Error
}

func (r *sessionRepository) TouchActivity(
	ctx context.Context,
	id string,
	activity SessionActivity,
) error {
	updates := map[string]any{
		"last_used_at": activity.LastUsedAt,
		"expires_at":   activity.ExpiresAt,
		"updated_at":   activity.LastUsedAt,
	}
	// Only overwrite the network/location columns when this request actually
	// carried the information — a refresh with no User-Agent shouldn't blank
	// out what login recorded.
	if activity.IPAddress != nil {
		updates["ip_address"] = *activity.IPAddress
	}
	if activity.UserAgent != nil {
		updates["user_agent"] = *activity.UserAgent
	}
	if activity.Timezone != nil {
		updates["timezone"] = *activity.Timezone
	}
	if activity.LocationCity != nil {
		updates["location_city"] = *activity.LocationCity
	}
	if activity.LocationCountry != nil {
		updates["location_country"] = *activity.LocationCountry
	}
	if activity.LocationSource != nil {
		updates["location_source"] = *activity.LocationSource
	}
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Model(&models.Session{}).
		Where("id = ?", id).
		Updates(updates).Error
}

func (r *sessionRepository) Revoke(
	ctx context.Context,
	id string,
	reason string,
	revokedAt time.Time,
) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Model(&models.Session{}).
		Where("id = ? AND revoked_at IS NULL", id).
		Updates(map[string]any{
			"revoked_at":     revokedAt,
			"revoked_reason": reason,
			"updated_at":     revokedAt,
		}).Error
}

func (r *sessionRepository) RevokeAllForUserExcept(
	ctx context.Context,
	userID string,
	exceptID string,
	reason string,
	revokedAt time.Time,
) (int64, error) {
	query := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Model(&models.Session{}).
		Where("user_id = ? AND revoked_at IS NULL", userID)

	if exceptID != "" {
		query = query.Where("id <> ?", exceptID)
	}

	result := query.Updates(map[string]any{
		"revoked_at":     revokedAt,
		"revoked_reason": reason,
		"updated_at":     revokedAt,
	})
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}
