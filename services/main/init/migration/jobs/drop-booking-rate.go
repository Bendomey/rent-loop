package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// DropBookingRateAndCurrency removes the redundant rate and currency columns from bookings.
// Both fields are authoritative on the linked invoice's BOOKING_FEE line item.
// Before dropping, it backfills invoices for any bookings that have none,
// using the existing rate/currency values and stay dates to compute the line item.
func DropBookingRateAndCurrency() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202606260001_DROP_BOOKING_RATE_AND_CURRENCY",
		Migrate: func(db *gorm.DB) error {
			// 1. For every booking without a linked invoice, create a DRAFT invoice
			//    and a single BOOKING_FEE line item from the existing rate/currency columns.
			if err := db.Exec(`
				DO $$
				DECLARE
					r          RECORD;
					inv_id     UUID;
					inv_code   TEXT;
					hours      FLOAT;
					quantity   BIGINT;
					unit_rate  BIGINT;
					total_amt  BIGINT;
					freq_label TEXT;
				BEGIN
					FOR r IN
						SELECT
							b.id             AS booking_id,
							b.rate,
							b.currency,
							b.check_in_date,
							b.check_out_date,
							b.stay_frequency,
							b.property_id,
							u.name           AS unit_name,
							p.client_id      AS client_id
						FROM bookings b
						JOIN units      u ON u.id = b.unit_id     AND u.deleted_at IS NULL
						JOIN properties p ON p.id = b.property_id AND p.deleted_at IS NULL
						WHERE b.deleted_at IS NULL
						  AND NOT EXISTS (
							SELECT 1 FROM invoices i
							WHERE  i.context_booking_id = b.id
							  AND  i.deleted_at IS NULL
						)
					LOOP
						hours     := EXTRACT(EPOCH FROM (r.check_out_date - r.check_in_date)) / 3600.0;
						unit_rate := r.rate;

						CASE r.stay_frequency
							WHEN 'HOURLY'  THEN quantity := CEIL(hours)::BIGINT;         freq_label := 'hours';
							WHEN 'DAILY'   THEN quantity := CEIL(hours / 24.0)::BIGINT;  freq_label := 'nights';
							WHEN 'WEEKLY'  THEN quantity := CEIL(hours / 168.0)::BIGINT; freq_label := 'weeks';
							WHEN 'MONTHLY' THEN quantity := CEIL(hours / 720.0)::BIGINT; freq_label := 'months';
							ELSE                quantity := 1;                            freq_label := 'nights';
						END CASE;

						IF quantity < 1 THEN quantity := 1; END IF;
						total_amt := quantity * unit_rate;

						inv_id   := uuid_generate_v4();
						inv_code := 'INV-' || TO_CHAR(NOW(), 'YYMM') || '-' ||
									UPPER(SUBSTRING(MD5(inv_id::TEXT) FROM 1 FOR 6));

						INSERT INTO invoices (
							id, code,
							client_id, property_id,
							payer_type, payee_type, payee_client_id,
							context_type, context_booking_id,
							total_amount, sub_total, taxes,
							currency, status,
							allowed_payment_rails,
							created_at, updated_at
						) VALUES (
							inv_id, inv_code,
							r.client_id, r.property_id,
							'GUEST', 'PROPERTY_OWNER', r.client_id,
							'BOOKING_FEE', r.booking_id,
							total_amt, total_amt, 0,
							r.currency, 'DRAFT',
							ARRAY['OFFLINE'],
							NOW(), NOW()
						);

						INSERT INTO invoice_line_items (
							id, invoice_id,
							label, category,
							quantity, unit_amount, total_amount, currency,
							created_at, updated_at
						) VALUES (
							uuid_generate_v4(), inv_id,
							'Booking for ' || r.unit_name || ' for ' || quantity || ' ' || freq_label,
							'BOOKING_FEE',
							quantity, unit_rate, total_amt, r.currency,
							NOW(), NOW()
						);
					END LOOP;
				END $$;
			`).Error; err != nil {
				return err
			}

			// 2. Drop the now-redundant columns.
			if err := db.Exec(`ALTER TABLE bookings DROP COLUMN IF EXISTS rate`).Error; err != nil {
				return err
			}
			return db.Exec(`ALTER TABLE bookings DROP COLUMN IF EXISTS currency`).Error
		},
		Rollback: func(db *gorm.DB) error {
			// Re-add both columns and best-effort backfill from the BOOKING_FEE line item.
			if err := db.Exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rate BIGINT NOT NULL DEFAULT 0`).Error; err != nil {
				return err
			}
			if err := db.Exec(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'GHS'`).Error; err != nil {
				return err
			}
			return db.Exec(`
				UPDATE bookings b
				SET    rate     = ili.unit_amount,
				       currency = ili.currency
				FROM   invoices i
				JOIN   invoice_line_items ili
					ON  ili.invoice_id = i.id
					AND ili.category   = 'BOOKING_FEE'
					AND ili.deleted_at IS NULL
				WHERE  i.context_booking_id = b.id
				  AND  i.deleted_at IS NULL
			`).Error
		},
	}
}
