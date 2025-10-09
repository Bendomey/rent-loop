package models

// RealEstateManager represents a real estate manager user in the system
type RealEstateManager struct {
	BaseModelSoftDelete
	Name     string `json:"name" gorm:"not null;"`
	Email    string `json:"email" gorm:"not null;uniqueIndex"`
	Password string `json:"password" gorm:"not null"`
}
