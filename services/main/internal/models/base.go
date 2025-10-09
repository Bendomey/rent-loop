package models

import (
	"time"

	"github.com/gofrs/uuid"
	"gorm.io/gorm"
)

// BaseModel defines the common columns that all db structs should hold, usually
// db structs based on this have no soft delete
type BaseModel struct {
	// ID should use uuid_generate_v4() for the pk's
	ID        uuid.UUID `gorm:"primary_key;type:uuid;default:uuid_generate_v4()"`
	CreatedAt time.Time `gorm:"index;not null;default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `gorm:"index;not null;default:CURRENT_TIMESTAMP"`
}

// BaseModelSoftDelete defines the common columns that all db structs should
// hold, usually. This struct also defines the fields for GORM triggers to
// detect the entity should soft delete
type BaseModelSoftDelete struct {
	BaseModel
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
