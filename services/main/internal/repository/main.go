package repository

import "gorm.io/gorm"

type Repository struct {
	// ClientRepository           ClientRepository
}

func NewRepository(db *gorm.DB) Repository {

	// clientRepository := NewClientRepository(db)

	return Repository{
		// ClientRepository: clientRepository,
	}
}
