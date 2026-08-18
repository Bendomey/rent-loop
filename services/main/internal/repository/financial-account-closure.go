package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type FinancialAccountClosureRepository interface {
	Create(ctx context.Context, closure *models.FinancialAccountClosure) error
	Update(ctx context.Context, closure *models.FinancialAccountClosure) error
	// GetByAccount returns the most recent closure row for an account, or a
	// gorm.ErrRecordNotFound if it has never been closed.
	GetByAccount(ctx context.Context, financialAccountID string) (*models.FinancialAccountClosure, error)
}

type financialAccountClosureRepository struct {
	DB *gorm.DB
}

func NewFinancialAccountClosureRepository(db *gorm.DB) FinancialAccountClosureRepository {
	return &financialAccountClosureRepository{DB: db}
}

func (r *financialAccountClosureRepository) Create(
	ctx context.Context,
	closure *models.FinancialAccountClosure,
) error {
	return lib.ResolveDB(ctx, r.DB).Create(closure).Error
}

func (r *financialAccountClosureRepository) Update(
	ctx context.Context,
	closure *models.FinancialAccountClosure,
) error {
	return lib.ResolveDB(ctx, r.DB).Save(closure).Error
}

func (r *financialAccountClosureRepository) GetByAccount(
	ctx context.Context,
	financialAccountID string,
) (*models.FinancialAccountClosure, error) {
	var closure models.FinancialAccountClosure

	err := lib.ResolveDB(ctx, r.DB).
		Where("financial_account_id = ?", financialAccountID).
		Order("closed_at DESC").
		First(&closure).Error
	if err != nil {
		return nil, err
	}

	return &closure, nil
}
