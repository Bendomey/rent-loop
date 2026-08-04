package services

import (
	"context"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	log "github.com/sirupsen/logrus"
)

type ExchangeRateService interface {
	// SyncDailyRates fetches the latest USD-base rates from OpenExchangeRates
	// and upserts one row per supported currency for today's date.
	SyncDailyRates(ctx context.Context) error
}

type exchangeRateService struct {
	appCtx pkg.AppContext
	repo   repository.ExchangeRateRepository
}

func NewExchangeRateService(appCtx pkg.AppContext, repo repository.ExchangeRateRepository) ExchangeRateService {
	return &exchangeRateService{appCtx: appCtx, repo: repo}
}

func (s *exchangeRateService) SyncDailyRates(ctx context.Context) error {
	resp, err := s.appCtx.Clients.OpenExchangeRatesAPI.GetLatestRates(ctx)
	if err != nil {
		return err
	}

	today := time.Now().UTC().Truncate(24 * time.Hour)

	rates := make([]models.ExchangeRate, 0, len(lib.SupportedCurrencies))
	for _, currency := range lib.SupportedCurrencies {
		rate, ok := resp.Rates[currency]
		if !ok {
			log.WithField("currency", currency).Warn("[ExchangeRate] currency not found in OXR response, skipping")
			continue
		}
		rates = append(rates, models.ExchangeRate{
			BaseCurrency:  resp.Base,
			QuoteCurrency: currency,
			Rate:          rate,
			EffectiveDate: today,
		})
	}

	return s.repo.BulkUpsert(ctx, rates)
}
