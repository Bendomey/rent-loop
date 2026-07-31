package repository

import (
	"context"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type RefreshTokenRepository interface {
	Create(ctx context.Context, token *models.RefreshToken) error
	// GetByIDForUpdate reads the row and holds a row-level write lock until the
	// surrounding transaction ends. MUST be called inside a transaction —
	// without one the lock is released immediately and two concurrent refreshes
	// can both validate the same token before either revokes it.
	GetByIDForUpdate(ctx context.Context, id string) (*models.RefreshToken, error)
	Update(ctx context.Context, token *models.RefreshToken) error
	// RevokeAllForSession retires every live token belonging to a session.
	// Replaces the old replaced_by_id chain walk: session membership is now
	// explicit, so killing a compromised session is one indexed UPDATE rather
	// than a recursive CTE.
	RevokeAllForSession(ctx context.Context, sessionID string, revokedAt time.Time) (int64, error)
	// DeleteRetiredBefore prunes spent credentials past the reuse-detection
	// window. Safe to run on a schedule — the session they belonged to lives in
	// its own table and is untouched, which is exactly what the old single-table
	// design made impossible.
	DeleteRetiredBefore(ctx context.Context, cutoff time.Time) (int64, error)
}

type refreshTokenRepository struct {
	DB *gorm.DB
}

func NewRefreshTokenRepository(db *gorm.DB) RefreshTokenRepository {
	return &refreshTokenRepository{db}
}

func (r *refreshTokenRepository) Create(ctx context.Context, token *models.RefreshToken) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Create(token).Error
}

func (r *refreshTokenRepository) GetByIDForUpdate(
	ctx context.Context,
	id string,
) (*models.RefreshToken, error) {
	var token models.RefreshToken
	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("id = ?", id).
		First(&token)
	if result.Error != nil {
		return nil, result.Error
	}
	return &token, nil
}

func (r *refreshTokenRepository) Update(ctx context.Context, token *models.RefreshToken) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Save(token).Error
}

func (r *refreshTokenRepository) RevokeAllForSession(
	ctx context.Context,
	sessionID string,
	revokedAt time.Time,
) (int64, error) {
	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Model(&models.RefreshToken{}).
		Where("session_id = ? AND revoked_at IS NULL", sessionID).
		Updates(map[string]any{"revoked_at": revokedAt, "updated_at": revokedAt})
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}

func (r *refreshTokenRepository) DeleteRetiredBefore(
	ctx context.Context,
	cutoff time.Time,
) (int64, error) {
	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Where("revoked_at IS NOT NULL AND revoked_at < ?", cutoff).
		Delete(&models.RefreshToken{})
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}
