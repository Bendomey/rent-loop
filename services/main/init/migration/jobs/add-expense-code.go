package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func AddExpenseCode() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202603300001_ADD_EXPENSE_CODE",
		Migrate: func(db *gorm.DB) error {
			// 1. Add nullable column first
			if err := db.Exec(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS code TEXT`).Error; err != nil {
				return err
			}

			// 2. Backfill existing rows — generate EXP-YYMM-XXXXXX codes from created_at
			if err := db.Exec(`
				DO $$
				DECLARE
					r RECORD;
					new_code TEXT;
					suffix TEXT;
				BEGIN
					FOR r IN SELECT id, created_at FROM expenses WHERE code IS NULL LOOP
						LOOP
							suffix := upper(substr(md5(random()::text || r.id::text), 1, 6));
							new_code := 'EXP-' || to_char(r.created_at, 'YYMM') || '-' || suffix;
							EXIT WHEN NOT EXISTS (SELECT 1 FROM expenses WHERE code = new_code);
						END LOOP;
						UPDATE expenses SET code = new_code WHERE id = r.id;
					END LOOP;
				END $$;
			`).Error; err != nil {
				return err
			}

			// 3. Add NOT NULL constraint and unique index
			if err := db.Exec(`ALTER TABLE expenses ALTER COLUMN code SET NOT NULL`).Error; err != nil {
				return err
			}
			return db.Exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_code ON expenses(code)`).Error
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(`DROP INDEX IF EXISTS idx_expenses_code`).Error; err != nil {
				return err
			}
			return db.Exec(`ALTER TABLE expenses DROP COLUMN IF EXISTS code`).Error
		},
	}
}
