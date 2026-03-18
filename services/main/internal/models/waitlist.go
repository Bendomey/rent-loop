package models

type Waitlist struct {
	BaseModel
	FullName    string `gorm:"not null"`
	PhoneNumber string `gorm:"not null"`
	Email       *string
}
