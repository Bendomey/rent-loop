package repository

import (
	"strings"
	"sync"

	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

// populateSchemaCache backs schema parsing for populate validation. GORM keeps
// its own cache on the DB config but does not export it, so this mirrors it.
var populateSchemaCache = &sync.Map{}

// ApplyPopulate preloads the client-supplied `populate` paths that actually
// resolve to relations on model, and drops the ones that don't.
//
// Paths arrive verbatim off the `populate` query param. GORM fails the entire
// query with "unsupported relations for schema X" when a path names something
// that is not a relation, so one stale path turns every request into a 500 —
// not a response missing one relation. That is how removing MaintenanceRequest's
// Unit relation broke shipped mobile builds that still ask for "Unit": clients
// we cannot retroactively update, erroring on a list they used to load.
//
// Dropping unknown paths matches how SearchScope treats unknown search fields:
// the query still runs, and the relation the client asked for simply comes back
// empty.
func ApplyPopulate(db *gorm.DB, model any, populate *[]string) *gorm.DB {
	if populate == nil {
		return db
	}

	for _, path := range filterPopulatePaths(model, db.NamingStrategy, *populate) {
		db = db.Preload(path)
	}

	return db
}

// filterPopulatePaths returns the subset of paths that resolve to relations on
// model. If model's schema cannot be parsed at all, paths are returned
// untouched — that is the pre-existing behaviour, and passing an unvalidated
// path through is better than stripping every relation off the response.
func filterPopulatePaths(model any, namer schema.Namer, paths []string) []string {
	parsed, err := schema.Parse(model, populateSchemaCache, namer)
	if err != nil {
		return paths
	}

	kept := make([]string, 0, len(paths))
	for _, path := range paths {
		if relationPathExists(&parsed.Relationships, path) {
			kept = append(kept, path)
		}
	}

	return kept
}

// relationPathExists walks a dot-separated preload path one segment at a time,
// the same way GORM's preloadEntryPoint does, so a path is only kept when every
// segment resolves — including the nested ones GORM would fail on later against
// a different schema.
func relationPathExists(relationships *schema.Relationships, path string) bool {
	if strings.TrimSpace(path) == "" {
		return false
	}

	for _, segment := range strings.Split(path, ".") {
		if relationships == nil {
			return false
		}

		if embedded, ok := relationships.EmbeddedRelations[segment]; ok {
			relationships = embedded
			continue
		}

		relation, ok := relationships.Relations[segment]
		if !ok || relation.FieldSchema == nil {
			return false
		}

		relationships = &relation.FieldSchema.Relationships
	}

	return true
}
