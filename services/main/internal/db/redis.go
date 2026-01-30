package db

import (
	"context"
	"strconv"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/config"
	"github.com/redis/go-redis/v9"
	log "github.com/sirupsen/logrus"
)

func ConnectRedis(cfg config.Config) (*redis.Client, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	db, convErr := strconv.Atoi(cfg.RedisDB.DB)
	if convErr != nil {
		return nil, convErr
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisDB.Address,
		Password: cfg.RedisDB.Password,
		DB:       db,
	})

	pong, err := rdb.Ping(ctx).Result()
	if err != nil {
		return nil, err
	}

	log.Infoln("Connected to Redis:", pong)
	return rdb, nil
}
