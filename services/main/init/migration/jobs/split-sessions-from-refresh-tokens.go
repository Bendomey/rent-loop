package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// SplitSessionsFromRefreshTokens moves everything describing a sign-in out of
// refresh_tokens and into its own sessions table.
//
// Before this, one signed-in session was a *chain* of refresh_tokens rows: each
// rotation inserted a new row and retired the old one via replaced_by_id,
// copying user_agent/ip_address/metadata forward verbatim. That made a
// session's identity change hourly, made its true sign-in time unknowable
// without walking the chain, and duplicated the two fattest columns on every
// refresh for the life of the session.
//
// Afterwards: sessions holds identity and is updated in place; refresh_tokens
// holds only the credential and is safe to prune.
//
// The backfill matters because the sign-in time is recoverable exactly right
// now — the root of each chain still exists — and never again once old rows
// start being pruned.
func SplitSessionsFromRefreshTokens() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202607310001_SPLIT_SESSIONS_FROM_REFRESH_TOKENS_V2",
		Migrate: func(db *gorm.DB) error {
			// The sessions table itself is created by AutoMigrate from the
			// models.Session struct, which runs before these jobs.

			// 1. Add session_id to refresh_tokens, nullable for the backfill.
			if err := db.Exec(
				`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS session_id UUID`,
			).Error; err != nil {
				return err
			}

			// 2. Walk every chain from its root and create one session per
			//    chain. A root is a row nothing rotated into; the tail (the row
			//    with revoked_at IS NULL) carries the session's current state.
			//
			//    Chains with no live tail are already signed out — they get a
			//    session row too, marked revoked, so their refresh_tokens have
			//    a valid FK target and reuse detection on an old token still
			//    resolves to something.
			if err := db.Exec(`
				WITH RECURSIVE roots AS (
					SELECT r.id, r.created_at, r.user_id
					FROM refresh_tokens r
					WHERE NOT EXISTS (
						SELECT 1 FROM refresh_tokens p WHERE p.replaced_by_id = r.id
					)
				),
				chain AS (
					SELECT
						roots.id           AS root_id,
						roots.created_at   AS signed_in_at,
						roots.user_id      AS user_id,
						roots.id           AS node_id,
						rt.replaced_by_id  AS next_id
					FROM roots
					JOIN refresh_tokens rt ON rt.id = roots.id

					UNION ALL

					SELECT
						c.root_id,
						c.signed_in_at,
						c.user_id,
						rt.id,
						rt.replaced_by_id
					FROM chain c
					JOIN refresh_tokens rt ON rt.id = c.next_id
				),
				tails AS (
					SELECT DISTINCT ON (c.root_id)
						c.root_id,
						c.signed_in_at,
						c.user_id,
						rt.id           AS tail_id,
						rt.user_agent,
						rt.ip_address,
						rt.metadata,
						rt.expires_at,
						rt.last_used_at,
						rt.revoked_at,
						rt.updated_at
					FROM chain c
					JOIN refresh_tokens rt ON rt.id = c.node_id
					ORDER BY c.root_id, (rt.revoked_at IS NULL) DESC, rt.created_at DESC
				)
				INSERT INTO sessions (
					id, user_id, created_at, updated_at,
					last_used_at, expires_at, revoked_at, revoked_reason,
					ip_address, user_agent, metadata
				)
				SELECT
					t.root_id,
					t.user_id,
					t.signed_in_at,
					t.updated_at,
					t.last_used_at,
					t.expires_at,
					t.revoked_at,
					CASE WHEN t.revoked_at IS NOT NULL THEN 'LOGOUT' ELSE NULL END,
					t.ip_address,
					t.user_agent,
					t.metadata
				FROM tails t
				ON CONFLICT (id) DO NOTHING
			`).Error; err != nil {
				return err
			}

			// 3. Stamp every refresh_tokens row with the session it belongs to.
			if err := db.Exec(`
				WITH RECURSIVE roots AS (
					SELECT r.id
					FROM refresh_tokens r
					WHERE NOT EXISTS (
						SELECT 1 FROM refresh_tokens p WHERE p.replaced_by_id = r.id
					)
				),
				chain AS (
					SELECT roots.id AS root_id, roots.id AS node_id, rt.replaced_by_id AS next_id
					FROM roots
					JOIN refresh_tokens rt ON rt.id = roots.id

					UNION ALL

					SELECT c.root_id, rt.id, rt.replaced_by_id
					FROM chain c
					JOIN refresh_tokens rt ON rt.id = c.next_id
				)
				UPDATE refresh_tokens
				SET session_id = chain.root_id
				FROM chain
				WHERE refresh_tokens.id = chain.node_id
			`).Error; err != nil {
				return err
			}

			// 4. Anything still unmatched cannot be attributed to a session
			//    (only possible if the chain is cyclic or the table was written
			//    to mid-migration). Drop it rather than leave an orphan with a
			//    NOT NULL about to be applied — a deleted refresh token costs
			//    one re-login, an inconsistent one costs a debugging session.
			if err := db.Exec(`DELETE FROM refresh_tokens WHERE session_id IS NULL`).Error; err != nil {
				return err
			}

			if err := db.Exec(
				`ALTER TABLE refresh_tokens ALTER COLUMN session_id SET NOT NULL`,
			).Error; err != nil {
				return err
			}

			// 5. Drop what now lives on sessions. expires_at goes too: the
			//    session owns expiry, and a token is valid only while its
			//    session is.
			for _, col := range []string{
				"user_id", "user_agent", "ip_address", "metadata",
				"replaced_by_id", "expires_at", "last_used_at",
			} {
				if err := db.Exec(
					`ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS ` + col,
				).Error; err != nil {
					return err
				}
			}

			return nil
		},
	}
}
