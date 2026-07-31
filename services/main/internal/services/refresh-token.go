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
	"gorm.io/datatypes"
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
	// Metadata is the client's self-description of the device starting this
	// session — see lib.SessionDeviceInfo. Merged with User-Agent parsing and
	// promoted onto the session's display columns.
	Metadata *datatypes.JSON
}

type IssuedRefreshToken struct {
	Token     string
	ExpiresAt time.Time
	SessionID string
}

// RotateRefreshTokenInput carries the request's network identity so the
// session's last-seen IP and User-Agent advance with use. Without these the
// sessions list would show where a session started rather than where it is
// now, which is the opposite of what "sign out anything you don't recognise"
// needs.
type RotateRefreshTokenInput struct {
	Presented string
	UserAgent *string
	IPAddress *string
	// Metadata is optional on refresh. Location is client-reported, so it can
	// only stay current if the client resends it — a session whose place was
	// frozen at login would show where it started rather than where it is,
	// which is the opposite of what the sessions screen is for. Clients that
	// send nothing keep whatever was recorded last.
	Metadata *datatypes.JSON
}

type RotatedRefreshToken struct {
	UserID    string
	SessionID string
	Token     string
	ExpiresAt time.Time
}

type RefreshTokenService interface {
	Issue(ctx context.Context, input IssueRefreshTokenInput) (*IssuedRefreshToken, error)
	Rotate(ctx context.Context, input RotateRefreshTokenInput) (*RotatedRefreshToken, error)
	Revoke(ctx context.Context, presented string) error
	TTL() time.Duration
}

type refreshTokenService struct {
	appCtx      pkg.AppContext
	repo        repository.RefreshTokenRepository
	sessionRepo repository.SessionRepository
}

func NewRefreshTokenService(
	appCtx pkg.AppContext,
	repo repository.RefreshTokenRepository,
	sessionRepo repository.SessionRepository,
) RefreshTokenService {
	return &refreshTokenService{appCtx, repo, sessionRepo}
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

// Issue starts a brand-new session and mints its first refresh token. It
// intentionally does not open its own transaction so it can join the caller's
// (login) if there is one.
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
	device := lib.ResolveDevice(input.Metadata, input.UserAgent)

	session := &models.Session{
		UserID:          input.UserID,
		LastUsedAt:      now,
		ExpiresAt:       now.Add(s.TTL()),
		IPAddress:       input.IPAddress,
		UserAgent:       input.UserAgent,
		DeviceName:      device.DeviceName,
		DeviceKind:      device.DeviceKind,
		OS:              device.OS,
		OSVersion:       device.OSVersion,
		ClientName:      device.ClientName,
		ClientVersion:   device.ClientVersion,
		Timezone:        device.Timezone,
		LocationCity:    device.LocationCity,
		LocationCountry: device.LocationCountry,
		LocationSource:  device.LocationSource,
		Metadata:        input.Metadata,
	}
	if createErr := s.sessionRepo.Create(ctx, session); createErr != nil {
		return nil, pkg.InternalServerError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err:      createErr,
			Metadata: map[string]string{"function": "Issue", "action": "creating session"},
		})
	}

	token := &models.RefreshToken{
		SessionID: session.ID.String(),
		TokenHash: lib.HashRefreshTokenSecret(secret),
	}
	if createErr := s.repo.Create(ctx, token); createErr != nil {
		return nil, pkg.InternalServerError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err:      createErr,
			Metadata: map[string]string{"function": "Issue", "action": "creating refresh token"},
		})
	}

	return &IssuedRefreshToken{
		Token:     lib.ComposeRefreshToken(token.ID.String(), secret),
		ExpiresAt: session.ExpiresAt,
		SessionID: session.ID.String(),
	}, nil
}

// killSession ends a session and every credential under it. Used by reuse
// detection, where the point is to evict whoever is holding the live token —
// not merely to reject the request that gave them away.
func (s *refreshTokenService) killSession(
	ctx context.Context,
	sessionID string,
	reason string,
	at time.Time,
) error {
	if _, err := s.repo.RevokeAllForSession(ctx, sessionID, at); err != nil {
		return err
	}
	return s.sessionRepo.Revoke(ctx, sessionID, reason, at)
}

