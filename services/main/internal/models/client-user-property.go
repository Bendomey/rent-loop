package models

// ClientUserProperty represents a client user with property management role in the system
type ClientUserProperty struct {
	BaseModelSoftDelete

	PropertyID string   `gorm:"not null;index;"`
	Property   Property `gorm:"foreignKey:PropertyID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	ClientUserID string     `gorm:"not null;index;"`
	ClientUser   ClientUser `gorm:"foreignKey:ClientUserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	Role string `gorm:"not null;"` // MANAGER | STAFF

	CreatedByID *string
	CreatedBy   *ClientUser
}
