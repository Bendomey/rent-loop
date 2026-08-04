package services

import (
	"context"
	"errors"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"gorm.io/gorm"
)

type SessionService interface {
	// ListActive returns every session the user can still sign in with.
	ListActive(ctx context.Context, userID string) ([]models.Session, error)
	// Revoke ends one session. Scoped to the caller: a session belonging to
	// someone else reports NotFound rather than Forbidden, so this cannot be
	// used to probe which session ids exist.
	Revoke(ctx context.Context, userID string, sessionID string) error
	// RevokeOthers ends every session for the user except the one making the
	// request, returning how many it ended.
	RevokeOthers(ctx context.Context, userID string, currentSessionID string) (int64, error)
}

type sessionService struct {
	appCtx           pkg.AppContext
	repo             repository.SessionRepository
	refreshTokenRepo repository.RefreshTokenRepository
}

func NewSessionService(
	appCtx pkg.AppContext,
	repo repository.SessionRepository,
	refreshTokenRepo repository.RefreshTokenRepository,
) SessionService {
	return &sessionService{appCtx, repo, refreshTokenRepo}
}

func (s *sessionService) ListActive(
	ctx context.Context,
	userID string,
) ([]models.Session, error) {
	sessions, err := s.repo.ListActiveForUser(ctx, userID)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ListActive", "action": "listing sessions"},
		})
	}
	return sessions, nil
}

func (s *sessionService) Revoke(ctx context.Context, userID string, sessionID string) error {
	session, err := s.repo.GetByID(ctx, sessionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("SessionNotFound", nil)
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "Revoke", "action": "loading session"},
		})
	}

	// Someone else's session is indistinguishable from one that doesn't exist.
	if session.UserID != userID {
		return pkg.NotFoundError("SessionNotFound", nil)
	}

	// Already revoked is a success, not an error — the caller wanted it gone
	// and it is gone.
	if session.RevokedAt != nil {
		return nil
	}

	now := time.Now()
	if revokeErr := s.revokeSessionAndTokens(
		ctx, sessionID, models.SessionRevokedByUser, now,
	); revokeErr != nil {
		return pkg.InternalServerError(revokeErr.Error(), &pkg.RentLoopErrorParams{
			Err:      revokeErr,
			Metadata: map[string]string{"function": "Revoke", "action": "revoking session"},
		})
	}
	return nil
}

func (s *sessionService) RevokeOthers(
	ctx context.Context,
	userID string,
	currentSessionID string,
) (int64, error) {
	now := time.Now()

	// Collect the doomed sessions first so their credentials can be retired
	// too — revoking the session alone would leave live refresh tokens that
	// resolve to a dead session.
	sessions, err := s.repo.ListActiveForUser(ctx, userID)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "RevokeOthers", "action": "listing sessions"},
		})
	}

	for _, session := range sessions {
		id := session.ID.String()
		if id == currentSessionID {
			continue
		}
		if _, tokenErr := s.refreshTokenRepo.RevokeAllForSession(ctx, id, now); tokenErr != nil {
			return 0, pkg.InternalServerError(tokenErr.Error(), &pkg.RentLoopErrorParams{
				Err: tokenErr,
				Metadata: map[string]string{
					"function": "RevokeOthers",
					"action":   "revoking session tokens",
				},
			})
		}
	}

	count, revokeErr := s.repo.RevokeAllForUserExcept(
		ctx, userID, currentSessionID, models.SessionRevokedBySignOutAll, now,
	)
	if revokeErr != nil {
		return 0, pkg.InternalServerError(revokeErr.Error(), &pkg.RentLoopErrorParams{
			Err:      revokeErr,
			Metadata: map[string]string{"function": "RevokeOthers", "action": "revoking sessions"},
		})
	}
	return count, nil
}

func (s *sessionService) revokeSessionAndTokens(
	ctx context.Context,
	sessionID string,
	reason string,
	at time.Time,
) error {
	if _, err := s.refreshTokenRepo.RevokeAllForSession(ctx, sessionID, at); err != nil {
		return err
	}
	return s.repo.Revoke(ctx, sessionID, reason, at)
}
