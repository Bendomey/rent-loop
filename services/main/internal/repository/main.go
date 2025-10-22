package repository

import "gorm.io/gorm"

type Repository struct {
	AdminRepository             AdminRepository
	ClientApplicationRepository ClientApplicationRepository
	AdminRepository      AdminRepository
	ClientUserRepository ClientUserRepository
	ClientRepository     ClientRepository
}

func NewRepository(db *gorm.DB) Repository {
	adminRepository := NewAdminRepository(db)
	clientApplicationRepository := NewClientApplicationRepository(db)

	return Repository{
		AdminRepository:             adminRepository,
		ClientApplicationRepository: clientApplicationRepository,
	clientUserRepository := NewClientUserRepository(db)
	clientRepository := NewClientRepository(db)

	return Repository{
		AdminRepository:      adminRepository,
		ClientUserRepository: clientUserRepository,
		ClientRepository:     clientRepository,
	}
}
