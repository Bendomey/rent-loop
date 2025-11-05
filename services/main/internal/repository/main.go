package repository

import "gorm.io/gorm"

type Repository struct {
	AdminRepository              AdminRepository
	ClientApplicationRepository  ClientApplicationRepository
	ClientUserRepository         ClientUserRepository
	ClientRepository             ClientRepository
	PropertyRepository           PropertyRepository
	ClientUserPropertyRepository ClientUserPropertyRepository
	DocumentRepository           DocumentRepository
	UnitRepository               UnitRepository
}

func NewRepository(db *gorm.DB) Repository {
	adminRepository := NewAdminRepository(db)
	clientApplicationRepository := NewClientApplicationRepository(db)
	clientUserRepository := NewClientUserRepository(db)
	clientRepository := NewClientRepository(db)
	propertyRepository := NewPropertyRepository(db)
	clientUserPropertyRepository := NewClientUserPropertyRepository(db)
	documentRepository := NewDocumentRepository(db)
	unitRepository := NewUnitRepository(db)

	return Repository{
		AdminRepository:              adminRepository,
		ClientApplicationRepository:  clientApplicationRepository,
		ClientUserRepository:         clientUserRepository,
		ClientRepository:             clientRepository,
		PropertyRepository:           propertyRepository,
		ClientUserPropertyRepository: clientUserPropertyRepository,
		DocumentRepository:           documentRepository,
		UnitRepository:               unitRepository,
	}
}
