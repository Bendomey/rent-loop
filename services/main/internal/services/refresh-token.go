package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/redis/go-redis/v9"
	log "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// invalidRefreshToken is the single failure every rejection path returns. The
// caller must never learn whether a token was malformed, unknown, mismatched,
// revoked, or expired — only that it is not usable.
func invalidRefreshToken() error {
	return pkg.UnauthorizedError("InvalidRefreshToken", nil)
}

// replayCacheEntry is what a rotation leaves behind for a few seconds so that
// the same client racing itself gets an identical answer instead of being
// treated as a thief. It holds a live refresh token, which is why its TTL is
// measured in seconds.
type replayCacheEntry struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
}

// replayCacheKey is keyed on the RETIRED token's hash — the thing a replaying
// client will present — not on the replacement's.
func replayCacheKey(retiredTokenHash string) string {
	return fmt.Sprintf("refresh_replay:%s", retiredTokenHash)
}

type IssueRefreshTokenInput struct {
	UserID    string
	UserAgent *string
	IPAddress *string
}

type IssuedRefreshToken struct {
	Token     string
	ExpiresAt time.Time
}

type RotatedRefreshToken struct {
	UserID    string
	Token     string
	ExpiresAt time.Time
}

type RefreshTokenService interface {
	Issue(ctx context.Context, input IssueRefreshTokenInput) (*IssuedRefreshToken, error)
	Rotate(ctx context.Context, presented string) (*RotatedRefreshToken, error)
	Revoke(ctx context.Context, presented string) error
	TTL() time.Duration
}

type refreshTokenService struct {
	appCtx pkg.AppContext
	repo   repository.RefreshTokenRepository
}

func NewRefreshTokenService(
	appCtx pkg.AppContext,
	repo repository.RefreshTokenRepository,
) RefreshTokenService {
	return &refreshTokenService{appCtx, repo}
}

func (s *refreshTokenService) TTL() time.Duration {
	return time.Duration(s.appCtx.Config.AuthTokenTTL.RefreshTokenDays) * 24 * time.Hour
}

func (s *refreshTokenService) graceWindow() time.Duration {
	return time.Duration(s.appCtx.Config.AuthTokenTTL.ReplayGraceSeconds) * time.Second
}

// rememberReplacement records what a rotation handed back. Failure is logged
// and swallowed: the rotation itself already succeeded, and losing the grace
// window degrades a racing client to a logout — bad, but not a reason to fail
// an otherwise good request.
func (s *refreshTokenService) rememberReplacement(
	ctx context.Context,
	retiredTokenHash string,
	entry replayCacheEntry,
) {
	payload, marshalErr := json.Marshal(entry)
	if marshalErr != nil {
		log.WithError(marshalErr).Error("refresh replay: failed to marshal cache entry")
		return
	}
	if setErr := s.appCtx.RDB.Set(
		ctx, replayCacheKey(retiredTokenHash), payload, s.graceWindow(),
	).Err(); setErr != nil {
		log.WithError(setErr).Error("refresh replay: failed to cache replacement token")
	}
}

// forgetReplacement undoes rememberReplacement. Only needed when the rotation
// transaction fails to commit after the entry was already written, which would
// otherwise leave the cache advertising a token that was rolled away.
func (s *refreshTokenService) forgetReplacement(ctx context.Context, retiredTokenHash string) {
	if delErr := s.appCtx.RDB.Del(ctx, replayCacheKey(retiredTokenHash)).Err(); delErr != nil {
		log.WithError(delErr).Error("refresh replay: failed to evict stale cache entry")
	}
}

// recallReplacement returns what this retired token was previously exchanged
// for, if that happened within the grace window. It fails CLOSED: any error,
// including Redis being unreachable, reports "no entry" so the caller falls
// through to theft detection. An unverifiable replay must never be trusted.
func (s *refreshTokenService) recallReplacement(
	ctx context.Context,
	retiredTokenHash string,
) (*replayCacheEntry, bool) {
	raw, getErr := s.appCtx.RDB.Get(ctx, replayCacheKey(retiredTokenHash)).Result()
	if getErr != nil {
		if !errors.Is(getErr, redis.Nil) {
			log.WithError(getErr).Error("refresh replay: cache lookup failed, treating as miss")
		}
		return nil, false
	}

	var entry replayCacheEntry
	if unmarshalErr := json.Unmarshal([]byte(raw), &entry); unmarshalErr != nil {
		log.WithError(unmarshalErr).Error("refresh replay: corrupt cache entry, treating as miss")
		return nil, false
	}
	if entry.Token == "" {
		return nil, false
	}
	return &entry, true
}

