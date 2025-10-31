package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type ClientUserPropertyRepository interface {
	Create(context context.Context, clientUserProperty *models.ClientUserProperty) error
}

type clientUserPropertyRepository struct {
	DB *gorm.DB
}

func NewClientUserPropertyRepository(db *gorm.DB) ClientUserPropertyRepository {
	return &clientUserPropertyRepository{db}
}

func (r *clientUserPropertyRepository) Create(
	ctx context.Context,
	clientUserProperty *models.ClientUserProperty,
) error {
	var db *gorm.DB

	tx, txOk := lib.TransactionFromContext(ctx)
	db = tx

	if !txOk || tx == nil {
		db = r.DB
	}

	return db.WithContext(ctx).Create(clientUserProperty).Error
}
