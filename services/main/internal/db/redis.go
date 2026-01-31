package db

import (
	"context"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/config"
	"github.com/redis/go-redis/v9"
	log "github.com/sirupsen/logrus"
)

func ConnectRedis(cfg config.Config) (*redis.Client, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	opt, optErr := redis.ParseURL(cfg.RedisDB.Url)
	if optErr != nil {
		return nil, optErr
	}

	rdb := redis.NewClient(opt)

	pong, err := rdb.Ping(ctx).Result()
	if err != nil {
		return nil, err
	}

	log.Infoln("Connected to Redis:", pong)
	return rdb, nil
}
