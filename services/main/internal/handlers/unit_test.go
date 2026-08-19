package handlers

import (
	"encoding/json"
	"testing"
)

// A plain *string collapses "omitted" and "null", which is how a rename wiped a
// unit's description.
func TestUpdateUnitRequestSeparatesOmittedFromNull(t *testing.T) {
	tests := []struct {
		name      string
		body      string
		wantIsSet bool
		wantNil   bool
		wantValue string
	}{
		{name: "omitted", body: `{"name":"Room 3"}`, wantIsSet: false, wantNil: true},
		{name: "explicit null", body: `{"description":null}`, wantIsSet: true, wantNil: true},
		{
			name:      "value",
			body:      `{"description":"Chamber and hall"}`,
			wantIsSet: true,
			wantNil:   false,
			wantValue: "Chamber and hall",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			var body UpdateUnitRequest
			if err := json.Unmarshal([]byte(test.body), &body); err != nil {
				t.Fatalf("decoding %s: %v", test.body, err)
			}

			if body.Description.IsSet != test.wantIsSet {
				t.Errorf("IsSet = %v, want %v", body.Description.IsSet, test.wantIsSet)
			}

			if (body.Description.Ptr() == nil) != test.wantNil {
				t.Errorf("Ptr() nil = %v, want %v", body.Description.Ptr() == nil, test.wantNil)
			}

			if !test.wantNil && body.Description.Get() != test.wantValue {
				t.Errorf("Get() = %q, want %q", body.Description.Get(), test.wantValue)
			}
		})
	}
}

func TestUpdateUnitRequestAreaIsTriState(t *testing.T) {
	var omitted UpdateUnitRequest
	if err := json.Unmarshal([]byte(`{"name":"Room 3"}`), &omitted); err != nil {
		t.Fatalf("decoding omitted area: %v", err)
	}
	if omitted.Area.IsSet {
		t.Error("area IsSet on a body that never mentions it")
	}

	var cleared UpdateUnitRequest
	if err := json.Unmarshal([]byte(`{"area":null}`), &cleared); err != nil {
		t.Fatalf("decoding null area: %v", err)
	}
	if !cleared.Area.IsSet || cleared.Area.Ptr() != nil {
		t.Errorf("null area: IsSet = %v, Ptr = %v, want true and nil", cleared.Area.IsSet, cleared.Area.Ptr())
	}

	var set UpdateUnitRequest
	if err := json.Unmarshal([]byte(`{"area":120.5}`), &set); err != nil {
		t.Fatalf("decoding area value: %v", err)
	}
	if !set.Area.IsSet || set.Area.Get() != 120.5 {
		t.Errorf("area = %v (IsSet %v), want 120.5", set.Area.Get(), set.Area.IsSet)
	}
}