// Issue mints a brand-new session row. It intentionally does not open its own
// transaction so it can join the caller's (login) if there is one.
func (s *refreshTokenService) Issue(
	ctx context.Context,
	input IssueRefreshTokenInput,
) (*IssuedRefreshToken, error) {
	secret, err := lib.GenerateRefreshTokenSecret()
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "Issue",
				"action":   "generating refresh token secret",
			},
		})
	}

	now := time.Now()
	token := &models.RefreshToken{
		UserID:     input.UserID,
		TokenHash:  lib.HashRefreshTokenSecret(secret),
		UserAgent:  input.UserAgent,
		IPAddress:  input.IPAddress,
		ExpiresAt:  now.Add(s.TTL()),
		LastUsedAt: now,
	}

	if createErr := s.repo.Create(ctx, token); createErr != nil {
		return nil, pkg.InternalServerError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err:      createErr,
			Metadata: map[string]string{"function": "Issue", "action": "creating refresh token"},
		})
	}

	return &IssuedRefreshToken{
		Token:     lib.ComposeRefreshToken(token.ID.String(), secret),
		ExpiresAt: token.ExpiresAt,
	}, nil
}

// Rotate validates a presented token and swaps it for a fresh one. The whole
// sequence runs in one transaction holding a row lock, so two concurrent
// refreshes of the same token cannot both succeed and fork the chain — the
// loser blocks, then sees revoked_at already set and trips reuse detection.
func (s *refreshTokenService) Rotate(
	ctx context.Context,
	presented string,
) (*RotatedRefreshToken, error) {
	id, secret, parseErr := lib.ParseRefreshToken(presented)
	if parseErr != nil {
		return nil, invalidRefreshToken()
	}

	tx := s.appCtx.DB.Begin()
	if tx.Error != nil {
		return nil, pkg.InternalServerError(tx.Error.Error(), &pkg.RentLoopErrorParams{
			Err:      tx.Error,
			Metadata: map[string]string{"function": "Rotate", "action": "beginning transaction"},
		})
	}
	txCtx := lib.WithTransaction(ctx, tx)

	row, err := s.repo.GetByIDForUpdate(txCtx, id)
	if err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, invalidRefreshToken()
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "Rotate", "action": "locking refresh token"},
		})
	}

	if !lib.RefreshTokenSecretMatches(secret, row.TokenHash) {
		tx.Rollback()
		return nil, invalidRefreshToken()
	}

	now := time.Now()

	// Already revoked means this token was replayed after it had been rotated
	// away. That is usually theft — but it is also what one honest client looks
	// like when two of its own requests refresh at the same instant. Check the
	// grace window before reaching for the cascade.
	if row.RevokedAt != nil {
		if entry, hit := s.recallReplacement(ctx, row.TokenHash); hit {
			// Same answer as the first caller got. Nothing is written: no new
			// row, no re-rotation, no revocation.
			tx.Rollback()
			return &RotatedRefreshToken{
				UserID:    row.UserID,
				Token:     entry.Token,
				ExpiresAt: entry.ExpiresAt,
			}, nil
		}

		// Outside the window: a genuine replay. Kill the entire descendant
		// chain, not just this row.
		if _, cascadeErr := s.repo.RevokeChainFrom(txCtx, row.ID.String(), now); cascadeErr != nil {
			tx.Rollback()
			return nil, pkg.InternalServerError(cascadeErr.Error(), &pkg.RentLoopErrorParams{
				Err: cascadeErr,
				Metadata: map[string]string{
					"function": "Rotate",
					"action":   "revoking compromised token chain",
				},
			})
		}
		if commitErr := tx.Commit().Error; commitErr != nil {
			return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
				Err: commitErr,
				Metadata: map[string]string{
					"function": "Rotate",
					"action":   "committing chain revocation",
				},
			})
		}
		return nil, invalidRefreshToken()
	}

	// Plain inactivity timeout. NOT a security signal — no cascade, the session
	// just ends.
	if row.ExpiresAt.Before(now) {
		tx.Rollback()
		return nil, invalidRefreshToken()
	}

	newSecret, secretErr := lib.GenerateRefreshTokenSecret()
	if secretErr != nil {
		tx.Rollback()
		return nil, pkg.InternalServerError(secretErr.Error(), &pkg.RentLoopErrorParams{
			Err: secretErr,
			Metadata: map[string]string{
				"function": "Rotate",
				"action":   "generating replacement secret",
			},
		})
	}

	replacement := &models.RefreshToken{
		UserID:     row.UserID,
		TokenHash:  lib.HashRefreshTokenSecret(newSecret),
		UserAgent:  row.UserAgent,
		IPAddress:  row.IPAddress,
		Metadata:   row.Metadata,
		ExpiresAt:  now.Add(s.TTL()),
		LastUsedAt: now,
	}
	if createErr := s.repo.Create(txCtx, replacement); createErr != nil {
		tx.Rollback()
		return nil, pkg.InternalServerError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err:      createErr,
			Metadata: map[string]string{"function": "Rotate", "action": "creating replacement token"},
		})
	}

	replacementID := replacement.ID.String()
	row.RevokedAt = &now
	row.ReplacedByID = &replacementID
	row.LastUsedAt = now
	if updateErr := s.repo.Update(txCtx, row); updateErr != nil {
		tx.Rollback()
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "Rotate", "action": "retiring presented token"},
		})
	}

	rotated := &RotatedRefreshToken{
		UserID:    row.UserID,
		Token:     lib.ComposeRefreshToken(replacement.ID.String(), newSecret),
		ExpiresAt: replacement.ExpiresAt,
	}

	// Written BEFORE the commit on purpose. The commit is what releases the row
	// lock that concurrent replays are queued on, so a replay can be reading
	// this key microseconds later — if the write happened after the commit, the
	// racer this feature exists for could still lose and cascade the session.
	s.rememberReplacement(ctx, row.TokenHash, replayCacheEntry{
		Token:     rotated.Token,
		ExpiresAt: rotated.ExpiresAt,
	})

	if commitErr := tx.Commit().Error; commitErr != nil {
		// The rotation never happened; retract the promise we just made.
		s.forgetReplacement(ctx, row.TokenHash)
		return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err:      commitErr,
			Metadata: map[string]string{"function": "Rotate", "action": "committing rotation"},
		})
	}

	return rotated, nil
}

