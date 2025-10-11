package models

// ClientUser represents a client user in the system
type ClientUser struct {
	BaseModelSoftDelete
	ClientID string `json:"clientId" gorm:"not null;index;"`
	Client   Client `json:"client" gorm:"foreignKey:ClientID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	Name        string `json:"name" gorm:"not null;"`
	PhoneNumber string `json:"phoneNumber" gorm:"not null;"`
	Email       string `json:"email" gorm:"not null;uniqueIndex"`
	Password    string `json:"password" gorm:"not null"`

	Role string `json:"role" gorm:"not null;"` // OWNER | STAFF

	CreatedById *string     `json:"createdById"`
	CreatedBy   *ClientUser `json:"createdBy"`
}
