package repository

import "gorm.io/gorm"

type Repository struct {
	AdminRepository             AdminRepository
	ClientApplicationRepository ClientApplicationRepository
	ClientRepository            ClientRepository
}

func NewRepository(db *gorm.DB) Repository {
	adminRepository := NewAdminRepository(db)
	clientApplicationRepository := NewClientApplicationRepository(db)
	clientRepository := NewClientRepository(db)

	return Repository{
		AdminRepository:             adminRepository,
		ClientApplicationRepository: clientApplicationRepository,
		ClientRepository:            clientRepository,
	}
}
