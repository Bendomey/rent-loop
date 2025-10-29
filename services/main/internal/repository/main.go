package repository

import "gorm.io/gorm"

type Repository struct {
	AdminRepository             AdminRepository
	ClientApplicationRepository ClientApplicationRepository
	ClientUserRepository        ClientUserRepository
	ClientRepository            ClientRepository
	PropertyRepository          PropertyRepository
}

func NewRepository(db *gorm.DB) Repository {
	adminRepository := NewAdminRepository(db)
	clientApplicationRepository := NewClientApplicationRepository(db)
	clientUserRepository := NewClientUserRepository(db)
	clientRepository := NewClientRepository(db)
	propertyRepository := NewPropertyRepository(db)

	return Repository{
		AdminRepository:             adminRepository,
		ClientApplicationRepository: clientApplicationRepository,
		ClientUserRepository:        clientUserRepository,
		ClientRepository:            clientRepository,
		PropertyRepository:          propertyRepository,
	}
}
