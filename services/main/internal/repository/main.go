package repository

import "gorm.io/gorm"

type Repository struct {
	AdminRepository AdminRepository
}

func NewRepository(db *gorm.DB) Repository {

	adminRepository := NewAdminRepository(db)

	return Repository{
		AdminRepository: adminRepository,
	}
}
