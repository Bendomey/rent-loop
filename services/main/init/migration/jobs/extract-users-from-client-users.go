package jobs

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

func ExtractUsersFromClientUsers() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604020001_EXTRACT_USERS_FROM_CLIENT_USERS",
		Migrate: func(db *gorm.DB) error {
			// 1. Create users table - already done.
			// 2. Add user_id column (nullable first, for backfill)
			if err := db.Exec(`ALTER TABLE client_users ADD COLUMN IF NOT EXISTS user_id UUID`).Error; err != nil {
				return err
			}

			// 3. Insert a user row for each unique email across all client_users
			if err := db.Exec(`
				INSERT INTO users (id, name, email, phone_number, password, created_at, updated_at)
				SELECT DISTINCT ON (email)
					uuid_generate_v4(), name, email, phone_number, password, NOW(), NOW()
				FROM client_users
				WHERE deleted_at IS NULL
				ON CONFLICT (email) DO NOTHING
			`).Error; err != nil {
				return err
			}

			// 4. Set user_id on each client_user row
			if err := db.Exec(`
				UPDATE client_users
				SET user_id = users.id
				FROM users
				WHERE client_users.email = users.email
				AND client_users.deleted_at IS NULL
			`).Error; err != nil {
				return err
			}

			// 5. Make user_id NOT NULL
			if err := db.Exec(`ALTER TABLE client_users ALTER COLUMN user_id SET NOT NULL`).Error; err != nil {
				return err
			}

			// 6. Add unique composite index (user_id, client_id)
			if err := db.Exec(`
				CREATE UNIQUE INDEX IF NOT EXISTS idx_client_users_user_client
				ON client_users (user_id, client_id)
				WHERE deleted_at IS NULL
			`).Error; err != nil {
				return err
			}

			// 7. Drop auth columns from client_users
			for _, col := range []string{"name", "email", "phone_number", "password"} {
				if err := DropColumnIfExists(db, &models.ClientUser{}, col); err != nil {
					return err
				}
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			for _, stmt := range []string{
				`ALTER TABLE client_users ADD COLUMN IF NOT EXISTS name VARCHAR NOT NULL DEFAULT ''`,
				`ALTER TABLE client_users ADD COLUMN IF NOT EXISTS email VARCHAR NOT NULL DEFAULT ''`,
				`ALTER TABLE client_users ADD COLUMN IF NOT EXISTS phone_number VARCHAR NOT NULL DEFAULT ''`,
				`ALTER TABLE client_users ADD COLUMN IF NOT EXISTS password VARCHAR NOT NULL DEFAULT ''`,
				`DROP INDEX IF EXISTS idx_client_users_user_client`,
				`ALTER TABLE client_users DROP COLUMN IF EXISTS user_id`,
			} {
				if err := db.Exec(stmt).Error; err != nil {
					return err
				}
			}
			return nil
		},
	}
}
