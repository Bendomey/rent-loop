package lib

import (
	"fmt"
	"time"

	"github.com/getsentry/raven-go"
	gonanoid "github.com/matoous/go-nanoid"
	"gorm.io/gorm"
)

func GenerateCode(db *gorm.DB, model any) string {
	code, err := gonanoid.Generate("abcdefghijklmnopqrstuvwxyz1234567890", 6)
	if err != nil {
		raven.CaptureError(err, map[string]string{
			"function": "BeforeCreateTenantApplicationHook",
			"action":   "Generating a random suffix",
		})
		return ""
	}

	year, month, _ := time.Now().Date()
	uniqueCode := fmt.Sprintf("%02d%02d%s", year%100, month, code)

	codeExistsCount := int64(0)
	db.Model(model).Where("code = ?", uniqueCode).Count(&codeExistsCount)
	if codeExistsCount > 0 {
		return GenerateCode(db, model)
	}

	return uniqueCode
}
