package lib

import (
	"fmt"
	"regexp"
	"strings"

	gonanoid "github.com/matoous/go-nanoid"
)

func GenerateSlug(title string) (string, error) {
	slug := strings.ToLower(title)

	reInvalidChars := regexp.MustCompile(`[^a-z0-9\s-]`)
	slug = reInvalidChars.ReplaceAllString(slug, "")

	reSpaces := regexp.MustCompile(`\s+`)
	slug = reSpaces.ReplaceAllString(slug, "-")

	reMultipleHyphens := regexp.MustCompile(`-+`)
	slug = reMultipleHyphens.ReplaceAllString(slug, "-")

	slug = strings.Trim(slug, "-")

	randomSuffix, err := gonanoid.Generate("abcdefghijklmnopqrstuvwxyz1234567890", 10)
	if err != nil {
		return "", err
	}

	if slug == "" {
		return randomSuffix, nil
	}

	finalSlug := fmt.Sprintf("%s-%s", slug, randomSuffix)
	return finalSlug, nil
}
