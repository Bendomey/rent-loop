package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// BackfillUnitDateBlocksForAllLeases gives a block to every lease that has
// none, whatever its status.
//
// The original backfill filtered on Pending/Active and the runtime path only
// ever wrote on activation, so the two disagreed about when a block exists.
// Selecting on the missing row instead of the status makes this job
// independent of that history.
//
// Cancelled is the one exclusion: a cancelled lease releases its dates, so
// backfilling one would manufacture the claim the runtime removes.
//
// Terminated leases take their actual end, floored at move-in: a lease
// terminated before the tenant ever arrived collapses to a zero-width block
// rather than an inverted range no query can match.
//
// The frequency arm mirrors leaseEndDate exactly. It has to: a value it fails
// to recognise falls to the 2099 sentinel, and with the creation guard reading
// these rows that is a 73-year claim no later lease can get past.
//
// Backfilled rows carry a "(backfill)" suffix so the rollback can find them
// without deleting the blocks normal lease creation writes — those share the
// same reason prefix.
func BackfillUnitDateBlocksForAllLeases() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608310002_BACKFILL_UNIT_DATE_BLOCKS_ALL_LEASES",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`
				INSERT INTO unit_date_blocks (
					unit_id, start_date, end_date, block_type, slots_occupied, lease_id, reason
				)
				SELECT
					l.unit_id,
					l.move_in_date::date AS start_date,
					GREATEST(
						l.move_in_date::date,
						LEAST(
							CASE
								WHEN l.move_out_date IS NOT NULL THEN l.move_out_date::date
								WHEN l.stay_duration IS NULL OR l.stay_duration = 0 OR l.stay_duration_frequency = ''
									THEN '2099-01-01'::date
								WHEN lower(l.stay_duration_frequency) IN ('hourly', 'hours', 'hour')
									THEN (l.move_in_date + (l.stay_duration || ' hours')::interval)::date
								WHEN lower(l.stay_duration_frequency) IN ('daily', 'days', 'day')
									THEN (l.move_in_date + (l.stay_duration || ' days')::interval)::date
								WHEN lower(l.stay_duration_frequency) IN ('weekly', 'weeks', 'week')
									THEN (l.move_in_date + (l.stay_duration * 7 || ' days')::interval)::date
								WHEN lower(l.stay_duration_frequency) IN ('monthly', 'months', 'month')
									THEN (l.move_in_date + (l.stay_duration || ' months')::interval)::date
								WHEN lower(l.stay_duration_frequency) = 'quarterly'
									THEN (l.move_in_date + (l.stay_duration * 3 || ' months')::interval)::date
								WHEN lower(l.stay_duration_frequency) = 'biannually'
									THEN (l.move_in_date + (l.stay_duration * 6 || ' months')::interval)::date
								WHEN lower(l.stay_duration_frequency) IN ('annually', 'yearly', 'years', 'year')
									THEN (l.move_in_date + (l.stay_duration || ' years')::interval)::date
								ELSE '2099-01-01'::date
							END,
							COALESCE(l.terminated_at::date, '2099-01-01'::date)
						)
					) AS end_date,
					'LEASE' AS block_type,
					1 AS slots_occupied,
					l.id AS lease_id,
					'System block for lease #' || l.code || ' (backfill)' AS reason
				FROM leases l
				WHERE l.deleted_at IS NULL
				  AND l.status <> 'Lease.Status.Cancelled'
				  AND l.move_in_date IS NOT NULL
				  AND NOT EXISTS (
					SELECT 1 FROM unit_date_blocks b
					WHERE b.lease_id = l.id AND b.deleted_at IS NULL
				  )
				ON CONFLICT DO NOTHING
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`
				DELETE FROM unit_date_blocks
				WHERE block_type = 'LEASE'
				  AND lease_id IS NOT NULL
				  AND reason LIKE '%(backfill)'
			`).Error
		},
	}
}
