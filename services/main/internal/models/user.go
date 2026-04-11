package models

import (
	"errors"

	"github.com/Bendomey/goutilities/pkg/hashpassword"
	"github.com/getsentry/raven-go"
	"gorm.io/gorm"
)

type User struct {
	BaseModelSoftDelete
	Name        string `gorm:"not null"`
	Email       string `gorm:"not null;uniqueIndex"`
	PhoneNumber string `gorm:"not null"`
	Password    string `gorm:"not null"`

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
