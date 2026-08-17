package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type PaymentAllocationRepository interface {
	CreateMany(ctx context.Context, allocations []models.PaymentAllocation) error
	ListByPayment(ctx context.Context, paymentID string) (*[]models.PaymentAllocation, error)
	// SumByPayment is how account credit is computed: credit is
	// SUM(payment.amount) - SUM(allocation.amount), so unallocated residue on
	// an existing payment IS the credit. There is no credit table to drift.
	SumByPayment(ctx context.Context, paymentID string) (int64, error)
	ListByAccount(ctx context.Context, financialAccountID string) (*[]models.PaymentAllocation, error)
	SumByAccount(ctx context.Context, financialAccountID string) (int64, error)
	DeleteByInvoiceLineItem(ctx context.Context, lineItemID string) error
}

type paymentAllocationRepository struct {
	DB *gorm.DB
}

func NewPaymentAllocationRepository(db *gorm.DB) PaymentAllocationRepository {
	return &paymentAllocationRepository{DB: db}
}

func (r *paymentAllocationRepository) CreateMany(
	ctx context.Context,
	allocations []models.PaymentAllocation,
) error {
	if len(allocations) == 0 {
		return nil
	}
	return lib.ResolveDB(ctx, r.DB).Create(&allocations).Error
}

func (r *paymentAllocationRepository) ListByPayment(
	ctx context.Context,
	paymentID string,
) (*[]models.PaymentAllocation, error) {
	var allocations []models.PaymentAllocation
	err := lib.ResolveDB(ctx, r.DB).
		Where("payment_allocations.payment_id = ?", paymentID).
		Find(&allocations).Error
	if err != nil {
		return nil, err
	}
	return &allocations, nil
}

func (r *paymentAllocationRepository) SumByPayment(ctx context.Context, paymentID string) (int64, error) {
	var total *int64
	err := lib.ResolveDB(ctx, r.DB).
		Model(&models.PaymentAllocation{}).
		Where("payment_allocations.payment_id = ?", paymentID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&total).Error
	if err != nil {
		return 0, err
	}
	if total == nil {
		return 0, nil
	}
	return *total, nil
}

func (r *paymentAllocationRepository) ListByAccount(
	ctx context.Context,
	financialAccountID string,
) (*[]models.PaymentAllocation, error) {
	var allocations []models.PaymentAllocation
	err := lib.ResolveDB(ctx, r.DB).
		Model(&models.PaymentAllocation{}).
		Joins("JOIN charge_instances ci ON ci.id = payment_allocations.charge_instance_id").
		Where("ci.financial_account_id = ?", financialAccountID).
		Where("payment_allocations.deleted_at IS NULL").
		Find(&allocations).Error
	if err != nil {
		return nil, err
	}
	return &allocations, nil
}

func (r *paymentAllocationRepository) SumByAccount(
	ctx context.Context,
	financialAccountID string,
) (int64, error) {
	var total *int64
	err := lib.ResolveDB(ctx, r.DB).
		Model(&models.PaymentAllocation{}).
		Joins("JOIN charge_instances ci ON ci.id = payment_allocations.charge_instance_id").
		Where("ci.financial_account_id = ?", financialAccountID).
		Where("payment_allocations.deleted_at IS NULL").
		Select("COALESCE(SUM(payment_allocations.amount), 0)").
		Scan(&total).Error
	if err != nil {
		return 0, err
	}
	if total == nil {
		return 0, nil
	}
	return *total, nil
}

func (r *paymentAllocationRepository) DeleteByInvoiceLineItem(
	ctx context.Context,
	lineItemID string,
) error {
	return lib.ResolveDB(ctx, r.DB).
		Where("payment_allocations.invoice_line_item_id = ?", lineItemID).
		Delete(&models.PaymentAllocation{}).Error
}
