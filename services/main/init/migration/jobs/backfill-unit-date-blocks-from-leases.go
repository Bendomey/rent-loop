package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// BackfillUnitDateBlocksFromLeases creates UnitDateBlock rows for all
// active and pending leases so the availability calendar starts accurate.
// EndDate is calculated from MoveInDate + (StayDuration × StayDurationFrequency).
// Open-ended leases (no duration) get EndDate = '2099-01-01'.
func BackfillUnitDateBlocksFromLeases() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604230004_BACKFILL_UNIT_DATE_BLOCKS_FROM_LEASES",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`
				INSERT INTO unit_date_blocks (
					unit_id, start_date, end_date, block_type, lease_id, reason
				)
				SELECT
					l.unit_id,
					l.move_in_date::date AS start_date,
					CASE
						WHEN l.stay_duration IS NULL OR l.stay_duration = 0 OR l.stay_duration_frequency = ''
							THEN '2099-01-01'::date
						WHEN lower(l.stay_duration_frequency) IN ('hours', 'hour')
							THEN (l.move_in_date + (l.stay_duration || ' hours')::interval)::date
						WHEN lower(l.stay_duration_frequency) IN ('days', 'day')
							THEN (l.move_in_date + (l.stay_duration || ' days')::interval)::date
						WHEN lower(l.stay_duration_frequency) IN ('months', 'month')
							THEN (l.move_in_date + (l.stay_duration || ' months')::interval)::date
						ELSE '2099-01-01'::date
					END AS end_date,
					'LEASE' AS block_type,
					l.id AS lease_id,
					'Active lease (backfill)' AS reason
				FROM leases l
				WHERE l.deleted_at IS NULL
				  AND l.status IN ('Lease.Status.Pending', 'Lease.Status.Active')
				  AND l.move_in_date IS NOT NULL
				ON CONFLICT DO NOTHING
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(
				`DELETE FROM unit_date_blocks WHERE block_type = 'LEASE' AND reason = 'Active lease (backfill)'`,
			).Error
		},
	}
}
