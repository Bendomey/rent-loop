package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ExchangeRateRepository interface {
	BulkUpsert(ctx context.Context, rates []models.ExchangeRate) error
}

type exchangeRateRepository struct {
	db *gorm.DB
}

func NewExchangeRateRepository(db *gorm.DB) ExchangeRateRepository {
	return &exchangeRateRepository{db: db}
}

func (r *exchangeRateRepository) BulkUpsert(ctx context.Context, rates []models.ExchangeRate) error {
	if len(rates) == 0 {
		return nil
	}

	db := lib.ResolveDB(ctx, r.db)
	return db.
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "base_currency"}, {Name: "quote_currency"}, {Name: "effective_date"}},
			DoUpdates: clause.AssignmentColumns([]string{"rate", "updated_at"}),
		}).
		Create(&rates).Error
}
