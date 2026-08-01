package repository

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"gorm.io/gorm"
)

func DateRangeScope(tableName string, dateRange *lib.DateRangeType) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if dateRange == nil {
			return db
		}

		columnName := fmt.Sprintf("%s.created_at", tableName)
		return db.Where(fmt.Sprintf("%s BETWEEN ? AND ?", columnName), dateRange.StartTime, dateRange.EndTime)
	}
}

// columnIdentifier matches a bare, unqualified column name. SearchFields comes
// straight off a client-supplied `search_fields` query param and is
// interpolated into SQL, so anything outside this shape is dropped.
var columnIdentifier = regexp.MustCompile(`^[a-z_][a-z0-9_]*$`)

func SearchScope(tableName string, search *lib.Search) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if search == nil || search.Query == "" {
			return db
		}

		conditions := make([]string, 0, len(search.SearchFields))
		args := make([]any, 0, len(search.SearchFields))

		for _, field := range search.SearchFields {
			if !columnIdentifier.MatchString(field) {
				continue
			}

			conditions = append(conditions, fmt.Sprintf("%s.%s ILIKE ?", tableName, field))
			args = append(args, fmt.Sprintf("%%%s%%", search.Query))
		}

		// The caller asked to narrow by search and no field survived validation.
		// Match nothing rather than fall through unfiltered, so a malformed
		// search never widens the result set.
		if len(conditions) == 0 {
			return db.Where("1 = 0")
		}

		// The OR terms must be one grouped expression. Chaining .Where().Or()
		// appends them to the surrounding WHERE list instead, where AND/OR
		// precedence reassociates them as
		// "(otherFilters AND field1) OR field2 OR field3" — leaking rows that
		// every other scope (property, tenancy, status, date range) excluded.
		return db.Where("("+strings.Join(conditions, " OR ")+")", args...)
	}
}

func PaginationScope(page int, pageSize int) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if page < 1 {
			page = 1
		}
		if pageSize <= 0 {
			pageSize = 10
		}

		offset := (page - 1) * pageSize
		return db.Offset(offset).Limit(pageSize)
	}
}

func OrderScope(tableName string, orderBy string, order string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if orderBy == "" || order == "" {
			return db.Order(fmt.Sprintf("%s.created_at desc", tableName))
		}

		return db.Order(fmt.Sprintf("%s %s", orderBy, order))
	}
}

func ClientFilterScope(tableName string, clientId string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if clientId == "" {
			return db
		}
		return db.Where(fmt.Sprintf("%s.client_id = ?", tableName), clientId)
	}
}

func IDsFilterScope(tableName string, ids *[]string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if ids == nil || len(*ids) == 0 {
			return db
		}
		return db.Where(fmt.Sprintf("%s.id IN (?)", tableName), *ids)
	}
}

func accessiblePropertyIDsSubQuery(db *gorm.DB, clientUserID string) *gorm.DB {
	return db.Session(&gorm.Session{NewDB: true}).
		Table("client_user_properties").
		Select("property_id").
		Where("client_user_id = ? AND deleted_at IS NULL", clientUserID)
}
