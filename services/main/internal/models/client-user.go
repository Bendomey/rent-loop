package models

import (
	"errors"

	"gorm.io/gorm"
)

// ClientUser represents a membership between a User and a Client
type ClientUser struct {
	BaseModelSoftDelete
	UserID string `gorm:"index"`
	User   User

	ClientID string `gorm:"not null;index"`
	Client   Client

	Role string `json:"role" gorm:"not null;"` // OWNER | ADMIN | STAFF

	CreatedByID *string
	CreatedBy   *ClientUser

	Status string `gorm:"not null;index;default:'ClientUser.Status.Active'"` // ClientUser.Status.Active | ClientUser.Status.Inactive

	StatusUpdatedById *string
	StatusUpdatedBy   *ClientUser
}

// BeforeDelete hook prevents deletion of the owner (first) client user
func (cu *ClientUser) BeforeDelete(tx *gorm.DB) (err error) {
	if cu.CreatedByID == nil {
		err = errors.New("CannotDeleteSuperUserForClient")
	}
	return
}
