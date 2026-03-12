package queue

import (
	"fmt"

	"github.com/hibiken/asynq"
)

// Client wraps an asynq client and inspector.
// Feature-specific enqueue/cancel methods are defined in their own files (e.g. announcements.go).
type Client struct {
	c         *asynq.Client
	inspector *asynq.Inspector
}

func NewClient(redisURL string) (*Client, error) {
	opt, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		return nil, fmt.Errorf("queue: parse redis URI: %w", err)
	}
	return &Client{
		c:         asynq.NewClient(opt),
		inspector: asynq.NewInspector(opt),
	}, nil
}

func (c *Client) Close() error {
	return c.c.Close()
}
