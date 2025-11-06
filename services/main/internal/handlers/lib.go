package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/sirupsen/logrus"
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
		encodeErr := json.NewEncoder(w).Encode(map[string]any{
			"errors": map[string]string{
				"message": det.Message,
			},
		})
		logrus.Error(encodeErr.Error())

		return
	}

	w.WriteHeader(http.StatusBadRequest)
	encodeErr := json.NewEncoder(w).Encode(map[string]any{
		"errors": map[string]string{
			"message": err.Error(),
		},
	})

	logrus.Error(encodeErr.Error())
}
