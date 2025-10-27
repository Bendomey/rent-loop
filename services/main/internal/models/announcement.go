package models

// Announcement represents an announcement in the system.
type Announcement struct {
	BaseModelSoftDelete
	Title       string `gorm:"not null;index;"`
	Content     string `gorm:"not null;"`
	CreatedById string `gorm:"not null;"`
	CreatedBy   ClientUser
}
