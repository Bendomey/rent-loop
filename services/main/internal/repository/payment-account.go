package repository

import (
	"context"
	"slices"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type PaymentAccountRepository interface {
	Create(context context.Context, paymentAccount *models.PaymentAccount) error
	GetByID(context context.Context, query GetPaymentAccountQuery) (*models.PaymentAccount, error)
	List(context context.Context, filterQuery ListPaymentAccountsFilter) (*[]models.PaymentAccount, error)
	Count(context context.Context, filterQuery ListPaymentAccountsFilter) (int64, error)
	Update(context context.Context, paymentAccount *models.PaymentAccount) error
	Delete(context context.Context, paymentAccountID string) error
	GetByQuery(context context.Context, query map[string]any) (*models.PaymentAccount, error)
	UnsetDefaultForClient(context context.Context, clientID string, excludeID *string) error
}

type paymentAccountRepository struct {
	DB *gorm.DB
}

func NewPaymentAccountRepository(DB *gorm.DB) PaymentAccountRepository {
	return &paymentAccountRepository{DB}
}

func (r *paymentAccountRepository) Create(ctx context.Context, paymentAccount *models.PaymentAccount) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Create(paymentAccount).Error
}

type GetPaymentAccountQuery struct {
	ID       string
	Populate *[]string
}

func (r *paymentAccountRepository) GetByID(
	ctx context.Context,
	query GetPaymentAccountQuery,
) (*models.PaymentAccount, error) {
	var paymentAccount models.PaymentAccount
	db := r.DB.WithContext(ctx).Where("id = ?", query.ID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&paymentAccount)

	if result.Error != nil {
		return nil, result.Error
	}

	return &paymentAccount, nil
}

type ListPaymentAccountsFilter struct {
	lib.FilterQuery
	ClientID   *string
	OwnerTypes *[]string
	Rail       *string
	Status     *string
	Provider   *string
	IsDefault  *bool
	IDs        *[]string
}

func (r *paymentAccountRepository) List(
	ctx context.Context,
	filterQuery ListPaymentAccountsFilter,
) (*[]models.PaymentAccount, error) {
	var paymentAccounts []models.PaymentAccount

	db := r.DB.WithContext(ctx).Scopes(
		IDsFilterScope("invoices", filterQuery.IDs),
		paymentAccountClientFilterScope(filterQuery.ClientID, filterQuery.OwnerTypes),
		paymentAccountOwnerTypesScope(filterQuery.OwnerTypes),
		paymentAccountRailScope(filterQuery.Rail),
		paymentAccountStatusScope(filterQuery.Status),
		paymentAccountProviderScope(filterQuery.Provider),
		paymentAccountIsDefaultScope(filterQuery.IsDefault),
		DateRangeScope("payment_accounts", filterQuery.DateRange),

		PaginationScope(filterQuery.Page, filterQuery.PageSize),
		OrderScope("payment_accounts", filterQuery.OrderBy, filterQuery.Order),
	)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}
	results := db.Find(&paymentAccounts)

	if results.Error != nil {
		return nil, results.Error
	}
	return &paymentAccounts, nil
}

func (r *paymentAccountRepository) Count(
	ctx context.Context,
	filterQuery ListPaymentAccountsFilter,
) (int64, error) {
	var count int64

	result := r.DB.WithContext(ctx).
		Model(&models.PaymentAccount{}).
		Scopes(
			IDsFilterScope("invoices", filterQuery.IDs),
			paymentAccountClientFilterScope(filterQuery.ClientID, filterQuery.OwnerTypes),
			paymentAccountOwnerTypesScope(filterQuery.OwnerTypes),
			paymentAccountRailScope(filterQuery.Rail),
			paymentAccountStatusScope(filterQuery.Status),
			paymentAccountProviderScope(filterQuery.Provider),
			paymentAccountIsDefaultScope(filterQuery.IsDefault),
			DateRangeScope("payment_accounts", filterQuery.DateRange),
		).Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func paymentAccountClientFilterScope(clientID *string, ownerTypes *[]string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if clientID == nil {
			return db
		}

		if ownerTypes != nil && slices.Contains(*ownerTypes, "SYSTEM") {
			return db.Where("(payment_accounts.client_id = ? OR payment_accounts.client_id IS NULL)", *clientID)
		}

		return db.Where("payment_accounts.client_id = ?", *clientID)
	}
}

func paymentAccountOwnerTypesScope(ownerTypes *[]string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if ownerTypes == nil || len(*ownerTypes) == 0 {
			return db
		}
		return db.Where("payment_accounts.owner_type IN ?", *ownerTypes)
	}
}

func paymentAccountRailScope(rail *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if rail == nil {
			return db
		}
		return db.Where("payment_accounts.rail = ?", *rail)
	}
}

func paymentAccountStatusScope(status *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if status == nil {
			return db
		}
		return db.Where("payment_accounts.status = ?", *status)
	}
}

func paymentAccountProviderScope(provider *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if provider == nil {
			return db
		}
		return db.Where("payment_accounts.provider = ?", *provider)
	}
}

func paymentAccountIsDefaultScope(isDefault *bool) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if isDefault == nil {
			return db
		}
		return db.Where("payment_accounts.is_default = ?", *isDefault)
	}
}

func (r *paymentAccountRepository) Update(ctx context.Context, paymentAccount *models.PaymentAccount) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Save(paymentAccount).Error
}

func (r *paymentAccountRepository) Delete(ctx context.Context, paymentAccountID string) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Where("id = ?", paymentAccountID).Delete(&models.PaymentAccount{}).Error
}

func (r *paymentAccountRepository) GetByQuery(
	ctx context.Context,
	query map[string]any,
) (*models.PaymentAccount, error) {
	var paymentAccount models.PaymentAccount

	result := r.DB.WithContext(ctx).Where(query).First(&paymentAccount)
	if result.Error != nil {
		return nil, result.Error
	}

	return &paymentAccount, nil
}

func (r *paymentAccountRepository) UnsetDefaultForClient(
	ctx context.Context,
	clientID string,
	excludeID *string,
) error {
	db := lib.ResolveDB(ctx, r.DB)

	query := db.WithContext(ctx).
		Model(&models.PaymentAccount{}).
		Where("client_id = ? AND is_default = ?", clientID, true)

	if excludeID != nil {
		query = query.Where("id != ?", *excludeID)
	}

	return query.Update("is_default", false).Error
}
