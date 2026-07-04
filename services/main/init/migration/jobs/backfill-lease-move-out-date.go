package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// BackfillLeaseMoveOutDate populates move_out_date for all existing leases
// so the move-out reminder and auto-completion crons have data to work with
// immediately. EndDate is calculated from MoveInDate + (StayDuration ×
// StayDurationFrequency), mirroring BackfillUnitDateBlocksFromLeases.
// Open-ended leases (no duration) get MoveOutDate = '2099-01-01'.
func BackfillLeaseMoveOutDate() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202607040003_BACKFILL_LEASE_MOVE_OUT_DATE",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`
				UPDATE leases l
				SET move_out_date = CASE
					WHEN l.stay_duration IS NULL OR l.stay_duration = 0 OR l.stay_duration_frequency = ''
						THEN '2099-01-01'::date
					WHEN lower(l.stay_duration_frequency) IN ('hours', 'hour')
						THEN (l.move_in_date + (l.stay_duration || ' hours')::interval)
					WHEN lower(l.stay_duration_frequency) IN ('days', 'day')
						THEN (l.move_in_date + (l.stay_duration || ' days')::interval)
					WHEN lower(l.stay_duration_frequency) IN ('months', 'month')
						THEN (l.move_in_date + (l.stay_duration || ' months')::interval)
					ELSE '2099-01-01'::date
				END
				WHERE l.deleted_at IS NULL
				  AND l.move_in_date IS NOT NULL
				  AND l.move_out_date IS NULL
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`UPDATE leases SET move_out_date = NULL`).Error
		},
	}
}