// Revoke ends one session. It runs the same full validation as Rotate — id
// lookup AND secret comparison — so holding only the id half (far likelier to
// leak, e.g. into a log) is not enough to end someone else's session.
// Every failure is silent: logout must never block a client from clearing its
// own local state, and there is nothing useful to tell the caller.
func (s *refreshTokenService) Revoke(ctx context.Context, presented string) error {
	id, secret, parseErr := lib.ParseRefreshToken(presented)
	if parseErr != nil {
		return nil
	}

	tx := s.appCtx.DB.Begin()
	if tx.Error != nil {
		return pkg.InternalServerError(tx.Error.Error(), &pkg.RentLoopErrorParams{
			Err:      tx.Error,
			Metadata: map[string]string{"function": "Revoke", "action": "beginning transaction"},
		})
	}
	txCtx := lib.WithTransaction(ctx, tx)

	row, err := s.repo.GetByIDForUpdate(txCtx, id)
	if err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "Revoke", "action": "locking refresh token"},
		})
	}

	if !lib.RefreshTokenSecretMatches(secret, row.TokenHash) || row.RevokedAt != nil {
		tx.Rollback()
		return nil
	}

	now := time.Now()
	row.RevokedAt = &now
	if updateErr := s.repo.Update(txCtx, row); updateErr != nil {
		tx.Rollback()
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "Revoke", "action": "revoking refresh token"},
		})
	}

	if commitErr := tx.Commit().Error; commitErr != nil {
		return pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err:      commitErr,
			Metadata: map[string]string{"function": "Revoke", "action": "committing revocation"},
		})
	}

	return nil
}
