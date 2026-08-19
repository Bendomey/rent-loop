package lib

import (
	"fmt"
	"time"

	gonanoid "github.com/matoous/go-nanoid"
	"gorm.io/gorm"
)

func GenerateCode(db *gorm.DB, model any) (*string, error) {
	code, err := gonanoid.Generate("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", 6)
	if err != nil {
		return nil, err
	}

	year, month, _ := time.Now().Date()
	uniqueCode := fmt.Sprintf("%02d%02d%s", year%100, month, code)

	codeExistsCount := int64(0)
	db.Model(model).Where("code = ?", uniqueCode).Count(&codeExistsCount)
	if codeExistsCount > 0 {
		return GenerateCode(db, model)
	}

	return &uniqueCode, nil
}

// FormatPrefixedCode renders the prefixed house code shape: PREFIX-YYMM-XXXXXX.
//
// Kept separate from the generation so the shape can be asserted without a
// database, and so a backfill can render a code for an instant other than now.
func FormatPrefixedCode(prefix string, at time.Time, suffix string) string {
	year, month, _ := at.Date()

	return fmt.Sprintf("%s-%02d%02d-%s", prefix, year%100, month, suffix)
}

// GeneratePrefixedCodeAt mints a unique PREFIX-YYMM-XXXXXX code, dating it from
// `at` rather than the wall clock.
//
// The instant is a parameter because a backfill wants each row's own
// created_at: codes that all read the month of the migration would throw away
// the one piece of information the date segment carries.
func GeneratePrefixedCodeAt(db *gorm.DB, model any, prefix string, at time.Time) (*string, error) {
	suffix, err := gonanoid.Generate("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", 6)
	if err != nil {
		return nil, err
	}

	uniqueCode := FormatPrefixedCode(prefix, at, suffix)

	codeExistsCount := int64(0)
	db.Model(model).Where("code = ?", uniqueCode).Count(&codeExistsCount)

	if codeExistsCount > 0 {
		return GeneratePrefixedCodeAt(db, model, prefix, at)
	}

	return &uniqueCode, nil
}

// GeneratePrefixedCode mints a unique PREFIX-YYMM-XXXXXX code dated now.
func GeneratePrefixedCode(db *gorm.DB, model any, prefix string) (*string, error) {
	return GeneratePrefixedCodeAt(db, model, prefix, time.Now())
}

func GenerateCheckInCode() (string, error) {
	code, err := gonanoid.Generate("0123456789", 5)
	if err != nil {
		return "", err
	}
	return code, nil
}
