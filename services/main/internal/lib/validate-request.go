package lib

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
)

func ValidateRequest(validate *validator.Validate, body interface{}, w http.ResponseWriter) bool {
	if err := validate.Struct(body); err != nil {
		errs := err.(validator.ValidationErrors)
		errorMessages := make(map[string]string)

		for _, e := range errs {
			errorMessages[strings.ToLower(e.Field())] = fmt.Sprintf("Failed validation rule '%s'", e.Tag())
		}

		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]any{
			"errors": errorMessages,
		})

		return false
	}

	return true
}