// Rotate validates a presented token and swaps it for a fresh one. The whole
// sequence runs in one transaction holding a row lock, so two concurrent
// refreshes of the same token cannot both succeed — the loser blocks, then
// sees revoked_at already set and falls into the replay path.
func (s *refreshTokenService) Rotate(
	ctx context.Context,
	input RotateRefreshTokenInput,
) (*RotatedRefreshToken, error) {
	id, secret, parseErr := lib.ParseRefreshToken(input.Presented)
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
			session, sessionErr := s.sessionRepo.GetByID(ctx, row.SessionID)
			if sessionErr != nil {
				return nil, invalidRefreshToken()
			}
			return &RotatedRefreshToken{
				UserID:    session.UserID,
				SessionID: session.ID.String(),
				Token:     entry.Token,
				ExpiresAt: entry.ExpiresAt,
			}, nil
		}

		// Outside the window: a genuine replay. End the whole session, not just
		// this credential — the attacker is holding the live one.
		if cascadeErr := s.killSession(
			txCtx, row.SessionID, models.SessionRevokedByReuse, now,
		); cascadeErr != nil {
			tx.Rollback()
			return nil, pkg.InternalServerError(cascadeErr.Error(), &pkg.RentLoopErrorParams{
				Err: cascadeErr,
				Metadata: map[string]string{
					"function": "Rotate",
					"action":   "revoking compromised session",
				},
			})
		}
		if commitErr := tx.Commit().Error; commitErr != nil {
			return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
				Err: commitErr,
				Metadata: map[string]string{
					"function": "Rotate",
					"action":   "committing session revocation",
				},
			})
		}
		return nil, invalidRefreshToken()
	}

	session, sessionErr := s.sessionRepo.GetByID(txCtx, row.SessionID)
	if sessionErr != nil {
		tx.Rollback()
		if errors.Is(sessionErr, gorm.ErrRecordNotFound) {
			return nil, invalidRefreshToken()
		}
		return nil, pkg.InternalServerError(sessionErr.Error(), &pkg.RentLoopErrorParams{
			Err:      sessionErr,
			Metadata: map[string]string{"function": "Rotate", "action": "loading session"},
		})
	}

	// The session was signed out from another device, or slid past its window.
	// Neither is a security signal — no cascade, the session is simply over.
	if !session.IsActive(now) {
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
		SessionID: session.ID.String(),
		TokenHash: lib.HashRefreshTokenSecret(newSecret),
	}
	if createErr := s.repo.Create(txCtx, replacement); createErr != nil {
		tx.Rollback()
		return nil, pkg.InternalServerError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err:      createErr,
			Metadata: map[string]string{"function": "Rotate", "action": "creating replacement token"},
		})
	}

	row.RevokedAt = &now
	if updateErr := s.repo.Update(txCtx, row); updateErr != nil {
		tx.Rollback()
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "Rotate", "action": "retiring presented token"},
		})
	}

	// The session row itself is updated in place — this is the whole point of
	// splitting it out. Expiry slides, activity advances, and the network
	// identity catches up with wherever the client is now.
	//
	// Location is not derived here — it is whatever the client reported, and
	// only changes when the client sends fresh metadata.
	activity := repository.SessionActivity{
		LastUsedAt: now,
		ExpiresAt:  now.Add(s.TTL()),
		IPAddress:  input.IPAddress,
		UserAgent:  input.UserAgent,
	}
	if input.Metadata != nil {
		device := lib.ResolveDevice(input.Metadata, input.UserAgent)
		activity.Timezone = device.Timezone
		activity.LocationCity = device.LocationCity
		activity.LocationCountry = device.LocationCountry
		activity.LocationSource = device.LocationSource
	}

	if touchErr := s.sessionRepo.TouchActivity(txCtx, session.ID.String(), activity); touchErr != nil {
		tx.Rollback()
		return nil, pkg.InternalServerError(touchErr.Error(), &pkg.RentLoopErrorParams{
			Err:      touchErr,
			Metadata: map[string]string{"function": "Rotate", "action": "updating session activity"},
		})
	}

	rotated := &RotatedRefreshToken{
		UserID:    session.UserID,
		SessionID: session.ID.String(),
		Token:     lib.ComposeRefreshToken(replacement.ID.String(), newSecret),
		ExpiresAt: now.Add(s.TTL()),
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

// Revoke ends the session behind a presented token. It runs the same full
// validation as Rotate — id lookup AND secret comparison — so holding only the
// id half (far likelier to leak, e.g. into a log) is not enough to end someone
// else's session. Every failure is silent: logout must never block a client
// from clearing its own local state, and there is nothing useful to tell the
// caller.
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
	if killErr := s.killSession(txCtx, row.SessionID, models.SessionRevokedByLogout, now); killErr != nil {
		tx.Rollback()
		return pkg.InternalServerError(killErr.Error(), &pkg.RentLoopErrorParams{
			Err:      killErr,
			Metadata: map[string]string{"function": "Revoke", "action": "revoking session"},
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
