package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type NotificationRepository interface {
	// Create persists a new Notification record.
	Create(ctx context.Context, n *models.Notification) error
	// CreateDelivery persists a new NotificationDelivery record.
	CreateDelivery(ctx context.Context, d *models.NotificationDelivery) error
	// UpdateDelivery saves delivery status changes (status, attempts, sent_at, etc.).
	UpdateDelivery(ctx context.Context, d *models.NotificationDelivery) error
	// ListInApp returns IN_APP notifications for a recipient, newest first, paginated.
	ListInApp(
		ctx context.Context,
		recipientID, recipientType string,
		page, pageSize int,
	) ([]*models.Notification, int64, error)
	// MarkAsRead sets is_read=true and read_at=NOW() for one notification, verifying ownership.
	// Returns gorm.ErrRecordNotFound if the notification does not belong to the recipient.
	MarkAsRead(ctx context.Context, id, recipientID string) error
	// MarkAllAsRead marks every unread IN_APP notification as read for a recipient.
	MarkAllAsRead(ctx context.Context, recipientID, recipientType string) error
	// GetUnreadCount returns the count of unread IN_APP notifications for a recipient.
	GetUnreadCount(ctx context.Context, recipientID, recipientType string) (int64, error)
}

type notificationRepository struct {
	DB *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{DB: db}
}

func (r *notificationRepository) Create(ctx context.Context, n *models.Notification) error {
	return r.DB.WithContext(ctx).Create(n).Error
}

func (r *notificationRepository) CreateDelivery(ctx context.Context, d *models.NotificationDelivery) error {
	return r.DB.WithContext(ctx).Create(d).Error
}

func (r *notificationRepository) UpdateDelivery(ctx context.Context, d *models.NotificationDelivery) error {
	return r.DB.WithContext(ctx).Save(d).Error
}

func (r *notificationRepository) ListInApp(
	ctx context.Context,
	recipientID, recipientType string,
	page, pageSize int,
) ([]*models.Notification, int64, error) {
	var notifications []*models.Notification
	var total int64

	query := r.DB.WithContext(ctx).
		Model(&models.Notification{}).
		Where("recipient_id = ? AND recipient_type = ? AND visibility = 'IN_APP'", recipientID, recipientType)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&notifications).Error; err != nil {
		return nil, 0, err
	}

	return notifications, total, nil
}

func (r *notificationRepository) MarkAsRead(ctx context.Context, id, recipientID string) error {
	result := r.DB.WithContext(ctx).
		Model(&models.Notification{}).
		Where("id = ? AND recipient_id = ? AND read_at IS NULL", id, recipientID).
		Update("read_at", gorm.Expr("NOW()"))
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *notificationRepository) MarkAllAsRead(ctx context.Context, recipientID, recipientType string) error {
	return r.DB.WithContext(ctx).
		Model(&models.Notification{}).
		Where("recipient_id = ? AND recipient_type = ? AND visibility = 'IN_APP' AND read_at IS NULL", recipientID, recipientType).
		Update("read_at", gorm.Expr("NOW()")).Error
}

func (r *notificationRepository) GetUnreadCount(ctx context.Context, recipientID, recipientType string) (int64, error) {
	var count int64
	err := r.DB.WithContext(ctx).
		Model(&models.Notification{}).
		Where("recipient_id = ? AND recipient_type = ? AND visibility = 'IN_APP' AND read_at IS NULL", recipientID, recipientType).
		Count(&count).Error
	return count, err
}
