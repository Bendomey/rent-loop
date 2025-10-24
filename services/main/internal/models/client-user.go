package models

import (
	"errors"

	"github.com/Bendomey/goutilities/pkg/hashpassword"
	"gorm.io/gorm"
)

// ClientUser represents a client user in the system
type ClientUser struct {
	BaseModelSoftDelete
	ClientID string `json:"clientId" gorm:"not null;index;"`
	Client   Client `json:"client" gorm:"foreignKey:ClientID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	Name        string `json:"name" gorm:"not null;"`
	PhoneNumber string `json:"phoneNumber" gorm:"not null;"`
	Email       string `json:"email" gorm:"not null;uniqueIndex"`
	Password    string `json:"password" gorm:"not null"`

	Role string `json:"role" gorm:"not null;"` // OWNER | ADMIN | STAFF

	CreatorID *string     `json:"creatorId"`                           // Use CreatorID instead of CreatedByID
	Creator   *ClientUser `json:"creator" gorm:"foreignKey:CreatorID"` // Update foreignKey tag
	// CreatedByID *string     `json:"createdById"`
	// CreatedBy   *ClientUser `json:"createdBy"`

	Status string `json:"status" gorm:"not null;index;default:'ClientUser.Status.Active'"` // ClientUser.Status.Active | ClientUser.Status.Inactive

	StatusUpdatedById *string     `json:"statusUpdatedById"`
	StatusUpdatedBy   *ClientUser `json:"statusUpdatedBy" gorm:"foreignKey:StatusUpdatedById;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
}

// BeforeCreate hook is called before the data is persisted to db
func (clientUser *ClientUser) BeforeCreate(tx *gorm.DB) (err error) {
	// hashes password
	hashed, err := hashpassword.HashPassword(clientUser.Password)
	clientUser.Password = hashed
	if err != nil {
		err = errors.New("CannotHashClientUserPassword")
	}
	return
}

// BeforeDelete hook is called before the data is delete so that we dont delete super client user
func (admin *ClientUser) BeforeDelete(tx *gorm.DB) (err error) {
	if admin.CreatorID == nil {
		err = errors.New("CannotDeleteSuperUserForClient")
	}
	return
}
