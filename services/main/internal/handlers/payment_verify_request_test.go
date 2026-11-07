package handlers

import (
	"encoding/json"
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
)

func TestVerifyPaymentRequestValidation(t *testing.T) {
	validate := lib.NewValidator()

	cases := []struct {
		name    string
		body    string
		wantErr bool
	}{
		{"declined payment is accepted", `{"is_successful": false}`, false},
		{"confirmed payment is accepted", `{"is_successful": true}`, false},
		{"decline with a reason is accepted", `{"is_successful": false, "metadata": {"reason": "no cash"}}`, false},
		{"missing flag is rejected", `{}`, true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var body VerifyPaymentRequest
			if err := json.Unmarshal([]byte(tc.body), &body); err != nil {
				t.Fatalf("unmarshal: %v", err)
			}
			err := validate.Struct(body)
			if (err != nil) != tc.wantErr {
				t.Fatalf("validate error = %v, wantErr %v", err, tc.wantErr)
			}
		})
	}
}
