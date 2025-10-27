package models

import (
	"errors"

	"github.com/Bendomey/goutilities/pkg/hashpassword"
	"gorm.io/gorm"
)

// Admin represents a rentlopp admin user in the system
type Admin struct {
	BaseModelSoftDelete
	Name        string `gorm:"not null;"`
	Email       string `gorm:"not null;uniqueIndex"`
	Password    string `gorm:"not null"`
	CreatedByID *string
	CreatedBy   *Admin
}

// BeforeCreate hook is called before the data is persisted to db
func (admin *Admin) BeforeCreate(tx *gorm.DB) (err error) {
	// hashes password
	hashed, err := hashpassword.HashPassword(admin.Password)
	admin.Password = hashed
	if err != nil {
		err = errors.New("CannotHashAdminPassword")
	}
	return
}

// BeforeDelete hook is called before the data is delete so that we dont delete super admin
func (admin *Admin) BeforeDelete(tx *gorm.DB) (err error) {
	if admin.CreatedByID == nil {
		err = errors.New("CannotDeleteSuperAdmin")
	}
	return
}
