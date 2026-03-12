package queue

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/hibiken/asynq"
	log "github.com/sirupsen/logrus"
)

// ─── Task types ───────────────────────────────────────────────────────────────

const (
	TypeAnnouncementPublish = "announcement:publish"
	TypeAnnouncementExpire  = "announcement:expire"
)

type AnnouncementPublishPayload struct {
	AnnouncementID string `json:"announcement_id"`
}

type AnnouncementExpirePayload struct {
	AnnouncementID string `json:"announcement_id"`
}

// ─── Deterministic task IDs ───────────────────────────────────────────────────

func publishTaskID(announcementID string) string {
	return TypeAnnouncementPublish + ":" + announcementID
}

func expireTaskID(announcementID string) string {
	return TypeAnnouncementExpire + ":" + announcementID
}

// ─── Client methods ───────────────────────────────────────────────────────────

func (c *Client) EnqueueAnnouncementPublish(ctx context.Context, announcementID string, at time.Time) error {
	payload, err := json.Marshal(AnnouncementPublishPayload{AnnouncementID: announcementID})
	if err != nil {
		return err
	}
	_, err = c.c.EnqueueContext(ctx,
		asynq.NewTask(TypeAnnouncementPublish, payload),
		asynq.ProcessAt(at),
		asynq.MaxRetry(3),
		asynq.TaskID(publishTaskID(announcementID)),
	)
	return err
}

func (c *Client) EnqueueAnnouncementExpire(ctx context.Context, announcementID string, at time.Time) error {
	payload, err := json.Marshal(AnnouncementExpirePayload{AnnouncementID: announcementID})
	if err != nil {
		return err
	}
	_, err = c.c.EnqueueContext(ctx,
		asynq.NewTask(TypeAnnouncementExpire, payload),
		asynq.ProcessAt(at),
		asynq.MaxRetry(3),
		asynq.TaskID(expireTaskID(announcementID)),
	)
	return err
}

// RescheduleAnnouncementExpire cancels the existing expire task (if any) and
// enqueues a new one at the given time. Safe to call even if no task exists yet.
func (c *Client) RescheduleAnnouncementExpire(ctx context.Context, announcementID string, at time.Time) error {
	if err := c.inspector.DeleteTask("default", expireTaskID(announcementID)); err != nil &&
		!errors.Is(err, asynq.ErrTaskNotFound) {
		return fmt.Errorf("queue: remove old expire task: %w", err)
	}
	return c.EnqueueAnnouncementExpire(ctx, announcementID, at)
}

// CancelAnnouncementPublish removes the pending scheduled publish task.
// Returns nil if the task is already gone (race-safe).
func (c *Client) CancelAnnouncementPublish(_ context.Context, announcementID string) error {
	err := c.inspector.DeleteTask("default", publishTaskID(announcementID))
	if err == nil || errors.Is(err, asynq.ErrTaskNotFound) {
		return nil
	}
	return fmt.Errorf("queue: cancel publish task: %w", err)
}

// ─── Worker handlers ──────────────────────────────────────────────────────────

// AnnouncementHandlers returns a HandlerRegistrar that wires up all announcement
// task handlers onto the serve mux.
func AnnouncementHandlers(svc services.AnnouncementService) HandlerRegistrar {
	return func(mux *asynq.ServeMux) {
		mux.HandleFunc(TypeAnnouncementPublish, handleAnnouncementPublish(svc))
		mux.HandleFunc(TypeAnnouncementExpire, handleAnnouncementExpire(svc))
	}
}

func handleAnnouncementPublish(svc services.AnnouncementService) asynq.HandlerFunc {
	return func(ctx context.Context, t *asynq.Task) error {
		var p AnnouncementPublishPayload
		if err := json.Unmarshal(t.Payload(), &p); err != nil {
			return fmt.Errorf("%w: %w", asynq.SkipRetry, err)
		}

		err := svc.Publish(ctx, p.AnnouncementID)
		if err == nil {
			return nil
		}

		var rlErr *pkg.IRentLoopError
		if errors.As(err, &rlErr) && (rlErr.Code == http.StatusNotFound || rlErr.Code == http.StatusBadRequest) {
			log.WithError(err).WithField("announcement_id", p.AnnouncementID).
				Warn("[Queue] skipping announcement publish — already handled or deleted")
			return nil
		}
		return err
	}
}

func handleAnnouncementExpire(svc services.AnnouncementService) asynq.HandlerFunc {
	return func(ctx context.Context, t *asynq.Task) error {
		var p AnnouncementExpirePayload
		if err := json.Unmarshal(t.Payload(), &p); err != nil {
			return fmt.Errorf("%w: %w", asynq.SkipRetry, err)
		}

		err := svc.Expire(ctx, p.AnnouncementID)
		if err == nil {
			return nil
		}

		var rlErr *pkg.IRentLoopError
		if errors.As(err, &rlErr) && (rlErr.Code == http.StatusNotFound || rlErr.Code == http.StatusBadRequest) {
			log.WithError(err).WithField("announcement_id", p.AnnouncementID).
				Warn("[Queue] skipping announcement expire — already handled or deleted")
			return nil
		}
		return err
	}
}
