package repository

import (
	"context"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type AnnouncementRepository interface {
	Create(ctx context.Context, a *models.Announcement) error
	GetByIDWithPopulate(ctx context.Context, query GetAnnouncementQuery) (*models.Announcement, error)
	List(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters ListAnnouncementsFilter,
	) (*[]models.Announcement, error)
	Count(ctx context.Context, filterQuery lib.FilterQuery, filters ListAnnouncementsFilter) (int64, error)
	Update(ctx context.Context, a *models.Announcement) error
	Delete(ctx context.Context, id string) error
	ListScheduledDue(ctx context.Context) (*[]models.Announcement, error)
	ListExpiredDue(ctx context.Context) (*[]models.Announcement, error)
	CreateRead(ctx context.Context, read *models.AnnouncementRead) error
	HasRead(ctx context.Context, announcementID, tenantAccountID string) (bool, error)
}

type announcementRepository struct {
	DB *gorm.DB
}

func NewAnnouncementRepository(DB *gorm.DB) AnnouncementRepository {
	return &announcementRepository{DB}
}

type GetAnnouncementQuery struct {
	ID       string
	Populate *[]string
}

func (r *announcementRepository) Create(ctx context.Context, a *models.Announcement) error {
	return r.DB.WithContext(ctx).Create(a).Error
}

func (r *announcementRepository) GetByIDWithPopulate(
	ctx context.Context,
	query GetAnnouncementQuery,
) (*models.Announcement, error) {
	var announcement models.Announcement
	db := r.DB.WithContext(ctx).Where("id = ?", query.ID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&announcement)
	if result.Error != nil {
		return nil, result.Error
	}
	return &announcement, nil
}

type TenantAnnouncementFilter struct {
	UnitID     string
	BlockID    string
	PropertyID string
	ClientID   string
}

type ListAnnouncementsFilter struct {
	ClientID     *string
	PropertyID   *string
	Status       *string
	Type         *string
	TenantFilter *TenantAnnouncementFilter
}

func (r *announcementRepository) List(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListAnnouncementsFilter,
) (*[]models.Announcement, error) {
	var announcements []models.Announcement

	db := r.DB.WithContext(ctx).
		Scopes(
			DateRangeScope("announcements", filterQuery.DateRange),
			SearchScope("announcements", filterQuery.Search),
			announcementClientIDScope(filters.ClientID),
			announcementPropertyIDScope(filters.PropertyID),
			announcementStatusScope(filters.Status),
			announcementTypeScope(filters.Type),
			announcementTenantScope(filters.TenantFilter),
			PaginationScope(filterQuery.Page, filterQuery.PageSize),
			OrderScope("announcements", filterQuery.OrderBy, filterQuery.Order),
		)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	result := db.Find(&announcements)
	if result.Error != nil {
		return nil, result.Error
	}
	return &announcements, nil
}

func (r *announcementRepository) Count(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListAnnouncementsFilter,
) (int64, error) {
	var count int64

	result := r.DB.WithContext(ctx).
		Model(&models.Announcement{}).
		Scopes(
			DateRangeScope("announcements", filterQuery.DateRange),
			SearchScope("announcements", filterQuery.Search),
			announcementClientIDScope(filters.ClientID),
			announcementPropertyIDScope(filters.PropertyID),
			announcementStatusScope(filters.Status),
			announcementTypeScope(filters.Type),
			announcementTenantScope(filters.TenantFilter),
		).
		Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}
	return count, nil
}

func (r *announcementRepository) Update(ctx context.Context, a *models.Announcement) error {
	return r.DB.WithContext(ctx).Save(a).Error
}

func (r *announcementRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Where("id = ?", id).Delete(&models.Announcement{}).Error
}

func (r *announcementRepository) ListScheduledDue(ctx context.Context) (*[]models.Announcement, error) {
	var announcements []models.Announcement
	result := r.DB.WithContext(ctx).
		Where("status = ? AND scheduled_at <= ?", "SCHEDULED", time.Now()).
		Find(&announcements)
	if result.Error != nil {
		return nil, result.Error
	}
	return &announcements, nil
}

func (r *announcementRepository) ListExpiredDue(ctx context.Context) (*[]models.Announcement, error) {
	var announcements []models.Announcement
	result := r.DB.WithContext(ctx).
		Where("status = ? AND expires_at < ?", "PUBLISHED", time.Now()).
		Find(&announcements)
	if result.Error != nil {
		return nil, result.Error
	}
	return &announcements, nil
}

func (r *announcementRepository) CreateRead(ctx context.Context, read *models.AnnouncementRead) error {
	return r.DB.WithContext(ctx).Create(read).Error
}

func (r *announcementRepository) HasRead(ctx context.Context, announcementID, tenantAccountID string) (bool, error) {
	var count int64
	result := r.DB.WithContext(ctx).
		Model(&models.AnnouncementRead{}).
		Where("announcement_id = ? AND tenant_account_id = ?", announcementID, tenantAccountID).
		Count(&count)
	if result.Error != nil {
		return false, result.Error
	}
	return count > 0, nil
}

// Scopes

func announcementClientIDScope(clientID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if clientID == nil {
			return db
		}
		return db.Where("announcements.client_id = ?", *clientID)
	}
}

func announcementPropertyIDScope(propertyID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyID == nil {
			return db
		}
		return db.Where("announcements.property_id = ?", *propertyID)
	}
}

func announcementStatusScope(status *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if status == nil {
			return db
		}
		return db.Where("announcements.status = ?", *status)
	}
}

func announcementTypeScope(announcementType *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if announcementType == nil {
			return db
		}
		return db.Where("announcements.type = ?", *announcementType)
	}
}

// announcementTenantScope filters announcements visible to a tenant based on their unit context.
// An announcement is visible if ANY of the following match (in order of specificity):
//  1. Directly targeted: target_unit_ids contains the tenant's unit ID
//  2. Block-targeted: property_block_id matches and no specific units are targeted
//  3. Property-targeted: property_id matches, no block, and no specific units targeted
//  4. Broadcast: no property_id, no block, and no specific units targeted (all client tenants)
//
// All cases are also scoped to the same client_id.
// Expired announcements (expires_at <= NOW()) are always excluded regardless of status,
// so tenants never see stale content even if the expiry cron hasn't run yet.
func announcementTenantScope(f *TenantAnnouncementFilter) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if f == nil {
			return db
		}
		return db.Where(
			"announcements.client_id = ? AND (announcements.expires_at IS NULL OR announcements.expires_at > NOW()) AND ("+
				"announcements.target_unit_ids @> ARRAY[?]::text[] OR "+
				"(announcements.property_block_id = ? AND cardinality(announcements.target_unit_ids) = 0) OR "+
				"(announcements.property_id = ? AND announcements.property_block_id IS NULL AND cardinality(announcements.target_unit_ids) = 0) OR "+
				"(announcements.property_id IS NULL AND announcements.property_block_id IS NULL AND cardinality(announcements.target_unit_ids) = 0)"+
				")",
			f.ClientID,
			f.UnitID,
			f.BlockID,
			f.PropertyID,
		)
	}
}
