package repository

import (
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm/schema"
)

func TestFilterPopulatePathsKeepsRealRelations(t *testing.T) {
	got := filterPopulatePaths(&models.MaintenanceRequest{}, schema.NamingStrategy{}, []string{
		"Assets",
		"Assets.Unit",
		"Assets.PropertyBlock",
		"AssignedWorker",
		"AssignedManager",
		"Property",
		"CreatedByTenant",
	})

	if len(got) != 7 {
		t.Fatalf("got %d paths (%v), want all 7 kept", len(got), got)
	}
}

// A relation the model no longer has is exactly what took ListAcrossProperties
// down: clients shipped before maintenance requests moved from a single Unit to
// Assets still ask for "Unit", and GORM fails the whole query rather than that
// one preload.
func TestFilterPopulatePathsDropsRelationsTheModelNoLongerHas(t *testing.T) {
	got := filterPopulatePaths(&models.MaintenanceRequest{}, schema.NamingStrategy{}, []string{
		"Unit",
		"AssignedWorker",
		"AssignedWorker.User",
		"AssignedManager",
		"AssignedManager.User",
	})

	for _, path := range got {
		if path == "Unit" {
			t.Fatalf("got %v, want \"Unit\" dropped", got)
		}
	}

	if len(got) == 0 {
		t.Fatalf("got %v, want the valid paths alongside it kept", got)
	}
}

// A nested path is only as good as its deepest segment — "Assets.Nope" fails the
// query on schema MaintenanceRequestAsset instead of MaintenanceRequest, but it
// fails it just the same.
func TestFilterPopulatePathsDropsUnknownNestedSegments(t *testing.T) {
	got := filterPopulatePaths(&models.MaintenanceRequest{}, schema.NamingStrategy{}, []string{
		"Assets.Nope",
		"Assets.Unit",
	})

	if len(got) != 1 || got[0] != "Assets.Unit" {
		t.Fatalf("got %v, want only [Assets.Unit]", got)
	}
}

func TestFilterPopulatePathsDropsGarbage(t *testing.T) {
	got := filterPopulatePaths(&models.MaintenanceRequest{}, schema.NamingStrategy{}, []string{
		"",
		"   ",
		"assets",  // GORM relation lookup is case-sensitive
		"Title",   // a column, not a relation
		"Assets;", // nothing sane, but it arrives off a query param
	})

	if len(got) != 0 {
		t.Fatalf("got %v, want nothing kept", got)
	}
}

// Pins the populate strings the shipped clients actually send. Every one of
// these must survive untouched — dropping a valid path would trade a 500 for a
// response quietly missing the relation the screen renders from.
func TestFilterPopulatePathsKeepsWhatClientsSend(t *testing.T) {
	cases := []struct {
		name  string
		model any
		paths []string
	}{
		{
			name:  "mobile board and web kanban",
			model: &models.MaintenanceRequest{},
			paths: []string{
				"Assets", "Assets.Unit", "Assets.PropertyBlock",
				"AssignedWorker", "AssignedWorker.User",
				"AssignedManager", "AssignedManager.User",
			},
		},
		{
			name:  "mobile and web detail screen",
			model: &models.MaintenanceRequest{},
			paths: []string{
				"Assets", "Assets.Unit", "Assets.PropertyBlock",
				"AssignedWorker", "AssignedWorker.User",
				"AssignedManager", "AssignedManager.User",
				"CreatedByTenant", "CreatedByClientUser.User",
			},
		},
		{
			name:  "comments tab",
			model: &models.MaintenanceRequestComment{},
			paths: []string{"CreatedByClientUser", "CreatedByClientUser.User"},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := filterPopulatePaths(tc.model, schema.NamingStrategy{}, tc.paths)
			if len(got) != len(tc.paths) {
				t.Fatalf("got %v, want all of %v", got, tc.paths)
			}
		})
	}
}

// Parsing failures must not silently empty every preload — an unvalidated path
// is still better than a response with no relations at all.
func TestFilterPopulatePathsPassesThroughWhenSchemaUnparseable(t *testing.T) {
	paths := []string{"Whatever"}
	got := filterPopulatePaths("not a model", schema.NamingStrategy{}, paths)

	if len(got) != 1 || got[0] != "Whatever" {
		t.Fatalf("got %v, want the input passed through untouched", got)
	}
}
