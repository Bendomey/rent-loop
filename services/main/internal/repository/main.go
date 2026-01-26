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
	PropertyBlockRepository      PropertyBlockRepository
	TenantApplicationRepository  TenantApplicationRepository
	TenantRepository             TenantRepository
	LeaseRepository              LeaseRepository
	TenantAccountRepository      TenantAccountRepository
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
	propertyBlockRepository := NewPropertyBlockRepository(db)
	tenantApplicationRepository := NewTenantApplicationRepository(db)
	tenantRepository := NewTenantRepository(db)
	leaseRepository := NewLeaseRepository(db)
	tenantAccountRepository := NewTenantAccountRepository(db)

	return Repository{
		AdminRepository:              adminRepository,
		ClientApplicationRepository:  clientApplicationRepository,
		ClientUserRepository:         clientUserRepository,
		ClientRepository:             clientRepository,
		PropertyRepository:           propertyRepository,
		ClientUserPropertyRepository: clientUserPropertyRepository,
		DocumentRepository:           documentRepository,
		UnitRepository:               unitRepository,
		PropertyBlockRepository:      propertyBlockRepository,
		TenantApplicationRepository:  tenantApplicationRepository,
		TenantRepository:             tenantRepository,
		LeaseRepository:              leaseRepository,
		TenantAccountRepository:      tenantAccountRepository,
	}
}
