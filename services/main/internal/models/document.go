package models

import (
	"github.com/lib/pq"
	"gorm.io/datatypes"
)

// Document represents a document in the system
type Document struct {
	BaseModelSoftDelete

	Type string `gorm:"not null"` // TEMPLATE | DOCUMENT

	Title string `gorm:"not null"`
	Size  int64  `gorm:"not null;"` // in bytes

	Content datatypes.JSON `gorm:"type:jsonb;not null;"`
	Tags    pq.StringArray `gorm:"type:text[];default:'{}'"` // LEASE_AGREEMENT | LEASE_RENEWAL | LEASE_EXTENSION | LEASE_EXTENSION | INSPECTION_REPORT | OTHER

	PropertyID *string `gorm:"index;"`
	Property   *Property

	CreatedByID string `gorm:"not null"`
	CreatedBy   *ClientUser

	UpdatedByID *string
	UpdatedBy   *ClientUser
}
