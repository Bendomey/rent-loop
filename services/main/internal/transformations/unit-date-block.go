package transformations

import (
	"github.com/Bendomey/rent-loop/services/main/internal/lib/availability"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type AdminOutputUnitDateBlock struct {
	ID            string  `json:"id"`
	UnitID        string  `json:"unit_id"`
	StartDate     string  `json:"start_date"`
	EndDate       string  `json:"end_date"`
	BlockType     string  `json:"block_type"`
	SlotsOccupied *int    `json:"slots_occupied,omitempty"`
	BookingID     *string `json:"booking_id,omitempty"`
	LeaseID       *string `json:"lease_id,omitempty"`
	Reason        *string `json:"reason,omitempty"`
	CreatedAt     string  `json:"created_at"`
}

type PublicOutputUnitDateBlock struct {
	ID        string  `json:"id"`
	StartDate string  `json:"start_date"`
	EndDate   string  `json:"end_date"`
	BlockType string  `json:"block_type"`
	Reason    *string `json:"reason,omitempty"`
}

func DBUnitDateBlockToRest(i *models.UnitDateBlock) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":             i.ID.String(),
		"unit_id":        i.UnitID,
		"start_date":     i.StartDate,
		"end_date":       i.EndDate,
		"block_type":     i.BlockType,
		"slots_occupied": i.SlotsOccupied,
		"booking_id":     i.BookingID,
		"lease_id":       i.LeaseID,
		"reason":         i.Reason,
		"created_at":     i.CreatedAt,
	}
	return data
}

func DBUnitDateBlockToPublicRest(i *models.UnitDateBlock) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":         i.ID.String(),
		"start_date": i.StartDate,
		"end_date":   i.EndDate,
		"block_type": i.BlockType,
		"reason":     i.Reason,
	}
	return data
}

type OutputSaturatedRange struct {
	StartDate string `json:"start_date" example:"2026-09-01"`
	EndDate   string `json:"end_date"   example:"2026-09-10"`
}

func SaturatedRangesToRest(ranges []availability.SaturatedRange) []OutputSaturatedRange {
	out := make([]OutputSaturatedRange, 0, len(ranges))
	for _, r := range ranges {
		out = append(out, OutputSaturatedRange{
			StartDate: r.Start.Format("2006-01-02"),
			EndDate:   r.End.Format("2006-01-02"),
		})
	}
	return out
}
