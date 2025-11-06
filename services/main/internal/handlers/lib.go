package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/Bendomey/rent-loop/services/main/pkg"
)

func GetPopulateFields(r *http.Request) *[]string {
	var populateFields *[]string = nil
	populate := r.URL.Query().Get("populate")

	if populate != "" {
		fields := strings.Split(populate, ",")
		populateFields = &fields
	}

	return populateFields
}

// handle error response
func HandleErrorResponse[T error](w http.ResponseWriter, err T) {
	var det *pkg.IRentLoopError
	if errors.As(err, &det) {
		w.WriteHeader(det.Code)
		json.NewEncoder(w).Encode(map[string]any{
			"errors": map[string]string{
				"message": det.Message,
			},
		})
		return
	}

	w.WriteHeader(http.StatusBadRequest)
	json.NewEncoder(w).Encode(map[string]any{
		"errors": map[string]string{
			"message": err.Error(),
		},
	})
}
