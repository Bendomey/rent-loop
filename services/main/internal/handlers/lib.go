package handlers

import (
	"net/http"
	"strings"
)

func getPopulateFields(r *http.Request) *[]string {
	var populateFields *[]string = nil
	populate := r.URL.Query().Get("populate")

	if populate != "" {
		fields := strings.Split(populate, ",")
		populateFields = &fields
	}

	return populateFields
}
