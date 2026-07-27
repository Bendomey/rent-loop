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
	// RevokeChainFrom revokes the given row and every token descended from it
	// via replaced_by_id, returning how many rows it changed. Used only by
	// reuse detection, to kill an entire compromised session line.
	RevokeChainFrom(ctx context.Context, id string, revokedAt time.Time) (int64, error)
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

func (r *refreshTokenRepository) RevokeChainFrom(
	ctx context.Context,
	id string,
	revokedAt time.Time,
) (int64, error) {
	// One recursive CTE instead of a read-then-update loop: the chain can be
	// arbitrarily long, and every extra round-trip is time the compromised
	// session stays usable.
	const query = `
		WITH RECURSIVE chain AS (
			SELECT id, replaced_by_id FROM refresh_tokens WHERE id = ?
			UNION ALL
			SELECT rt.id, rt.replaced_by_id
			FROM refresh_tokens rt
			INNER JOIN chain c ON rt.id = c.replaced_by_id
		)
		UPDATE refresh_tokens
		SET revoked_at = ?, updated_at = ?
		WHERE id IN (SELECT id FROM chain) AND revoked_at IS NULL
	`
	result := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Exec(query, id, revokedAt, revokedAt)
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}
