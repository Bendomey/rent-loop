package models

// ClientUserProperty represents a client user with property management role in the system
type ClientUserProperty struct {
	BaseModelSoftDelete

	PropertyID string   `json:"propertyId" gorm:"not null;index;"`
	Property   Property `json:"property"   gorm:"foreignKey:PropertyID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	ClientUserID string     `json:"clientUserId" gorm:"not null;index;"`
	ClientUser   ClientUser `json:"clientUser"   gorm:"foreignKey:ClientUserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	Role string `json:"role" gorm:"not null;"` // MANAGER | STAFF

	CreatedByID *string     `json:"createdById"`
	CreatedBy   *ClientUser `json:"createdBy"`
}
