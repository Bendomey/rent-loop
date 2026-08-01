package repository

import (
	"strings"
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// dryRunDB builds a GORM handle that renders SQL without touching a database,
// so scope composition can be asserted on the generated statement.
func dryRunDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(
		postgres.New(postgres.Config{DriverName: "pgx", DSN: "sslmode=disable", WithoutQuotingCheck: true}),
		&gorm.Config{DryRun: true},
	)
	if err != nil {
		t.Fatalf("open dry-run db: %v", err)
	}

	return db
}

// renderSearchSQL applies a preceding filter scope and SearchScope to a bare
// query and returns the rendered WHERE clause.
func renderSearchSQL(t *testing.T, search *lib.Search) string {
	t.Helper()

	var out []map[string]any
	stmt := dryRunDB(t).
		Table("tenants").
		Scopes(
			// Stands in for any real narrowing filter (property scope, status,
			// date range) that a list query applies alongside search.
			func(db *gorm.DB) *gorm.DB { return db.Where("tenants.client_id = ?", "client-1") },
			SearchScope("tenants", search),
		).
		Find(&out).Statement

	return stmt.SQL.String()
}

// SearchScope must never let its OR terms escape into the surrounding WHERE
// list — an ungrouped OR reassociates as
// "(otherFilter AND field1) OR field2 OR field3" and silently returns rows the
// other filters excluded.
func TestSearchScopeGroupsOrTerms(t *testing.T) {
	sql := renderSearchSQL(t, &lib.Search{
		Query:        "john",
		SearchFields: []string{"first_name", "last_name", "email"},
	})

	if !strings.Contains(sql, "tenants.client_id = $1 AND (") {
		t.Errorf("search terms are not grouped behind the preceding filter.\nSQL: %s", sql)
	}

	for _, field := range []string{"first_name", "last_name", "email"} {
		if !strings.Contains(sql, "tenants."+field+" ILIKE") {
			t.Errorf("expected %q in search group.\nSQL: %s", field, sql)
		}
	}
}

// A single search field has no OR to group, but must still stay AND-ed to the
// preceding filters.
func TestSearchScopeSingleFieldStaysScoped(t *testing.T) {
	sql := renderSearchSQL(t, &lib.Search{Query: "john", SearchFields: []string{"first_name"}})

	if !strings.Contains(sql, "tenants.client_id = $1 AND") {
		t.Errorf("single-field search dropped the preceding filter.\nSQL: %s", sql)
	}
}

// SearchFields arrives from a client-supplied query param and is interpolated
// into SQL, so anything that is not a plain column identifier must be dropped
// rather than rendered.
func TestSearchScopeRejectsNonIdentifierFields(t *testing.T) {
	cases := []struct {
		name  string
		field string
	}{
		{name: "quote break-out", field: "first_name' OR '1'='1"},
		{name: "comment", field: "first_name--"},
		{name: "statement separator", field: "first_name; DROP TABLE tenants"},
		{name: "subquery", field: "(SELECT password FROM admins)"},
		{name: "qualified column", field: "admins.password"},
		{name: "whitespace", field: "first_name OR 1=1"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			sql := renderSearchSQL(t, &lib.Search{Query: "john", SearchFields: []string{tc.field}})

			if strings.Contains(sql, tc.field) {
				t.Errorf("unsafe field %q was interpolated into SQL.\nSQL: %s", tc.field, sql)
			}
		})
	}
}

// When every requested field is rejected the filter cannot be honoured. It must
// match nothing rather than fall through to an unfiltered result set, so a bad
// search never widens what the caller sees.
func TestSearchScopeWithNoValidFieldsMatchesNothing(t *testing.T) {
	sql := renderSearchSQL(t, &lib.Search{Query: "john", SearchFields: []string{"1=1", "; DROP TABLE tenants"}})

	if !strings.Contains(sql, "1 = 0") {
		t.Errorf("expected an impossible condition when no field survives validation.\nSQL: %s", sql)
	}
}

// Valid fields are kept even when they arrive alongside rejected ones.
func TestSearchScopeKeepsValidFieldsAlongsideRejected(t *testing.T) {
	sql := renderSearchSQL(t, &lib.Search{
		Query:        "john",
		SearchFields: []string{"first_name", "bad field'"},
	})

	if !strings.Contains(sql, "tenants.first_name ILIKE") {
		t.Errorf("valid field was dropped.\nSQL: %s", sql)
	}
	if strings.Contains(sql, "bad field") {
		t.Errorf("invalid field was interpolated.\nSQL: %s", sql)
	}
}

func TestSearchScopeNoopWithoutSearch(t *testing.T) {
	if sql := renderSearchSQL(t, nil); strings.Contains(sql, "ILIKE") {
		t.Errorf("nil search should add no condition.\nSQL: %s", sql)
	}

	emptyQuery := renderSearchSQL(t, &lib.Search{Query: "", SearchFields: []string{"first_name"}})
	if strings.Contains(emptyQuery, "ILIKE") {
		t.Errorf("empty query should add no condition.\nSQL: %s", emptyQuery)
	}
}
