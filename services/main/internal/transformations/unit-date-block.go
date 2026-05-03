package transformations

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

func DBUnitDateBlockToRest(i *models.UnitDateBlock) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":         i.ID.String(),
		"unit_id":    i.UnitID,
		"start_date": i.StartDate,
		"end_date":   i.EndDate,
		"block_type": i.BlockType,
		"booking_id": i.BookingID,
		"lease_id":   i.LeaseID,
		"reason":     i.Reason,
		"created_at": i.CreatedAt,
	}
	return data
}
