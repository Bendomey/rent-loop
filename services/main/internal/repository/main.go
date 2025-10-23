package repository

import "gorm.io/gorm"

type Repository struct {
	AdminRepository             AdminRepository
	ClientApplicationRepository ClientApplicationRepository
	ClientUserRepository        ClientUserRepository
	ClientRepository            ClientRepository
}

func NewRepository(db *gorm.DB) Repository {
	adminRepository := NewAdminRepository(db)
	clientApplicationRepository := NewClientApplicationRepository(db)
	clientUserRepository := NewClientUserRepository(db)
	clientRepository := NewClientRepository(db)

	return Repository{
		AdminRepository:             adminRepository,
		ClientApplicationRepository: clientApplicationRepository,
		ClientUserRepository:        clientUserRepository,
		ClientRepository:            clientRepository,
	}
}
