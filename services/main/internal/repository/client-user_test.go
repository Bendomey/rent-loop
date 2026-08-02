package repository

import (
	"strings"
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// dryRunDB builds a postgres-dialect *gorm.DB that renders SQL without ever
// opening a connection, so scope tests assert on the exact statement the
// database would receive.
func dryRunDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(
		postgres.New(postgres.Config{DSN: "postgres://rentloop@127.0.0.1:5432/rentloop?sslmode=disable"}),
		&gorm.Config{DryRun: true, DisableAutomaticPing: true},
	)
	if err != nil {
		t.Fatalf("opening dry-run db: %v", err)
	}

	return db
}

// listClientUsersSQL renders the statement List and Count share for a filter.
func listClientUsersSQL(t *testing.T, filterQuery ListClientUsersFilter) string {
	t.Helper()

	var clientUsers []models.ClientUser
	statement := dryRunDB(t).
		Scopes(clientUserFilterScopes(filterQuery)...).
		Find(&clientUsers).
		Statement

	return statement.SQL.String()
}

func searchFor(query string, fields ...string) *lib.Search {
	return &lib.Search{Query: query, SearchFields: fields}
}

// The members list searches by the fields it renders -- name, email, phone
// number. Those moved off client_users onto the shared users row, so searching
// them against client_users is what produced
// `column client_users.name does not exist (SQLSTATE 42703)` on every keystroke.
func TestListClientUsersSearchesIdentityColumnsOnUsers(t *testing.T) {
	sql := listClientUsersSQL(t, ListClientUsersFilter{
		FilterQuery: lib.FilterQuery{Search: searchFor("ben", "name", "email", "phone_number")},
		ClientID:    "a7d2f5c1-0000-4000-8000-000000000000",
	})

	if strings.Contains(sql, "client_users.name") {
		t.Errorf("search still targets the dropped client_users.name column:\n%s", sql)
	}

	for _, column := range []string{"users.name ILIKE", "users.email ILIKE", "users.phone_number ILIKE"} {
		if !strings.Contains(sql, column) {
			t.Errorf("want search on %q, got:\n%s", column, sql)
		}
	}
}

// The users row is only reachable through a join, and both the user filters and
// the identity search want it. Adding it twice is a "table name users specified
// more than once" error, so the join has to be applied once for the whole query.
func TestListClientUsersJoinsUsersExactlyOnceWhenSearchAndFilterOverlap(t *testing.T) {
	email := "member@example.com"
	sql := listClientUsersSQL(t, ListClientUsersFilter{
		FilterQuery: lib.FilterQuery{Search: searchFor("ben", "name")},
		ClientID:    "a7d2f5c1-0000-4000-8000-000000000000",
		UserEmail:   &email,
	})

	if joins := strings.Count(sql, "JOIN users"); joins != 1 {
		t.Errorf("want exactly 1 users join, got %d:\n%s", joins, sql)
	}

	if !strings.Contains(sql, "users.email = ") {
		t.Errorf("want the user email filter preserved, got:\n%s", sql)
	}
}

// Columns that really do live on client_users must keep being searched there,
// and must not drag in a join they do not need.
func TestListClientUsersSearchesOwnColumnsWithoutJoiningUsers(t *testing.T) {
	sql := listClientUsersSQL(t, ListClientUsersFilter{
		FilterQuery: lib.FilterQuery{Search: searchFor("OWNER", "role")},
		ClientID:    "a7d2f5c1-0000-4000-8000-000000000000",
	})

	if !strings.Contains(sql, "client_users.role ILIKE") {
		t.Errorf("want search on client_users.role, got:\n%s", sql)
	}

	if strings.Contains(sql, "JOIN users") {
		t.Errorf("client_users-only search should not join users:\n%s", sql)
	}
}

// A field naming no column anywhere is exactly what took this endpoint down.
// Dropping it keeps the list responding -- narrowed to nothing, the same way
// SearchScope already handles fields that fail validation -- instead of 500ing.
func TestListClientUsersDropsSearchFieldsThatAreNotColumns(t *testing.T) {
	sql := listClientUsersSQL(t, ListClientUsersFilter{
		FilterQuery: lib.FilterQuery{Search: searchFor("ben", "full_name")},
		ClientID:    "a7d2f5c1-0000-4000-8000-000000000000",
	})

	if strings.Contains(sql, "full_name") {
		t.Errorf("unknown search field leaked into SQL:\n%s", sql)
	}

	if !strings.Contains(sql, "1 = 0") {
		t.Errorf("want the search to match nothing, got:\n%s", sql)
	}
}

// Preloading User is how the portals get a member's name onto the row; the
// scopes must not disturb it.
func TestListClientUsersLeavesNonSearchFiltersIntact(t *testing.T) {
	status := "ClientUser.Status.Active"
	sql := listClientUsersSQL(t, ListClientUsersFilter{
		ClientID: "a7d2f5c1-0000-4000-8000-000000000000",
		Status:   &status,
	})

	if !strings.Contains(sql, "client_users.client_id = ") {
		t.Errorf("want the client scope preserved, got:\n%s", sql)
	}

	if !strings.Contains(sql, "client_users.status = ") {
		t.Errorf("want the status filter preserved, got:\n%s", sql)
	}

	if strings.Contains(sql, "JOIN users") {
		t.Errorf("no user filter or search was requested, so no join belongs here:\n%s", sql)
	}
}
