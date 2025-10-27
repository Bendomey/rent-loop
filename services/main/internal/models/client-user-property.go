package models

// ClientUserProperty represents a client user with property management role in the system
type ClientUserProperty struct {
	BaseModelSoftDelete

	PropertyID string `gorm:"not null;index;"`
	Property   Property

	ClientUserID string `gorm:"not null;index;"`
	ClientUser   ClientUser

	Role string `gorm:"not null;"` // MANAGER | STAFF

	CreatedByID *string
	CreatedBy   *ClientUser
}
