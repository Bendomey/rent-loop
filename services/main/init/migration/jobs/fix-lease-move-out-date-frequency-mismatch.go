package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// FixLeaseMoveOutDateFrequencyMismatch recomputes move_out_date for all
// leases. BackfillLeaseMoveOutDate (202607040003) matched
// stay_duration_frequency against "hours/days/months", but the column is
// actually populated with the HOURLY/DAILY/WEEKLY/MONTHLY/QUARTERLY/
// BIANNUALLY/ANNUALLY vocabulary (copied from unit.PaymentFrequency on
// tenant application creation), so every lease was silently defaulted to the
// 2099-01-01 open-ended sentinel. This recomputes move_out_date for every
// non-deleted lease using the corrected matching so it can overwrite the
// bad 2099-01-01 values left by that migration.
func FixLeaseMoveOutDateFrequencyMismatch() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202607040004_FIX_LEASE_MOVE_OUT_DATE_FREQUENCY_MISMATCH",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`
				UPDATE leases l
				SET move_out_date = CASE
					WHEN l.stay_duration IS NULL OR l.stay_duration = 0 OR l.stay_duration_frequency = ''
						THEN '2099-01-01'::date
					WHEN lower(l.stay_duration_frequency) IN ('hourly', 'hours', 'hour')
						THEN (l.move_in_date + (l.stay_duration || ' hours')::interval)
					WHEN lower(l.stay_duration_frequency) IN ('daily', 'days', 'day')
						THEN (l.move_in_date + (l.stay_duration || ' days')::interval)
					WHEN lower(l.stay_duration_frequency) IN ('weekly', 'weeks', 'week')
						THEN (l.move_in_date + (l.stay_duration || ' weeks')::interval)
					WHEN lower(l.stay_duration_frequency) IN ('monthly', 'months', 'month')
						THEN (l.move_in_date + (l.stay_duration || ' months')::interval)
					WHEN lower(l.stay_duration_frequency) = 'quarterly'
						THEN (l.move_in_date + ((l.stay_duration * 3) || ' months')::interval)
					WHEN lower(l.stay_duration_frequency) = 'biannually'
						THEN (l.move_in_date + ((l.stay_duration * 6) || ' months')::interval)
					WHEN lower(l.stay_duration_frequency) IN ('annually', 'yearly', 'years', 'year')
						THEN (l.move_in_date + (l.stay_duration || ' years')::interval)
					ELSE '2099-01-01'::date
				END
				WHERE l.deleted_at IS NULL
				  AND l.move_in_date IS NOT NULL
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`
				UPDATE leases
				SET move_out_date = '2099-01-01'::date
				WHERE deleted_at IS NULL AND move_in_date IS NOT NULL
			`).Error
		},
	}
}
