package models

import (
	"errors"
	"time"

	"github.com/Bendomey/goutilities/pkg/hashpassword"
	"github.com/getsentry/raven-go"
	"gorm.io/gorm"
)

type User struct {
	BaseModelSoftDelete
	Name            string `gorm:"not null"`
	Email           string `gorm:"not null;uniqueIndex"`
	PhoneNumber     string `gorm:"not null"`
	Password        string `gorm:"not null"`
	ProfilePhotoUrl *string
	// Nil until the user sets a password of their own. Accounts are created with a
	// system-generated password, so nil means they are still using it.
	PasswordChangedAt *time.Time

	ClientUsers []ClientUser
}

func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	hashed, err := hashpassword.HashPassword(u.Password)
	u.Password = hashed
	if err != nil {
		raven.CaptureError(err, map[string]string{
			"function": "User.BeforeCreate",
			"action":   "hashing password",
		})
		err = errors.New("CannotHashUserPassword")
	}
	return
}
