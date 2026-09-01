package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// BackfillUnitDateBlocks makes unit_date_blocks tell the truth about every
// lease, so the availability guard can be trusted to read it.
//
// Four things are wrong in the table before this runs, and they are done
// together because the guard is only safe once all four are true:
//
//  1. Blocks written before slots_occupied existed are NULL, which the sweep
//     reads as holding the whole unit. One tenant would saturate a four-bed
//     room. A lease or a booking holds one bed.
//  2. Leases created before the write moved into CreateLease hold no block at
//     all, so they claim nothing.
//  3. End dates drifted. The earlier backfill's frequency arm did not
//     recognise 'MONTHLY' and fell through to a 2099-01-01 sentinel, and
//     nothing ever truncated a block when its lease was terminated early. A
//     block running to 2099 makes its unit unlettable forever.
//  4. A cancelled lease is a superseded term and must not hold a room.
//
// Every lease in this system is bounded — move_out_date is always set — so the
// term is read straight off the lease rather than recomputed from duration and
// frequency. That is what the drift in (3) came from.
//
// Manual MAINTENANCE/PERSONAL/OTHER blocks are left alone throughout: they are
// absolute by design and are not derived from a lease term.
func BackfillUnitDateBlocks() *gormigrate.Migration {
	// The days a lease actually holds: its term, cut short if it was
	// terminated early, and never inverted.
	const leaseEnd = `GREATEST(
		l.move_in_date::date,
		LEAST(l.move_out_date::date, COALESCE(l.terminated_at::date, l.move_out_date::date))
	)`

	return &gormigrate.Migration{
		ID: "202608310002_BACKFILL_UNIT_DATE_BLOCKS",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`
				UPDATE unit_date_blocks
				SET slots_occupied = 1
				WHERE slots_occupied IS NULL
				  AND deleted_at IS NULL
				  AND block_type IN ('LEASE', 'BOOKING')
			`).Error; err != nil {
				return err
			}

			if err := db.Exec(`
				DELETE FROM unit_date_blocks b
				USING leases l
				WHERE b.lease_id = l.id
				  AND b.block_type = 'LEASE'
				  AND l.status = 'Lease.Status.Cancelled'
			`).Error; err != nil {
				return err
			}

			if err := db.Exec(`
				INSERT INTO unit_date_blocks (
					unit_id, start_date, end_date, block_type, slots_occupied, lease_id, reason
				)
				SELECT
					l.unit_id,
					l.move_in_date::date,
					` + leaseEnd + `,
					'LEASE',
					1,
					l.id,
					'System block for lease #' || l.code || ' (backfill)'
				FROM leases l
				WHERE l.deleted_at IS NULL
				  AND l.status <> 'Lease.Status.Cancelled'
				  AND l.move_in_date IS NOT NULL
				  AND l.move_out_date IS NOT NULL
				  AND NOT EXISTS (
					SELECT 1 FROM unit_date_blocks b
					WHERE b.lease_id = l.id AND b.deleted_at IS NULL
				  )
				ON CONFLICT DO NOTHING
			`).Error; err != nil {
				return err
			}

			return db.Exec(`
				UPDATE unit_date_blocks b
				SET start_date = l.move_in_date::date,
				    end_date = ` + leaseEnd + `
				FROM leases l
				WHERE b.lease_id = l.id
				  AND b.deleted_at IS NULL
				  AND b.block_type = 'LEASE'
				  AND l.move_out_date IS NOT NULL
				  AND (
					b.start_date <> l.move_in_date::date
					OR b.end_date <> ` + leaseEnd + `
				  )
			`).Error
		},
		// Only the inserted rows can be given back. The dates this corrected
		// were the wrong ones, and the blocks it removed belonged to leases
		// that had been cancelled.
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`
				DELETE FROM unit_date_blocks
				WHERE block_type = 'LEASE'
				  AND lease_id IS NOT NULL
				  AND reason LIKE 'System block for lease #%(backfill)'
			`).Error
		},
	}
}
