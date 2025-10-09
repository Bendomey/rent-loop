package repository

import (
	"fmt"

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

func SearchScope(tableName string, search *lib.Search) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if search == nil || search.Query == "" {
			return db
		}

		results := db

		for index, singleQuery := range search.SearchFields {
			if index == 0 {
				results = results.Where(fmt.Sprintf("%s.%s ILIKE ?", tableName, singleQuery), fmt.Sprintf("%%%s%%", search.Query))
				continue
			}

			results = results.Or(fmt.Sprintf("%s.%s ILIKE ?", tableName, singleQuery), fmt.Sprintf("%%%s%%", search.Query))
		}

		return results
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
