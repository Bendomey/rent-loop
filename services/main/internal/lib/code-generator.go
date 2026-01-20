package lib

import (
	"fmt"
	"time"

	gonanoid "github.com/matoous/go-nanoid"
	"gorm.io/gorm"
)

func GenerateCode(db *gorm.DB, model any) (*string, error) {
	code, err := gonanoid.Generate("abcdefghijklmnopqrstuvwxyz1234567890", 6)
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
